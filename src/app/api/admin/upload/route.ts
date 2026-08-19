import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, sniffImage, storeProductImage } from "@/lib/product-image-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Заборонено" }, { status: 403 });
    }

    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "Невірні дані" }, { status: 400 });
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не передано" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json(
        { error: "Файл не дійшов до сервера. Стисніть фото або збережіть як JPG до 4 МБ." },
        { status: 400 }
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Файл більший за 8 МБ" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffImage(buffer, file.name, file.type);
    if (!sniffed) {
      return NextResponse.json(
        { error: "Дозволені формати: JPG, PNG, WebP, GIF. HEIC з iPhone збережіть як JPG." },
        { status: 400 }
      );
    }

    const url = await storeProductImage(buffer, sniffed.ext, sniffed.contentType);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Не вдалося зберегти фото";
    console.error("[admin/upload]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
