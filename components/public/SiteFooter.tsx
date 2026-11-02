import { SALON } from "@/lib/salon";
import { whatsappLink } from "@/lib/domain/format";
import { Ornament } from "@/components/ui/Ornament";
import { WhatsAppIcon } from "@/components/ui/icons";

export function SiteFooter() {
  return (
    <footer className="mt-12 bg-blush px-4 pb-10 pt-8 text-center lg:mt-20 lg:pb-12 lg:pt-10">
      <div className="mx-auto max-w-md lg:max-w-6xl lg:px-4">
        <Ornament className="mb-6 lg:mx-auto lg:max-w-md" />
        {/* No computador: marca e endereço à esquerda, contato à direita. */}
        <div className="lg:flex lg:items-center lg:justify-between lg:gap-10 lg:text-left">
        <div>
        <p className="font-brand text-lg font-semibold tracking-wider text-coffee">LONGO BUCCO</p>
        <address className="mt-3 not-italic">
          {SALON.address}
          <br />
          {SALON.district}
        </address>
        <p className="mt-2">{SALON.hours}</p>
        </div>
        <div className="lg:w-80 lg:text-center">
        <a
          href={whatsappLink(SALON.whatsappE164, "Olá! Vim pelo site do Longo Bucco Beauty Studio.")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-14 w-full items-center lg:mt-0 justify-center gap-3 rounded-2xl bg-coffee px-6 text-lg font-bold text-white hover:bg-ink"
        >
          <WhatsAppIcon className="h-6 w-6" />
          Falar no WhatsApp
        </a>
        <p className="mt-2 text-base">{SALON.whatsappDisplay}</p>
        </div>
        </div>
      </div>
    </footer>
  );
}
