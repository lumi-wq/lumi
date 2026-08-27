import { SHIPPING_FEE } from "@/lib/format";
import { quoteWarehouseShipping, searchCities } from "@/lib/novaposhta";

/**
 * Google приймає shipping.region лише для US / AU / JP.
 * Для України рахуємо тариф НП по великих містах і віддаємо одну ціну на всю країну
 * (найвищу з отриманих — щоб у рекламі не було дешевше, ніж на чекауті).
 */
const QUOTE_CITIES = [
  "Київ",
  "Львів",
  "Одеса",
  "Харків",
  "Дніпро",
  "Чернівці",
  "Запоріжжя",
  "Ужгород",
];

const cityRefCache = new Map<string, string | null>();
const quoteCache = new Map<string, number>();

function hryvniaToMicros(uah: number): string {
  return String(Math.round(uah) * 1_000_000);
}

function shippingRow(priceUah: number) {
  return {
    country: "UA",
    service: "Нова Пошта",
    price: {
      amountMicros: hryvniaToMicros(priceUah),
      currencyCode: "UAH",
    },
    minHandlingTime: 0,
    maxHandlingTime: 2,
    minTransitTime: 1,
    maxTransitTime: 4,
    handlingCutoffTime: "1600",
    handlingCutoffTimezone: "Europe/Kyiv",
  };
}

function pickCityRef(results: { name: string; cityRef: string }[], query: string): string | null {
  const q = query.toLowerCase();
  const match =
    results.find((c) => c.name.toLowerCase() === q) ||
    results.find((c) => c.name.toLowerCase().startsWith(q)) ||
    results.find((c) => c.name.toLowerCase().includes(q));
  return match?.cityRef ?? results[0]?.cityRef ?? null;
}

async function cityRefFor(query: string): Promise<string | null> {
  if (cityRefCache.has(query)) return cityRefCache.get(query) ?? null;
  try {
    const results = await searchCities(query);
    const ref = pickCityRef(results, query);
    cityRefCache.set(query, ref);
    return ref;
  } catch (err) {
    console.warn("[merchant] city lookup", query, err);
    cityRefCache.set(query, null);
    return null;
  }
}

async function npShippingUah(
  cityRef: string,
  weightKg: number,
  declaredCost: number
): Promise<number | null> {
  const key = `${cityRef}|${weightKg}|${Math.round(declaredCost)}`;
  const cached = quoteCache.get(key);
  if (cached != null) return cached;

  const quote = await quoteWarehouseShipping({
    cityRecipientRef: cityRef,
    weightKg,
    declaredCost,
    includeDeliveryDate: false,
  });
  if (quote.fallback || quote.shipping <= 0) return null;
  quoteCache.set(key, quote.shipping);
  return quote.shipping;
}

async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

export async function merchantShippingAttributes(weightKg: number, declaredCost: number) {
  const handlingDays = [{ country: "UA", businessDays: "Mon-Sat" }];

  if (!process.env.NOVA_POSHTA_API_KEY) {
    return {
      shipping: [shippingRow(SHIPPING_FEE)],
      shippingHandlingBusinessDays: handlingDays,
    };
  }

  const prices = (
    await pool(QUOTE_CITIES, 4, async (city) => {
      const cityRef = await cityRefFor(city);
      if (!cityRef || cityRef.startsWith("mock-city-")) return null;
      return npShippingUah(cityRef, weightKg, declaredCost);
    })
  ).filter((price): price is number => price != null);

  const priceUah = prices.length > 0 ? Math.max(...prices) : SHIPPING_FEE;

  return {
    shipping: [shippingRow(priceUah)],
    shippingHandlingBusinessDays: handlingDays,
  };
}
