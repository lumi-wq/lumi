/** Normalize to #RRGGBB uppercase. */
export function normalizeHex(input: string): string | null {
  let h = input.trim().toUpperCase();
  if (!h) return null;
  if (!h.startsWith("#")) h = `#${h}`;
  if (/^#[0-9A-F]{3}$/.test(h)) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  if (!/^#[0-9A-F]{6}$/.test(h)) return null;
  return h;
}

export function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

/** Базові кольори одягу українською — для Google Merchant `color`. */
const UA_COLOR_PALETTE: { name: string; hex: string }[] = [
  { name: "Чорний", hex: "#000000" },
  { name: "Білий", hex: "#FFFFFF" },
  { name: "Молочний", hex: "#FAF6F0" },
  { name: "Кремовий", hex: "#F1E8DC" },
  { name: "Бежевий", hex: "#D4C4A8" },
  { name: "Пісочний", hex: "#D6C6A8" },
  { name: "Сірий", hex: "#8A8A8A" },
  { name: "Графітовий", hex: "#4A4A4A" },
  { name: "Сріблястий", hex: "#C0C0C0" },
  { name: "Червоний", hex: "#C41E3A" },
  { name: "Бордовий", hex: "#6D1B2C" },
  { name: "Рожевий", hex: "#E89BB0" },
  { name: "Пудровий", hex: "#E8C4C4" },
  { name: "Кораловий", hex: "#E07060" },
  { name: "Помаранчевий", hex: "#E07A2F" },
  { name: "Персиковий", hex: "#F0C9A8" },
  { name: "Жовтий", hex: "#E6C200" },
  { name: "Гірчичний", hex: "#C9A227" },
  { name: "Золотий", hex: "#D4AF37" },
  { name: "Коричневий", hex: "#8B5A2B" },
  { name: "Шоколадний", hex: "#5D3A1A" },
  { name: "Хакі", hex: "#C3B091" },
  { name: "Оливковий", hex: "#6B6B2A" },
  { name: "Зелений", hex: "#3F6B4F" },
  { name: "М'ятний", hex: "#8FD9B6" },
  { name: "Бірюзовий", hex: "#3CBAB0" },
  { name: "Блакитний", hex: "#7EC8E3" },
  { name: "Синій", hex: "#3B5BFF" },
  { name: "Індиго", hex: "#27346E" },
  { name: "Темно-синій", hex: "#1B2A4A" },
  { name: "Фіолетовий", hex: "#6B3FA0" },
  { name: "Лавандовий", hex: "#C8BFE7" },
];

function hexToRgb(hex: string): [number, number, number] | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  return [parseInt(n.slice(1, 3), 16), parseInt(n.slice(3, 5), 16), parseInt(n.slice(5, 7), 16)];
}

/** Найближча українська назва кольору за HEX — Google не приймає коди. */
export function nearestUkrainianColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "Різнокольоровий";
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;
  const s = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
  if (l < 0.12) return "Чорний";
  if (l > 0.93 && s < 0.12) return "Білий";

  let bestName = UA_COLOR_PALETTE[0].name;
  let bestD = Infinity;
  for (const c of UA_COLOR_PALETTE) {
    const crgb = hexToRgb(c.hex);
    if (!crgb) continue;
    const d = (r - crgb[0]) ** 2 + (g - crgb[1]) ** 2 + (b - crgb[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      bestName = c.name;
    }
  }
  return bestName;
}

/** Для Merchant Center і збереження товару: слово, не HEX. */
export function displayColorName(name: string | undefined, hex: string): string {
  const trimmed = name?.trim() ?? "";
  if (trimmed && !normalizeHex(trimmed)) return trimmed.slice(0, 100);
  return nearestUkrainianColorName(hex || trimmed);
}
