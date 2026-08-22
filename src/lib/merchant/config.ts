export const MERCHANT_SCOPE = "https://www.googleapis.com/auth/content";

export type MerchantConfig = {
  accountId: string;
  dataSourceId: string;
  feedLabel: string;
  contentLanguage: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

export function getMerchantConfig(): MerchantConfig | null {
  const accountId = process.env.GOOGLE_MERCHANT_ACCOUNT_ID?.trim();
  const dataSourceId = process.env.GOOGLE_MERCHANT_DATA_SOURCE_ID?.trim();
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();
  if (!accountId || !dataSourceId || !clientId || !clientSecret || !refreshToken) {
    return null;
  }
  return {
    accountId,
    dataSourceId,
    feedLabel: (process.env.GOOGLE_MERCHANT_FEED_LABEL?.trim() || "UA").toUpperCase(),
    contentLanguage: process.env.GOOGLE_MERCHANT_CONTENT_LANGUAGE?.trim() || "uk",
    clientId,
    clientSecret,
    refreshToken,
  };
}

export function isMerchantConfigured(): boolean {
  return getMerchantConfig() != null;
}

export function accountName(accountId: string): string {
  return `accounts/${accountId}`;
}

export function dataSourceName(accountId: string, dataSourceId: string): string {
  return `${accountName(accountId)}/dataSources/${dataSourceId}`;
}
