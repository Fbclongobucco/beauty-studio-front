import Image from "next/image";
import logo from "@/public/brand/logo.png";

// A arte é gerada por scripts/generate-logo.mjs (npm run logo).
// Para usar o arquivo original do designer, basta substituir public/brand/logo.png.
export function Logo({ width = 220, priority = false }: { width?: number; priority?: boolean }) {
  return (
    <Image
      src={logo}
      alt="Longo Bucco Beauty Studio"
      width={width}
      priority={priority}
      sizes={`${width}px`}
      className="h-auto max-w-full"
    />
  );
}
