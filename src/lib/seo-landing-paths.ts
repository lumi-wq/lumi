/** productType.slug → SEO URL-сегмент (українською) */
export const PRODUCT_TYPE_TO_CLUSTER: Record<string, string> = {
  outerwear: "verkhniy-odyag",
  sportswear: "sportyvni-kostyumy",
  tshirts: "futbolky",
  pants: "shtany",
  dresses: "sukni",
  footwear: "vzuttya",
  hats: "shapky",
  caps: "kepky",
  bags: "sumky",
  glasses: "okulyary",
};

export function typeClusterPath(
  parent: "girls" | "boys" | "accessories",
  productTypeSlug: string | null
): string {
  if (!productTypeSlug) return `/category/${parent}`;
  if (productTypeSlug === "glasses" && parent !== "accessories") {
    return `/category/accessories/${PRODUCT_TYPE_TO_CLUSTER.glasses}`;
  }
  const cluster = PRODUCT_TYPE_TO_CLUSTER[productTypeSlug];
  if (!cluster) return `/category/${parent}`;
  return `/category/${parent}/${cluster}`;
}
