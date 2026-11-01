"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./Button";

type Props = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  danger?: boolean;
  withReason?: boolean;
  busy?: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger,
  withReason,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const titleId = useId();
  const reasonId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setReason("");
      d.showModal();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-cream p-6 text-coffee backdrop:bg-ink/50"
    >
      <h2 id={titleId} className="font-brand text-xl font-semibold">
        {title}
      </h2>
      {message && <p className="mt-3">{message}</p>}
      {withReason && (
        <div className="mt-4">
          <label htmlFor={reasonId} className="block font-bold">
            Motivo (opcional)
          </label>
          <textarea
            id={reasonId}
            value={reason}
            maxLength={300}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2 w-full rounded-2xl border-2 border-blush-2 bg-white p-3"
            rows={3}
          />
        </div>
      )}
      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant={danger ? "danger" : "primary"}
          disabled={busy}
          onClick={() => onConfirm(reason.trim() || undefined)}
        >
          {busy ? "Aguarde..." : confirmLabel}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={onCancel}>
          Voltar
        </Button>
      </div>
    </dialog>
  );
}
