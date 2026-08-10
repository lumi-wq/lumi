import { OrdersManager } from "@/components/admin/OrdersManager";

export default function AdminOrdersPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-black">Замовлення</h1>
      <OrdersManager />
    </div>
  );
}
