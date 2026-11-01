"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/client/useApi";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { useAdmin } from "./AdminShell";
import { AppointmentCard } from "./AppointmentCard";
import { useAppointmentAction } from "./useAppointmentAction";

export function PendingList() {
  const { tick, refresh, session } = useAdmin();
  const isMaster = session.role === "master";
  // Recarrega a lista a cada atualização do contador (polling de 20 s do painel).
  const { data, error, stale, reload } = useApi(`pending:${tick}`, () => api.admin.appointments({ status: "pending" }));
  const list = (data ?? stale)?.appointments;
  const [newIds, setNewIds] = useState<ReadonlySet<string>>(new Set());
  const { ask, dialog } = useAppointmentAction(() => {
    reload();
    refresh();
  });

  // Guarda quais chegaram sem ter sido vistos (mantém o selo "Novo" nesta visita) e marca como vistos.
  // Só a profissional dona marca: a visita do master não apaga o "Novo" dela.
  useEffect(() => {
    if (!data) return;
    const unseen = data.appointments.filter((a) => !a.seenByAdminAt).map((a) => a.id);
    if (unseen.length === 0) return;
    queueMicrotask(() => setNewIds((prev) => new Set([...prev, ...unseen])));
    if (!isMaster) api.admin.markSeen(unseen).then(refresh, () => {});
  }, [data, refresh, isMaster]);

  return (
    <div>
      <h1 className="font-brand text-2xl font-semibold">Pedidos aguardando confirmação</h1>
      <p className="mb-5 mt-1 text-base">Ordenados pela data do atendimento. A lista se atualiza sozinha.</p>
      {dialog}
      {error && !list ? (
        <div role="alert" className="rounded-3xl bg-danger-bg p-5 text-danger">
          <p className="font-bold">{error.message}</p>
          <Button variant="secondary" className="mt-4 w-full" onClick={reload}>
            Tentar de novo
          </Button>
        </div>
      ) : !list ? (
        <Spinner />
      ) : list.length === 0 ? (
        <p className="rounded-3xl bg-blush p-6 text-center text-lg">Nenhum pedido aguardando confirmação.</p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2 min-[1440px]:grid-cols-3">
          {list.map((a) => (
            <li key={a.id}>
              <AppointmentCard a={a} isNew={newIds.has(a.id)} showProfessional={isMaster} onAction={ask} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
