import { ORDERS_CLOSED_MESSAGE, ORDERS_CLOSED_TITLE } from "@/lib/orders-enabled";

export function OrdersClosedNotice({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-card border border-cobalt/15 bg-mint px-5 py-4 ${className}`}>
      <p className="font-display text-base font-bold text-cobalt">{ORDERS_CLOSED_TITLE}</p>
      <p className="mt-1 text-sm leading-relaxed text-obsidian/70">{ORDERS_CLOSED_MESSAGE}</p>
    </div>
  );
}
