"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/lib/api-client";
import { formatDateLong, STATUS_LABEL } from "@/lib/domain/format";
import { useApi } from "@/lib/client/useApi";
import { alreadyShownThisVisit, markShownThisVisit } from "@/lib/client/my-requests-visit";
import { STATUS_STYLE } from "@/components/booking/AppointmentStatus";

const VISIBLE = 3;

/**
 * Pedidos em andamento deste aparelho (cookie gravado pela API).
 * Na primeira abertura da página inicial na visita, leva a cliente ao pedido mais próximo;
 * depois, mostra o cartão "Seu pedido". Vazio, carregando ou com erro: não renderiza nada.
 */
export function MyRequests() {
  const router = useRouter();
  const fromStatus = useSearchParams().get("inicio") === "1";
  const { data } = useApi("my-requests", api.myRequests);

  const first = data?.appointments[0];
  useEffect(() => {
    if (!first || fromStatus || alreadyShownThisVisit()) return;
    markShownThisVisit();
    router.replace(`/agendamento/${encodeURIComponent(first.id)}`);
  }, [first, fromStatus, router]);

  const list = data?.appointments ?? [];
  if (list.length === 0) return null;

  const more = list.length - VISIBLE;
  return (
    <section
      aria-labelledby="meus-pedidos"
      className="mt-5 w-full rounded-3xl border-2 border-cocoa bg-white/90 p-5 text-left lg:max-w-xl"
    >
      <h2 id="meus-pedidos" className="font-brand text-xl font-semibold text-coffee">
        {list.length === 1 ? "Seu pedido" : "Seus pedidos"}
      </h2>
      <ul className="mt-3 divide-y divide-blush-2">
        {list.slice(0, VISIBLE).map((a) => (
          <li key={a.id} className="py-3 first:pt-0 last:pb-0">
            <p className="font-bold text-coffee">{a.serviceName}</p>
            <p className="text-base first-letter:uppercase">
              {formatDateLong(a.date)}, às {a.time} · com {a.professionalName.split(" ")[0]}
            </p>
            <p className={`mt-2 inline-block rounded-full px-3 py-0.5 text-base font-bold ${STATUS_STYLE[a.status]}`}>
              {STATUS_LABEL[a.status]}
            </p>
            <div className="mt-3">
              <Link
                href={`/agendamento/${encodeURIComponent(a.id)}`}
                className="inline-flex min-h-12 items-center rounded-2xl bg-cocoa px-5 font-bold text-white hover:bg-coffee"
              >
                Ver pedido
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {more > 0 && (
        <p className="mt-3 text-base">
          e mais {more} {more === 1 ? "pedido" : "pedidos"}
        </p>
      )}
    </section>
  );
}
