export const ORDER_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  NEW: { label: "НОВЕ", className: "bg-chalk text-obsidian/70" },
  PAID: { label: "ОПЛАЧЕНО", className: "bg-mint text-obsidian" },
  PROCESSING: { label: "ЗБИРАЄТЬСЯ", className: "bg-mint text-obsidian" },
  SHIPPED: { label: "ВІДПРАВЛЕНО", className: "bg-cobalt/10 text-cobalt" },
  ARRIVED: { label: "ПРИБУЛА", className: "bg-amber-100 text-amber-800" },
  DELIVERED: { label: "ОТРИМАНО", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "СКАСОВАНО", className: "bg-red-100 text-red-600" },
};
