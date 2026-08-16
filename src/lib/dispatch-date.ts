/**
 * День відправки LUMI (час Europe/Kyiv):
 * - будні до 16:00 → сьогодні
 * - будні після 16:00 → наступний робочий день
 * - субота до 14:00 → сьогодні
 * - субота після 14:00 / неділя → понеділок
 */

type KyivParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0=Sun .. 6=Sat (JS)
};

function kyivParts(date: Date): KyivParts {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  const weekdayName = map.weekday ?? "Mon";
  const weekday =
    { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[weekdayName] ?? 1;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour === "24" ? "0" : map.hour),
    minute: Number(map.minute),
    weekday,
  };
}

/** Календарна дата в Києві як UTC-полудень (стабільний Date для форматування). */
function kyivCalendarDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function addCalendarDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isWeekend(d: Date): boolean {
  const wd = kyivParts(d).weekday;
  return wd === 0 || wd === 6;
}

function nextWeekday(d: Date): Date {
  let cur = addCalendarDays(d, 1);
  while (isWeekend(cur)) cur = addCalendarDays(cur, 1);
  return cur;
}

/** Дата відправки посилки з Сокирян. */
export function getDispatchDate(now = new Date()): Date {
  const p = kyivParts(now);
  const today = kyivCalendarDate(p.year, p.month, p.day);
  const minutes = p.hour * 60 + p.minute;

  if (p.weekday === 0) {
    // Неділя → понеділок
    return addCalendarDays(today, 1);
  }

  if (p.weekday === 6) {
    // Субота
    if (minutes < 14 * 60) return today;
    return addCalendarDays(today, 2); // понеділок
  }

  // Будні
  if (minutes < 16 * 60) return today;
  return nextWeekday(today);
}

/** Формат для API Нової Пошти: dd.MM.yyyy */
export function formatNpDate(date: Date): string {
  const p = kyivParts(date);
  return `${String(p.day).padStart(2, "0")}.${String(p.month).padStart(2, "0")}.${p.year}`;
}

/** Людський формат українською. */
export function formatDeliveryDateUk(date: Date): string {
  return date.toLocaleDateString("uk-UA", {
    timeZone: "Europe/Kyiv",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function parseNpDate(value: string): Date | null {
  // dd.MM.yyyy або ISO
  const m = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (m) return kyivCalendarDate(Number(m[3]), Number(m[2]), Number(m[1]));
  const iso = new Date(value);
  return Number.isNaN(iso.getTime()) ? null : iso;
}
