"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { formatDateShort } from "@/lib/domain/format";
import type { AdminAppointment, StatusAction } from "@/lib/domain/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const COPY: Record<StatusAction, { title: string; label: string; danger: boolean; reason: boolean }> = {
  confirm: { title: "Confirmar este agendamento?", label: "Sim, confirmar", danger: false, reason: false },
  reject: { title: "Recusar este pedido?", label: "Sim, recusar", danger: true, reason: true },
  cancel: { title: "Cancelar este agendamento?", label: "Sim, cancelar", danger: true, reason: true },
};

/** Diálogo "Tem certeza?" + chamada da ação. Retorna o gatilho e o elemento do diálogo. */
export function useAppointmentAction(onDone: () => void) {
  const [target, setTarget] = useState<{ a: AdminAppointment; action: StatusAction } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(reason?: string) {
    if (!target) return;
    setBusy(true);
    try {
      await api.admin.act(target.a.id, target.action, reason);
      const verb = { confirm: "confirmado", reject: "recusado", cancel: "cancelado" }[target.action];
      setMessage({ ok: true, text: `${target.a.customerName}: agendamento ${verb}.` });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Não foi possível concluir." });
    } finally {
      setBusy(false);
      setTarget(null);
      onDone();
    }
  }

  const c = target ? COPY[target.action] : null;
  const dialog = (
    <>
      {message && (
        <p
          role="status"
          className={`mb-4 rounded-2xl px-4 py-3 font-bold ${message.ok ? "bg-ok-bg text-ok" : "bg-danger-bg text-danger"}`}
        >
          {message.text}
        </p>
      )}
      <ConfirmDialog
        open={!!target}
        title={c?.title ?? ""}
        message={
          target
            ? `${target.a.customerName} · ${target.a.serviceName} · ${formatDateShort(target.a.date)} às ${target.a.time}`
            : undefined
        }
        confirmLabel={c?.label ?? ""}
        danger={c?.danger}
        withReason={c?.reason}
        busy={busy}
        onConfirm={run}
        onCancel={() => setTarget(null)}
      />
    </>
  );

  return { ask: (a: AdminAppointment, action: StatusAction) => setTarget({ a, action }), dialog };
}
