import type { ReactNode } from "react";

export function LegalDoc({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <>
      <section className="bg-white">
        <div className="container-content py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-obsidian/50">{eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl font-black md:text-[40px]">{title}</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-obsidian/70">{intro}</p>
        </div>
      </section>
      <section className="border-t border-black/5 bg-chalk py-12">
        <div className="container-content max-w-3xl">
          <article className="legal-prose space-y-8 rounded-2xl border border-black/5 bg-white p-6 md:p-10">
            {children}
          </article>
        </div>
      </section>
    </>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-lg font-bold text-obsidian">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-obsidian/75">{children}</div>
    </section>
  );
}
