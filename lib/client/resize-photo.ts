import { PHOTO_MAX_BYTES, PHOTO_MESSAGES } from "@/lib/domain/photo";

/** Lado maior da foto enviada, em px. */
export const PHOTO_MAX_SIDE = 1600;
const QUALITIES = [0.85, 0.75, 0.6];

/** Erro com mensagem pronta para mostrar no formulário. */
export class PhotoError extends Error {}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if ("createImageBitmap" in window) {
    try {
      // Respeita a orientação EXIF das fotos de celular.
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // segue para o <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

/**
 * Reduz a foto para no máximo 1600 px no lado maior e exporta em JPEG,
 * para fotos de câmera caberem no limite de 5 MB e subirem rápido em rede móvel.
 * O servidor valida tipo e tamanho de novo.
 */
export async function resizePhoto(file: File): Promise<Blob> {
  if (file.type && !file.type.startsWith("image/")) throw new PhotoError(PHOTO_MESSAGES.type);
  let img: Awaited<ReturnType<typeof decode>>;
  try {
    img = await decode(file);
  } catch {
    // Ex.: HEIC em navegador que não o decodifica.
    throw new PhotoError(PHOTO_MESSAGES.type);
  }
  try {
    const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new PhotoError(PHOTO_MESSAGES.type);
    // Fundo branco: PNG transparente não fica preto no JPEG.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img.source, 0, 0, canvas.width, canvas.height);
    for (const q of QUALITIES) {
      const blob = await toBlob(canvas, q);
      if (blob && blob.size <= PHOTO_MAX_BYTES) return blob;
    }
    throw new PhotoError(PHOTO_MESSAGES.size);
  } finally {
    img.close();
  }
}
