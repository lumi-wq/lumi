import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata = { title: "Адмін-панель", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/auth");

  return (
    <div className="container-content grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
      <aside>
        <p className="font-display text-lg font-black">Адмін-панель</p>
        <p className="mt-1 text-xs text-obsidian/50">{admin.email}</p>
        <AdminNav />
        <Link href="/" className="mt-8 block text-[13px] font-semibold text-cobalt underline">
          ← До магазину
        </Link>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
