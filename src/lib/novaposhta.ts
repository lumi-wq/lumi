/**
 * Інтеграція з українським API Нової Пошти (api.novaposhta.ua v2.0).
 * Ключ береться з бізнес-кабінету: new.novaposhta.ua → Налаштування → Безпека.
 * Документація: https://developers.novaposhta.ua
 *
 * Без ключа / при помилці API — локальний мок довідників.
 */

import {
  formatDeliveryDateUk,
  formatNpDate,
  getDispatchDate,
  parseNpDate,
} from "@/lib/dispatch-date";
import { SHIPPING_FEE } from "@/lib/format";

const NP_API = "https://api.novaposhta.ua/v2.0/json/";

/** Місто відправника LUMI — Сокиряни, Чернівецька обл. */
export const SENDER_CITY_QUERY = "Сокиряни";

export type City = {
  ref: string;
  name: string;
  /** CityRef для getDocumentPrice / getDocumentDeliveryDate (DeliveryCity) */
  cityRef: string;
};
export type Warehouse = { ref: string; description: string };

const MOCK_CITY_NAMES = [
  "Київ", "Харків", "Одеса", "Дніпро", "Львів", "Запоріжжя", "Кривий Ріг",
  "Миколаїв", "Вінниця", "Полтава", "Чернігів", "Черкаси", "Хмельницький",
  "Житомир", "Суми", "Рівне", "Івано-Франківськ", "Тернопіль", "Луцьк",
  "Ужгород", "Кропивницький", "Кременчук", "Біла Церква", "Мелітополь",
  "Бровари", "Ірпінь", "Буча", "Бориспіль", "Кам'янець-Подільський",
  "Мукачево", "Дрогобич", "Стрий", "Ковель", "Нововолинськ", "Умань",
  "Ніжин", "Славута", "Трускавець", "Чернівці", "Херсон", "Сокиряни",
];

const MOCK_CITIES: City[] = MOCK_CITY_NAMES.map((name, i) => ({
  ref: `mock-city-${i}`,
  name,
  cityRef: `mock-city-${i}`,
}));

const MOCK_WAREHOUSES = [
  "Відділення №1: вул. Центральна, 1",
  "Відділення №2: просп. Свободи, 24",
  "Відділення №5: вул. Шевченка, 108",
  "Відділення №12: вул. Хрещатик, 22",
  "Поштомат №1043: ТРЦ «Плазма», вул. Миру, 3",
  "Поштомат №2210: АТБ, вул. Садова, 17",
];

function mockSearchCities(query: string): City[] {
  const q = query.toLowerCase().trim();
  const starts = MOCK_CITIES.filter((c) => c.name.toLowerCase().startsWith(q));
  const contains = MOCK_CITIES.filter(
    (c) => !c.name.toLowerCase().startsWith(q) && c.name.toLowerCase().includes(q)
  );
  return [...starts, ...contains].slice(0, 10);
}

function mockWarehouses(cityRef: string): Warehouse[] {
  return MOCK_WAREHOUSES.map((description, i) => ({
    ref: `${cityRef}-wh-${i}`,
    description,
  }));
}

type NpResponse<T> = {
  success: boolean;
  data: T[];
  errors: string[];
};

async function npRequest<T>(model: string, method: string, props: object): Promise<T[]> {
  const apiKey = process.env.NOVA_POSHTA_API_KEY;
  if (!apiKey) throw new Error("NOVA_POSHTA_API_KEY не налаштований");

  const res = await fetch(NP_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey,
      modelName: model,
      calledMethod: method,
      methodProperties: props,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Nova Poshta API: HTTP ${res.status}`);
  const json = (await res.json()) as NpResponse<T>;
  if (!json.success) {
    throw new Error(`Nova Poshta API: ${(json.errors ?? []).join("; ") || "невідома помилка"}`);
  }
  return json.data ?? [];
}

export async function searchCities(query: string): Promise<City[]> {
  if (!process.env.NOVA_POSHTA_API_KEY) return mockSearchCities(query);
  try {
    const data = await npRequest<{ Ref: string; Description: string; AreaDescription?: string }>(
      "Address",
      "searchSettlements",
      { CityName: query, Limit: 10 }
    );
    type SettlementAddress = {
      Ref: string;
      Present: string;
      MainDescription: string;
      Area?: string;
      DeliveryCity?: string;
    };
    type SettlementWrap = { Addresses?: SettlementAddress[] };
    const wrap = data as unknown as SettlementWrap[];
    const addresses = wrap[0]?.Addresses ?? [];
    if (addresses.length > 0) {
      return addresses.map((a) => ({
        ref: a.Ref,
        cityRef: a.DeliveryCity || a.Ref,
        name: a.Present || (a.Area ? `${a.MainDescription} (${a.Area})` : a.MainDescription),
      }));
    }
    const cities = await npRequest<{ Ref: string; Description: string; AreaDescription?: string }>(
      "Address",
      "getCities",
      { FindByString: query, Limit: 10 }
    );
    return cities.map((c) => ({
      ref: c.Ref,
      cityRef: c.Ref,
      name: c.AreaDescription ? `${c.Description} (${c.AreaDescription})` : c.Description,
    }));
  } catch (err) {
    console.warn(
      `[Нова Пошта] ${err instanceof Error ? err.message : err} — використовую локальний довідник міст`
    );
    return mockSearchCities(query);
  }
}

export async function getWarehouses(cityRef: string): Promise<Warehouse[]> {
  if (!process.env.NOVA_POSHTA_API_KEY || cityRef.startsWith("mock-city-")) {
    return mockWarehouses(cityRef);
  }
  try {
    let data = await npRequest<{ Ref: string; Description: string }>("Address", "getWarehouses", {
      SettlementRef: cityRef,
      Limit: 50,
    });
    if (data.length === 0) {
      data = await npRequest<{ Ref: string; Description: string }>("Address", "getWarehouses", {
        CityRef: cityRef,
        Limit: 50,
      });
    }
    return data.map((w) => ({ ref: w.Ref, description: w.Description }));
  } catch (err) {
    console.warn(
      `[Нова Пошта] ${err instanceof Error ? err.message : err} — використовую локальний довідник відділень`
    );
    return mockWarehouses(cityRef);
  }
}

let cachedSenderCityRef: string | null = process.env.NOVA_POSHTA_SENDER_CITY_REF ?? null;

/** CityRef відправника (Сокиряни). */
export async function getSenderCityRef(): Promise<string> {
  if (cachedSenderCityRef) return cachedSenderCityRef;
  if (!process.env.NOVA_POSHTA_API_KEY) {
    cachedSenderCityRef = MOCK_CITIES.find((c) => c.name === "Сокиряни")?.cityRef ?? "mock-city-sok";
    return cachedSenderCityRef;
  }
  const cities = await npRequest<{ Ref: string; Description: string; AreaDescription?: string }>(
    "Address",
    "getCities",
    { FindByString: SENDER_CITY_QUERY, Limit: 10 }
  );
  const match =
    cities.find((c) => c.Description === SENDER_CITY_QUERY) ??
    cities.find((c) => c.Description.includes(SENDER_CITY_QUERY)) ??
    cities[0];
  if (!match) throw new Error("Не знайдено місто відправника Сокиряни в НП");
  cachedSenderCityRef = match.Ref;
  return cachedSenderCityRef;
}

export type ShippingQuote = {
  shipping: number;
  npCost: number;
  weightKg: number;
  dispatchDate: string;
  deliveryDate: string | null;
  deliveryDateLabel: string | null;
};

function mockQuote(weightKg: number): ShippingQuote {
  const dispatch = getDispatchDate();
  const delivery = new Date(dispatch);
  delivery.setUTCDate(delivery.getUTCDate() + 2);
  return {
    shipping: SHIPPING_FEE,
    npCost: SHIPPING_FEE,
    weightKg,
    dispatchDate: formatNpDate(dispatch),
    deliveryDate: formatNpDate(delivery),
    deliveryDateLabel: formatDeliveryDateUk(delivery),
  };
}

/** Тестова оплата 1 ₴ — доставку не рахуємо, щоб сума лишилась мінімальною. */
export function freeTestPaymentQuote(): ShippingQuote {
  const dispatch = getDispatchDate();
  return {
    shipping: 0,
    npCost: 0,
    weightKg: 0.1,
    dispatchDate: formatNpDate(dispatch),
    deliveryDate: formatNpDate(dispatch),
    deliveryDateLabel: formatDeliveryDateUk(dispatch),
  };
}

/**
 * Розрахунок вартості та орієнтовної дати доставки НП (відділення → відділення).
 */
export async function quoteWarehouseShipping(input: {
  cityRecipientRef: string;
  weightKg: number;
  declaredCost: number;
}): Promise<ShippingQuote> {
  const weightKg = Math.max(0.1, input.weightKg);

  if (!process.env.NOVA_POSHTA_API_KEY || input.cityRecipientRef.startsWith("mock-city-")) {
    return mockQuote(weightKg);
  }

  try {
    const citySender = await getSenderCityRef();
    const dispatch = getDispatchDate();
    const dateTime = formatNpDate(dispatch);

    const [priceRows, dateRows] = await Promise.all([
      npRequest<{ Cost?: number | string }>("InternetDocument", "getDocumentPrice", {
        CitySender: citySender,
        CityRecipient: input.cityRecipientRef,
        Weight: String(weightKg),
        ServiceType: "WarehouseWarehouse",
        Cost: String(Math.max(1, Math.round(input.declaredCost))),
        CargoType: "Parcel",
        SeatsAmount: "1",
      }),
      npRequest<{
        DeliveryDate?: { date?: string } | string;
        date?: string;
      }>("InternetDocument", "getDocumentDeliveryDate", {
        CitySender: citySender,
        CityRecipient: input.cityRecipientRef,
        ServiceType: "WarehouseWarehouse",
        DateTime: dateTime,
      }),
    ]);

    const price = priceRows[0];
    const npCost = Math.round(Number(price?.Cost ?? 0));
    const shipping = Math.max(0, npCost);

    const rawDate = dateRows[0]?.DeliveryDate;
    const dateStr =
      typeof rawDate === "string"
        ? rawDate
        : rawDate && typeof rawDate === "object" && rawDate.date
          ? rawDate.date
          : typeof dateRows[0]?.date === "string"
            ? dateRows[0].date
            : null;
    const parsed = dateStr ? parseNpDate(dateStr) : null;

    return {
      shipping,
      npCost,
      weightKg,
      dispatchDate: dateTime,
      deliveryDate: parsed ? formatNpDate(parsed) : dateStr,
      deliveryDateLabel: parsed ? formatDeliveryDateUk(parsed) : null,
    };
  } catch (err) {
    console.warn(
      `[Нова Пошта] розрахунок доставки: ${err instanceof Error ? err.message : err} — fallback`
    );
    return mockQuote(weightKg);
  }
}

export type LumiShippingStatus = "SHIPPED" | "ARRIVED" | "DELIVERED";

export function mapNpStatusCode(code: string | number): LumiShippingStatus | null {
  const n = Number(code);
  if ([9, 10, 11].includes(n)) return "DELIVERED";
  if ([7, 8].includes(n)) return "ARRIVED";
  if ([4, 5, 6, 41, 101, 104].includes(n)) return "SHIPPED";
  return null;
}

export type TrackingInfo = {
  number: string;
  statusCode: string;
  status: string;
  lumiStatus: LumiShippingStatus | null;
};

export async function getTrackingStatus(
  documentNumber: string,
  phone?: string
): Promise<TrackingInfo | null> {
  if (!process.env.NOVA_POSHTA_API_KEY) return null;
  const docs = [{ DocumentNumber: documentNumber, ...(phone ? { Phone: phone } : {}) }];
  const data = await npRequest<{
    Number: string;
    StatusCode: string;
    Status: string;
  }>("TrackingDocument", "getStatusDocuments", { Documents: docs });
  const row = data[0];
  if (!row) return null;
  return {
    number: row.Number,
    statusCode: String(row.StatusCode),
    status: row.Status,
    lumiStatus: mapNpStatusCode(row.StatusCode),
  };
}
