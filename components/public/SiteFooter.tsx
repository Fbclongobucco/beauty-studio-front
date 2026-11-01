import { SALON } from "@/lib/salon";
import { whatsappLink } from "@/lib/domain/format";
import { Ornament } from "@/components/ui/Ornament";
import { WhatsAppIcon } from "@/components/ui/icons";

export function SiteFooter() {
  return (
    <footer className="mt-12 bg-blush px-4 pb-10 pt-8 text-center">
      <div className="mx-auto max-w-md">
        <Ornament className="mb-6" />
        <p className="font-brand text-lg font-semibold tracking-wider text-coffee">LONGO BUCCO</p>
        <address className="mt-3 not-italic">
          {SALON.address}
          <br />
          {SALON.district}
        </address>
        <p className="mt-2">{SALON.hours}</p>
        <a
          href={whatsappLink(SALON.whatsappE164, "Olá! Vim pelo site do Longo Bucco Beauty Studio.")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-coffee px-6 text-lg font-bold text-white hover:bg-ink"
        >
          <WhatsAppIcon className="h-6 w-6" />
          Falar no WhatsApp
        </a>
        <p className="mt-2 text-base">{SALON.whatsappDisplay}</p>
      </div>
    </footer>
  );
}
