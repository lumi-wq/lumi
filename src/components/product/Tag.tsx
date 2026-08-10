export function Tag({ label, style }: { label: string; style?: string | null }) {
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white ${
        style === "dark" ? "bg-obsidian" : "bg-cobalt"
      }`}
    >
      {label}
    </span>
  );
}
