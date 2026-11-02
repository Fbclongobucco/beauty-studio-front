import Image from "next/image";
import Link from "next/link";
import mark from "@/public/brand/logo-mark.png";
import type { ReactNode } from "react";

/** `wide`: no computador usa até 1024 px (agendamento em duas colunas); sem ele, coluna de leitura. */
export function PageShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const width = wide ? "lg:max-w-5xl" : "lg:max-w-xl";
  return (
    <div className="min-h-dvh">
      <header className={`mx-auto flex max-w-md items-center gap-3 px-4 pt-4 lg:pt-6 ${width}`}>
        <Link href="/" className="flex min-h-12 items-center gap-3 rounded-2xl pr-2" aria-label="Voltar para o início">
          <Image src={mark} alt="" width={48} height={48} />
          <span className="font-brand text-lg font-semibold tracking-wider text-coffee">LONGO BUCCO</span>
        </Link>
      </header>
      <main className={`mx-auto max-w-md px-4 pb-16 pt-6 ${width}`}>{children}</main>
    </div>
  );
}
