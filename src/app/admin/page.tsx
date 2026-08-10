import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export default async function AdminDashboard() {
  const [products, orders, users, revenue] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" } },
    }),
  ]);

  const cards = [
    { label: "Товарів", value: String(products) },
    { label: "Замовлень", value: String(orders) },
    { label: "Клієнтів", value: String(users) },
    { label: "Виручка", value: formatPrice(revenue._sum.total ?? 0) },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-black">Огляд</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-card bg-white p-6">
            <p className="text-sm text-obsidian/60">{card.label}</p>
            <p className="mt-2 font-display text-3xl font-black text-cobalt">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
