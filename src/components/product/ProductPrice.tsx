import { formatPrice, discountPercent } from "@/lib/format";

type Props = {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE = {
  sm: { current: "text-[15px] font-semibold", old: "text-[13px]" },
  md: { current: "text-lg font-bold", old: "text-sm" },
  lg: { current: "text-[28px] font-bold", old: "text-base" },
};

export function ProductPrice({ price, compareAtPrice, size = "sm", className = "" }: Props) {
  const pct = discountPercent(price, compareAtPrice);
  const styles = SIZE[size];

  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
      <span className={`${styles.current} text-cobalt`}>{formatPrice(price)}</span>
      {pct !== null && compareAtPrice != null && (
        <>
          <span className={`${styles.old} text-obsidian/40 line-through`}>
            {formatPrice(compareAtPrice)}
          </span>
          <span className="text-[12px] font-bold uppercase tracking-wide text-obsidian/70">
            −{pct}%
          </span>
        </>
      )}
    </div>
  );
}
