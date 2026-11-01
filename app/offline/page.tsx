import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { whatsappLink } from "@/lib/domain/format";
import { SALON } from "@/lib/salon";
import { WhatsAppIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Sem internet" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <Logo width={150} />
      <h1 className="mt-6 font-brand text-2xl font-semibold">Sem internet</h1>
      <p className="mt-3 text-lg">
        Para ver os horários e agendar, é preciso estar conectada. Verifique o Wi-Fi ou os dados móveis e tente de novo.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-cocoa px-6 text-lg font-bold text-white"
      >
        Tentar de novo
      </Link>
      <a
        href={whatsappLink(SALON.whatsappE164)}
        className="mt-3 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-cocoa px-6 text-lg font-bold text-coffee"
      >
        <WhatsAppIcon className="h-6 w-6" />
        Falar no WhatsApp
      </a>
    </main>
  );
}
