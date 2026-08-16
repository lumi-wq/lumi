/** Вага однієї одиниці товару для розрахунку доставки НП (кг). */
export function unitWeightKg(productTypeSlug: string | null | undefined): number {
  switch (productTypeSlug) {
    case "bags":
      return 2;
    case "hats":
    case "caps":
    case "glasses":
      return 0.5;
    default:
      // Дитячий одяг / інше — типова посилка ~1 кг на одиницю
      return 1;
  }
}

export function cartWeightKg(
  lines: { quantity: number; productTypeSlug: string | null | undefined }[]
): number {
  const total = lines.reduce(
    (sum, line) => sum + unitWeightKg(line.productTypeSlug) * line.quantity,
    0
  );
  // НП приймає вагу з точністю до сотих; мінімум 0.1 кг
  return Math.max(0.1, Math.round(total * 100) / 100);
}
