import Link from "next/link";
import { OrderTrackForm } from "@/components/orders/OrderTrackForm";

export const metadata = { title: "Відслідкувати замовлення", robots: { index: false, follow: true } };

export default function OrdersPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  return (
    <>
      <section className="bg-white">
        <div className="container-content py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-obsidian/50">
            Підтримка
          </p>
          <h1 className="mt-3 font-display text-3xl font-black md:text-[40px]">
            Відслідкувати замовлення
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-obsidian/70">
            Введіть номер замовлення та телефон — покажемо статус і ТТН без реєстрації. Або{" "}
            <Link href="/auth" className="font-semibold text-cobalt underline">
              увійдіть
            </Link>
            , щоб зберегти історію в профілі.
          </p>
        </div>
      </section>

      <section className="border-t border-black/5 bg-chalk py-12">
        <div className="container-content max-w-2xl">
          <OrderTrackForm initialNumber={searchParams.order ?? ""} />
        </div>
      </section>
    </>
  );
}
