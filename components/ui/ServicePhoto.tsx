"use client";

import { useEffect, useId, useRef, useState } from "react";
import { photoSrc } from "@/lib/api-client";
import { Button } from "./Button";

type ThumbProps = {
  url: string;
  /** Nome do serviço: vira o texto alternativo. */
  alt: string;
  className?: string;
};

/**
 * Miniatura quadrada da foto do serviço. Se a imagem não carregar, some sem quebrar o item.
 * `<img>` simples: a origem das fotos do backend definitivo ainda não é conhecida.
 */
export function ServiceThumb({ url, alt, className = "h-16 w-16" }: ThumbProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (failedUrl === url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoSrc(url)}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(url)}
      className={`shrink-0 rounded-2xl bg-blush object-cover ${className}`}
    />
  );
}

/** Miniatura que abre a foto ampliada, com botão "Fechar". */
export function ServicePhotoZoom({ url, name }: { url: string; name: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  if (failedUrl === url) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ver foto de ${name}`}
        className="shrink-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cocoa"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoSrc(url)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(url)}
          className="h-16 w-16 rounded-2xl bg-blush object-cover"
        />
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          // Toque fora da foto (no fundo escuro) também fecha.
          if (e.target === e.currentTarget) setOpen(false);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl bg-cream p-4 text-coffee backdrop:bg-ink/70"
      >
        <h2 id={titleId} className="mb-3 font-brand text-xl font-semibold">
          {name}
        </h2>
        {open && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoSrc(url)} alt={name} className="max-h-[70vh] w-full rounded-2xl object-contain" />
        )}
        <Button className="mt-4 w-full" onClick={() => setOpen(false)}>
          Fechar
        </Button>
      </dialog>
    </>
  );
}
