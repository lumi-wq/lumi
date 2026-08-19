const MAX_EDGE = 2400;
const TARGET_BYTES = 2.5 * 1024 * 1024;
const VERCEL_SAFE_BYTES = 3.5 * 1024 * 1024;

function blobToFile(blob: Blob, name: string) {
  return new File([blob], name.replace(/\.[^.]+$/i, "") + ".jpg", { type: "image/jpeg" });
}

async function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Не вдалося обробити фото");
  return blob;
}

/** Стискає фото до JPG, щоб upload не падав на ліміті Vercel (~4.5 МБ). */
export async function prepareProductImage(file: File): Promise<File> {
  if (file.type === "image/gif") {
    if (file.size > VERCEL_SAFE_BYTES) {
      throw new Error("GIF більший за 3.5 МБ. Збережіть як JPG.");
    }
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Не вдалося прочитати фото. Збережіть як JPG (не HEIC) і спробуйте ще раз.");
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    if (
      scale === 1 &&
      file.size <= TARGET_BYTES &&
      (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp")
    ) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Не вдалося обробити фото");
    ctx.drawImage(bitmap, 0, 0, width, height);

    let quality = 0.86;
    let blob = await canvasToJpeg(canvas, quality);
    while (blob.size > TARGET_BYTES && quality > 0.5) {
      quality -= 0.12;
      blob = await canvasToJpeg(canvas, quality);
    }
    if (blob.size > VERCEL_SAFE_BYTES) {
      throw new Error("Фото завелике навіть після стиснення. Спробуйте інший кадр.");
    }
    return blobToFile(blob, file.name);
  } finally {
    bitmap.close();
  }
}

export async function readJsonResponse<T extends Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(
      res.ok
        ? "Порожня відповідь сервера"
        : `Сервер не відповів (${res.status}). Спробуйте JPG до 4 МБ.`
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      res.ok
        ? "Порожня відповідь сервера"
        : `Не вдалося завантажити фото (${res.status}). Спробуйте JPG до 4 МБ.`
    );
  }
}
