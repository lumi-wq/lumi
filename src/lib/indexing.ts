import { PRODUCTION_ORIGIN } from "@/lib/site";

/**
 * URL, які першими відправляємо в Google Search Console → Inspect → Request indexing.
 * Не більше ~10–15 за раз; решта підтягнеться з sitemap, коли він 200 OK.
 */
export const INDEX_FIRST_PATHS = [
  "/",
  "/category/girls",
  "/category/boys",
  "/category/girls/verkhniy-odyag",
  "/category/boys/verkhniy-odyag",
  "/category/girls/futbolky",
  "/category/boys/futbolky",
  "/category/shkilnyy-odyag",
  "/category/pidlitkovyy-odyag",
  "/category/zymovyy-odyag",
  "/size-guide",
  "/category/sale",
] as const;

export function indexFirstUrls(origin = PRODUCTION_ORIGIN): string[] {
  return INDEX_FIRST_PATHS.map((path) =>
    path === "/" ? origin : `${origin}${path}`
  );
}
