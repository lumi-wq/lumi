/**
 * Інтеграція з українським API Нової Пошти (api.novaposhta.ua v2.0).
 * Ключ береться з бізнес-кабінету: new.novaposhta.ua → Налаштування → Безпека.
 * Документація: https://developers.novaposhta.ua
 *
 * Без ключа / при помилці API — локальний мок довідників.
 */

const NP_API = "https://api.novaposhta.ua/v2.0/json/";

export type City = { ref: string; name: string };
export type Warehouse = { ref: string; description: string };

const MOCK_CITY_NAMES = [
  "Київ", "Харків", "Одеса", "Дніпро", "Львів", "Запоріжжя", "Кривий Ріг",
  "Миколаїв", "Вінниця", "Полтава", "Чернігів", "Черкаси", "Хмельницький",
  "Житомир", "Суми", "Рівне", "Івано-Франківськ", "Тернопіль", "Луцьк",
  "Ужгород", "Кропивницький", "Кременчук", "Біла Церква", "Мелітополь",
  "Бровари", "Ірпінь", "Буча", "Бориспіль", "Кам'янець-Подільський",
  "Мукачево", "Дрогобич", "Стрий", "Ковель", "Нововолинськ", "Умань",
  "Ніжин", "Славута", "Трускавець", "Чернівці", "Херсон",
];

const MOCK_CITIES: City[] = MOCK_CITY_NAMES.map((name, i) => ({
  ref: `mock-city-${i}`,
  name,
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
    // searchSettlements повертає Addresses всередині першого елемента
    type SettlementWrap = {
      Addresses?: { Ref: string; Present: string; MainDescription: string; Area?: string }[];
    };
    const wrap = data as unknown as SettlementWrap[];
    const addresses = wrap[0]?.Addresses ?? [];
    if (addresses.length > 0) {
      return addresses.map((a) => ({
        ref: a.Ref,
        name: a.Present || (a.Area ? `${a.MainDescription} (${a.Area})` : a.MainDescription),
      }));
    }
    // Fallback на getCities
    const cities = await npRequest<{ Ref: string; Description: string; AreaDescription?: string }>(
      "Address",
      "getCities",
      { FindByString: query, Limit: 10 }
    );
    return cities.map((c) => ({
      ref: c.Ref,
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
    // Ref з searchSettlements — це SettlementRef (населений пункт)
    let data = await npRequest<{ Ref: string; Description: string }>("Address", "getWarehouses", {
      SettlementRef: cityRef,
      Limit: 50,
    });
    if (data.length === 0) {
      // Fallback: якщо передали CityRef зі старого getCities
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

/** Статуси Нової Пошти → внутрішні статуси замовлення LUMI. */
export type LumiShippingStatus = "SHIPPED" | "ARRIVED" | "DELIVERED";

/**
 * Коди статусів TrackingDocument (StatusCode).
 * @see https://developers.novaposhta.ua
 */
export function mapNpStatusCode(code: string | number): LumiShippingStatus | null {
  const n = Number(code);
  // Отримано
  if ([9, 10, 11].includes(n)) return "DELIVERED";
  // Прибула у відділення / поштомат
  if ([7, 8].includes(n)) return "ARRIVED";
  // В дорозі / відправлено
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
