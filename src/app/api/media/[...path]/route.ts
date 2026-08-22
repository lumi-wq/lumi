import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const pathname = (params.path ?? []).join("/");
  if (!pathname.startsWith("products/") || pathname.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await get(pathname, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return new NextResponse(null, { status: result?.statusCode === 304 ? 304 : 404 });
    }
    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(typeof result.blob.size === "number" ? { "Content-Length": String(result.blob.size) } : {}),
      },
    });
  } catch (err) {
    console.error("[api/media]", err);
    return NextResponse.json({ error: "Не вдалося отримати фото" }, { status: 404 });
  }
}
