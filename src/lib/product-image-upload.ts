import { put } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const MIME_TO_EXT = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

export type SniffedImage = { ext: string; contentType: string };

export function sniffImage(buffer: Buffer, filename: string, mime: string): SniffedImage | null {
  const declared = MIME_TO_EXT.get(mime);
  if (declared) return { ext: declared, contentType: mime };

  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { ext: ".png", contentType: "image/png" };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: ".jpg", contentType: "image/jpeg" };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { ext: ".webp", contentType: "image/webp" };
  }
  if (buffer.length >= 6 && buffer.toString("ascii", 0, 3) === "GIF") {
    return { ext: ".gif", contentType: "image/gif" };
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (brand.includes("heic") || brand.includes("heif") || brand.includes("mif1")) {
      return null;
    }
  }

  const nameExt = filename.toLowerCase().match(/\.(jpe?g|png|webp|gif)$/)?.[0];
  const normalized = nameExt === ".jpeg" ? ".jpg" : nameExt;
  if (normalized) {
    const contentType = [...MIME_TO_EXT.entries()].find(([, ext]) => ext === normalized)?.[0];
    if (contentType) return { ext: normalized, contentType };
  }
  return null;
}

export async function storeProductImage(buffer: Buffer, ext: string, contentType: string): Promise<string> {
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    const pathname = `products/${filename}`;
    const access = process.env.BLOB_ACCESS === "public" ? "public" : "private";
    try {
      const blob = await put(pathname, buffer, {
        access,
        token,
        contentType,
      });
      return access === "public" ? blob.url : `/api/media/${pathname}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!/access on a (private|public) store/i.test(message)) throw err;
      const fallback = access === "public" ? "private" : "public";
      const blob = await put(pathname, buffer, {
        access: fallback,
        token,
        contentType,
      });
      return fallback === "public" ? blob.url : `/api/media/${pathname}`;
    }
  }

  if (process.env.VERCEL) {
    throw new Error(
      "На production фото зберігаються в Vercel Blob. Додайте сховище Blob у проєкті Vercel і змінну BLOB_READ_WRITE_TOKEN, потім зробіть redeploy."
    );
  }

  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);
  return `/uploads/${filename}`;
}
