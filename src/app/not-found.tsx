import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-content py-32 text-center">
      <p className="font-display text-[80px] font-black leading-none text-cobalt">404</p>
      <h1 className="mt-4 font-display text-2xl font-black">Сторінку не знайдено</h1>
      <p className="mt-3 text-obsidian/60">Можливо, товар розкупили або посилання застаріло.</p>
      <Link href="/" className="btn-primary mt-8">
        На головну
      </Link>
    </div>
  );
}
