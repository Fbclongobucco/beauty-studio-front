import type { NextRequest } from "next/server";
import { connection } from "next/server";
import { notFound } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

/** Serve a foto guardada em memória. A URL muda a cada troca, então o conteúdo é imutável. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/service-photos/[photoId]">) {
  await connection(); // dados em memória mudam a cada requisição
  const { photoId } = await ctx.params;
  const photo = await repo.getPhoto(photoId);
  if (!photo) return notFound("Foto não encontrada.");
  return new Response(photo.bytes, {
    headers: {
      "Content-Type": photo.contentType,
      "Content-Length": String(photo.bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
