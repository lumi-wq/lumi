import { SHIPPING_FEE } from "@/lib/format";
import { quoteWarehouseShipping, searchCities } from "@/lib/novaposhta";

/** ISO 3166-2 (без префікса UA), як у специфікації Google shipping.region. */
const FEED_DESTINATIONS: { region: string; city: string }[] = [
  { region: "30", city: "Київ" },
  { region: "32", city: "Біла Церква" },
  { region: "77", city: "Чернівці" },
  { region: "46", city: "Львів" },
  { region: "51", city: "Одеса" },
  { region: "63", city: "Харків" },
  { region: "12", city: "Дніпро" },
  { region: "23", city: "Запоріжжя" },
  { region: "05", city: "Вінниця" },
  { region: "53", city: "Полтава" },
  { region: "74", city: "Чернігів" },
  { region: "71", city: "Черкаси" },
  { region: "68", city: "Хмельницький" },
  { region: "18", city: "Житомир" },
  { region: "59", city: "Суми" },
  { region: "56", city: "Рівне" },
  { region: "26", city: "Івано-Франківськ" },
  { region: "61", city: "Тернопіль" },
  { region: "07", city: "Луцьк" },
  { region: "21", city: "Ужгород" },
  { region: "35", city: "Кропивницький" },
  { region: "48", city: "Миколаїв" },
  { region: "65", city: "Херсон" },
];

const cityRefCache = new Map<string, string | null>();
const quoteCache = new Map<string, number>();

function hryvniaToMicros(uah: number): string {
  return String(Math.round(uah) * 1_000_000);
}

function shippingRow(priceUah: number, region?: string) {
  return {
    country: "UA",
    ...(region ? { region } : {}),
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

  const regional = (
    await pool(FEED_DESTINATIONS, 4, async (dest) => {
      const cityRef = await cityRefFor(dest.city);
      if (!cityRef || cityRef.startsWith("mock-city-")) return null;
      const price = await npShippingUah(cityRef, weightKg, declaredCost);
      if (price == null) return null;
      return shippingRow(price, dest.region);
    })
  ).filter((row): row is ReturnType<typeof shippingRow> => row != null);

  const prices = regional.map((row) => Number(row.price.amountMicros) / 1_000_000);
  const fallback = prices.length > 0 ? Math.max(...prices) : SHIPPING_FEE;

  return {
    shipping: [shippingRow(fallback), ...regional],
    shippingHandlingBusinessDays: handlingDays,
  };
}
