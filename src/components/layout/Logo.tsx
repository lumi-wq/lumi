import Link from "next/link";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cobalt font-display text-[20px] font-black text-white">
        L
      </span>
      <span
        className={`font-display text-2xl font-extrabold tracking-tight ${
          dark ? "text-white" : "text-obsidian"
        }`}
      >
        LUMI
      </span>
    </Link>
  );
}
