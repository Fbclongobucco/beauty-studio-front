import { formatDateLong, formatDuration, formatPrice } from "@/lib/domain/format";
import type { PublicService } from "@/lib/domain/types";

type Props = {
  service?: PublicService;
  date?: string;
  time?: string;
  /** Passo atual: só oferece "Alterar" para escolhas de passos anteriores. */
  step: number;
  onEdit: (step: number) => void;
};

/** Resumo fixo ao lado dos passos, só no computador (no celular o resumo fica dentro de cada passo). */
export function BookingAside({ service, date, time, step, onEdit }: Props) {
  const rows: { label: string; value?: string; detail?: string; step: number }[] = [
    {
      label: "Serviço",
      value: service?.name,
      detail: service ? `${formatDuration(service.durationMin)} · ${formatPrice(service.priceCents)} · com ${service.professional.name}` : undefined,
      step: 1,
    },
    { label: "Dia", value: date ? formatDateLong(date) : undefined, step: 2 },
    { label: "Horário", value: time, step: 3 },
  ];
  return (
    <aside aria-label="Resumo do agendamento" className="hidden lg:sticky lg:top-6 lg:block">
      <div className="rounded-3xl border border-blush-2 bg-white/80 p-6">
        <h2 className="font-brand text-xl font-semibold text-coffee">Seu agendamento</h2>
        <dl className="mt-4 divide-y divide-blush-2">
          {rows.map((r) => (
            <div key={r.label} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-base text-cocoa">{r.label}</dt>
                {r.value && r.step < step && (
                  <button
                    type="button"
                    onClick={() => onEdit(r.step)}
                    className="text-base font-bold text-coffee underline underline-offset-4"
                  >
                    Alterar
                  </button>
                )}
              </div>
              <dd className={`first-letter:uppercase ${r.value ? "font-bold text-coffee" : "text-cocoa/70"}`}>
                {r.value ?? "A escolher"}
              </dd>
              {r.detail && <dd className="text-base">{r.detail}</dd>}
            </div>
          ))}
        </dl>
        <p className="mt-4 rounded-2xl bg-blush px-4 py-3 text-base">
          O pedido fica aguardando confirmação do salão, que responde pelo WhatsApp.
        </p>
      </div>
    </aside>
  );
}
