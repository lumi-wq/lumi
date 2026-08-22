import {
  accountName,
  dataSourceName,
  getMerchantConfig,
  type MerchantConfig,
} from "./config";

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

export class MerchantApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "MerchantApiError";
    this.status = status;
    this.details = details;
  }
}

async function getAccessToken(config: MerchantConfig): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = (await res.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  } | null;
  if (!res.ok || !json?.access_token) {
    throw new MerchantApiError(
      json?.error_description || json?.error || "Не вдалося оновити Google-токен",
      res.status,
      json
    );
  }
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + Math.max(30, (json.expires_in ?? 3600) - 60) * 1000,
  };
  return tokenCache.token;
}

async function merchantFetch<T>(
  config: MerchantConfig,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken(config);
  const res = await fetch(`https://merchantapi.googleapis.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const json = (await res.json().catch(() => null)) as T & {
    error?: { message?: string; status?: string };
  };
  if (!res.ok) {
    throw new MerchantApiError(
      json?.error?.message || `Merchant API ${res.status}`,
      res.status,
      json
    );
  }
  return json;
}

export type ProductInputPayload = {
  offerId: string;
  contentLanguage: string;
  feedLabel: string;
  productAttributes: Record<string, unknown>;
};

export async function insertProductInput(payload: ProductInputPayload) {
  const config = requireConfig();
  const parent = accountName(config.accountId);
  const dataSource = dataSourceName(config.accountId, config.dataSourceId);
  return merchantFetch(
    config,
    `/products/v1/${parent}/productInputs:insert?dataSource=${encodeURIComponent(dataSource)}`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function deleteProductInput(offerId: string) {
  const config = requireConfig();
  const name = `${accountName(config.accountId)}/productInputs/${config.contentLanguage}~${config.feedLabel}~${offerId}`;
  const dataSource = dataSourceName(config.accountId, config.dataSourceId);
  try {
    await merchantFetch(
      config,
      `/products/v1/${name}?dataSource=${encodeURIComponent(dataSource)}`,
      { method: "DELETE" }
    );
  } catch (err) {
    if (err instanceof MerchantApiError && (err.status === 404 || err.status === 400)) {
      return;
    }
    throw err;
  }
}

type ListedProduct = {
  name?: string;
  offerId?: string;
};

let offerListCache: { ids: string[]; at: number } | null = null;

export function clearOfferListCache() {
  offerListCache = null;
}

export async function listMerchantOfferIds(): Promise<string[]> {
  if (offerListCache && Date.now() - offerListCache.at < 20_000) {
    return offerListCache.ids;
  }
  const config = requireConfig();
  const parent = accountName(config.accountId);
  const ids: string[] = [];
  let pageToken = "";
  do {
    const qs = new URLSearchParams({ pageSize: "250" });
    if (pageToken) qs.set("pageToken", pageToken);
    const json = await merchantFetch<{ products?: ListedProduct[]; nextPageToken?: string }>(
      config,
      `/products/v1/${parent}/products?${qs.toString()}`
    );
    for (const p of json.products ?? []) {
      if (p.offerId) ids.push(p.offerId);
    }
    pageToken = json.nextPageToken ?? "";
  } while (pageToken);
  offerListCache = { ids, at: Date.now() };
  return ids;
}

export function requireConfig(): MerchantConfig {
  const config = getMerchantConfig();
  if (!config) {
    throw new MerchantApiError(
      "Merchant API не налаштовано. Додайте Google-змінні в оточення.",
      503
    );
  }
  return config;
}
