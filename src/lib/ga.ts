export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
export const AW_CONVERSION_ID = process.env.NEXT_PUBLIC_AW_CONVERSION_ID ?? "AW-18405988896";
export const AW_ADD_TO_CART_SEND_TO =
  process.env.NEXT_PUBLIC_AW_ADD_TO_CART ?? "AW-18405988896/4u1tCP6XweYcEKC01MhE";
export const GA_CONSENT_KEY = "lumi-analytics-consent";
export const GA_OPEN_CONSENT_EVENT = "lumi:open-consent";
export const CURRENCY = "UAH";
export const ITEM_BRAND = "LUMI";

export type AnalyticsConsent = "granted" | "denied";

export type GaItem = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  index?: number;
  item_list_id?: string;
  item_list_name?: string;
};

type EcommercePayload = {
  currency?: string;
  value?: number;
  items?: GaItem[];
  item_list_id?: string;
  item_list_name?: string;
  transaction_id?: string;
  shipping?: number;
  tax?: number;
  coupon?: string;
  payment_type?: string;
  shipping_tier?: string;
  search_term?: string;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function isGaEnabled() {
  const preview =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "preview";
  return Boolean(GA_MEASUREMENT_ID) && !preview;
}

export function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export const gtag: (...args: unknown[]) => void = function gtag() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(arguments);
};

export function track(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !isGaEnabled()) return;
  if (typeof window.gtag === "function") {
    window.gtag("event", event, params);
    return;
  }
  gtag("event", event, params);
}

function ecommerce(event: string, payload: EcommercePayload) {
  track(event, { currency: CURRENCY, ...payload });
}

export function productItem(input: {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  variant?: string | null;
  quantity?: number;
  index?: number;
  listId?: string;
  listName?: string;
}): GaItem {
  return {
    item_id: input.id,
    item_name: input.name,
    item_brand: ITEM_BRAND,
    price: input.price,
    quantity: input.quantity ?? 1,
    ...(input.category ? { item_category: input.category } : {}),
    ...(input.variant ? { item_variant: input.variant } : {}),
    ...(input.index != null ? { index: input.index } : {}),
    ...(input.listId ? { item_list_id: input.listId } : {}),
    ...(input.listName ? { item_list_name: input.listName } : {}),
  };
}

export function variantLabel(size?: string | null, color?: string | null) {
  return [size, color].filter(Boolean).join(" / ") || undefined;
}

export function cartLineItem(line: {
  productId: string;
  name: string;
  size: string;
  color: string;
  price: number;
  qty: number;
}): GaItem {
  return productItem({
    id: line.productId,
    name: line.name,
    price: line.price,
    quantity: line.qty,
    variant: variantLabel(line.size, line.color),
  });
}

export function trackPageView(path: string, title?: string) {
  if (!isGaEnabled() || isAdminPath(path)) return;
  track("page_view", {
    page_path: path,
    page_location: typeof window !== "undefined" ? window.location.href : undefined,
    page_title: title ?? (typeof document !== "undefined" ? document.title : undefined),
  });
}

export function trackViewItem(item: GaItem) {
  ecommerce("view_item", { value: item.price, items: [item] });
}

export function trackViewItemList(items: GaItem[], listId: string, listName: string) {
  if (items.length === 0) return;
  ecommerce("view_item_list", { item_list_id: listId, item_list_name: listName, items });
}

export function trackSelectItem(item: GaItem, listId?: string, listName?: string) {
  ecommerce("select_item", {
    item_list_id: listId ?? item.item_list_id,
    item_list_name: listName ?? item.item_list_name,
    items: [item],
  });
}

export function trackAddToCart(item: GaItem, opts?: { ads?: boolean }) {
  const value = (item.price ?? 0) * (item.quantity ?? 1);
  ecommerce("add_to_cart", {
    value,
    items: [item],
  });
  if (opts?.ads === false || !AW_ADD_TO_CART_SEND_TO) return;
  track("conversion", {
    send_to: AW_ADD_TO_CART_SEND_TO,
    value,
    currency: CURRENCY,
  });
}

export function trackRemoveFromCart(item: GaItem) {
  ecommerce("remove_from_cart", {
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [item],
  });
}

export function trackViewCart(items: GaItem[], value: number) {
  ecommerce("view_cart", { value, items });
}

export function trackBeginCheckout(items: GaItem[], value: number) {
  ecommerce("begin_checkout", { value, items });
}

export function trackAddShippingInfo(items: GaItem[], value: number, city?: string) {
  ecommerce("add_shipping_info", {
    value,
    shipping_tier: city ? `Нова Пошта / ${city}` : "Нова Пошта",
    items,
  });
}

export function trackAddPaymentInfo(items: GaItem[], value: number) {
  ecommerce("add_payment_info", {
    value,
    payment_type: "card",
    items,
  });
}

export function trackPurchase(input: {
  transactionId: string;
  value: number;
  shipping: number;
  items: GaItem[];
}) {
  ecommerce("purchase", {
    transaction_id: input.transactionId,
    value: input.value,
    shipping: input.shipping,
    tax: 0,
    items: input.items,
  });
}

export function trackAddToWishlist(item: GaItem) {
  ecommerce("add_to_wishlist", { value: item.price, items: [item] });
}

export function trackRemoveFromWishlist(item: GaItem) {
  ecommerce("remove_from_wishlist", { value: item.price, items: [item] });
}

export function trackSearch(searchTerm: string) {
  track("search", { search_term: searchTerm });
}

export function trackSelectContent(contentType: string, contentId: string) {
  track("select_content", { content_type: contentType, content_id: contentId });
}

export function trackFilter(filterType: string, filterValue: string) {
  track("filter", { filter_type: filterType, filter_value: filterValue });
}

export function readConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(GA_CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function updateAnalyticsConsent(granted: boolean) {
  const value: AnalyticsConsent = granted ? "granted" : "denied";
  try {
    localStorage.setItem(GA_CONSENT_KEY, value);
  } catch {
    /* ignore quota / private mode */
  }
  gtag("consent", "update", {
    analytics_storage: value,
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: "denied",
  });
}

export function openConsentBanner() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GA_OPEN_CONSENT_EVENT));
}
