import Image, { type ImageProps } from "next/image";

function skipOptimization(src: ImageProps["src"]) {
  if (typeof src !== "string") return false;
  return (
    src.startsWith("blob:") ||
    src.startsWith("/api/media/") ||
    src.startsWith("/media/") ||
    src.startsWith("/uploads/")
  );
}

/**
 * Product photos are private Vercel Blob files proxied at /api/media.
 * Vercel Image Optimization (/_next/image) cannot fetch those API routes
 * and returns 404, so we skip optimization and load the file directly.
 */
export function MediaImage({ unoptimized, src, ...props }: ImageProps) {
  return <Image src={src} {...props} unoptimized={unoptimized ?? skipOptimization(src)} />;
}
