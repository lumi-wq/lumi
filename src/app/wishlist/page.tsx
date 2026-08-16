import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { toCardData } from "@/lib/types";
import { resolveWishlistOwner, listWishlistItems } from "@/lib/wishlist";
import { WishlistList } from "@/components/profile/WishlistList";

export const metadata = { title: "Обране", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await getSessionUser();
  const owner = resolveWishlistOwner(user?.id);
  const items = owner ? await listWishlistItems(owner) : [];

  return (
    <>
      <section className="bg-white">
        <div className="container-content py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-obsidian/50">
            Збережене
          </p>
          <h1 className="mt-3 font-display text-3xl font-black md:text-[40px]">Обране</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-obsidian/70">
            Товари зберігаються на цьому пристрої.
            {!user && (
              <>
                {" "}
                <Link href="/auth" className="font-semibold text-cobalt underline">
                  Увійдіть
                </Link>
                , щоб перенести їх у профіль і бачити з будь-якого пристрою.
              </>
            )}
          </p>
        </div>
      </section>

      <section className="border-t border-black/5 bg-chalk py-12">
        <div className="container-content">
          {items.length === 0 ? (
            <div className="rounded-card bg-white p-16 text-center">
              <p className="text-sm text-obsidian/60">Поки порожньо — додайте щось із каталогу.</p>
              <Link href="/category/new" className="btn-primary mt-6 inline-flex">
                До каталогу
              </Link>
            </div>
          ) : (
            <WishlistList
              columns={3}
              initial={items.map((w) => ({
                id: w.id,
                productId: w.productId,
                product: toCardData(w.product),
              }))}
            />
          )}
        </div>
      </section>
    </>
  );
}
