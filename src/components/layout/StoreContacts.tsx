import {
  BRAND_ADDRESS,
  BRAND_EMAIL,
  BRAND_MAPS_URL,
  BRAND_PHONE,
  BRAND_PHONE_DISPLAY,
  BRAND_TELEGRAM_URL,
} from "@/lib/seo";
import { MailIcon, PhoneIcon, PinIcon, TelegramIcon } from "@/components/Icons";

export const STORE_CONTACTS = [
  {
    label: "Телефон",
    value: BRAND_PHONE_DISPLAY,
    href: `tel:${BRAND_PHONE}`,
    Icon: PhoneIcon,
  },
  {
    label: "Email",
    value: BRAND_EMAIL,
    href: `mailto:${BRAND_EMAIL}`,
    Icon: MailIcon,
  },
  {
    label: "Telegram",
    value: BRAND_PHONE_DISPLAY,
    href: BRAND_TELEGRAM_URL,
    Icon: TelegramIcon,
    external: true,
  },
  {
    label: "Магазин",
    value: BRAND_ADDRESS,
    href: BRAND_MAPS_URL,
    Icon: PinIcon,
    external: true,
  },
] as const;

export function FooterContacts() {
  return (
    <ul className="mt-6 space-y-2.5 text-sm text-white/70">
      {STORE_CONTACTS.map(({ label, value, href, Icon, ...rest }) => {
        const external = "external" in rest && rest.external;
        const inner = (
          <>
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
            <span>
              <span className="sr-only">{label}: </span>
              {value}
            </span>
          </>
        );
        return (
          <li key={label}>
            {href ? (
              <a
                href={href}
                className="inline-flex items-start gap-2.5 transition hover:text-white"
                {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                {inner}
              </a>
            ) : (
              <span className="inline-flex items-start gap-2.5">{inner}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
