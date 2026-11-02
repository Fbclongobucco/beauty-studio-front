/** Regras da foto do serviço, compartilhadas pela API e pelo painel. */

export type PhotoType = "image/jpeg" | "image/png" | "image/webp";

/** Tamanho máximo aceito pela API: 5 MB. */
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Tipos aceitos no seletor de arquivo do painel. */
export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";

export const PHOTO_MESSAGES = {
  type: "Envie uma foto em JPEG, PNG ou WebP.",
  size: "A foto deve ter no máximo 5 MB.",
  missing: "Escolha uma foto.",
} as const;

const startsWith = (b: Uint8Array, sig: number[], offset = 0) =>
  b.length >= offset + sig.length && sig.every((v, i) => b[offset + i] === v);

/**
 * Detecta o formato pela assinatura do arquivo, não pelo nome nem pelo cabeçalho
 * enviado pelo cliente. Retorna null para qualquer outro conteúdo.
 */
export function detectImageType(bytes: Uint8Array): PhotoType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // "RIFF" + 4 bytes de tamanho + "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}
