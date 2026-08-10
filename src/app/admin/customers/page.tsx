import { CustomersManager } from "@/components/admin/CustomersManager";

export default function AdminCustomersPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-black">Клієнти та знижки LUMI CLUB</h1>
      <CustomersManager />
    </div>
  );
}
