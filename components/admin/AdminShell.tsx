"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import mark from "@/public/brand/logo-mark.png";
import { api, ApiRequestError } from "@/lib/api-client";

export const POLL_MS = 20_000;

type Ctx = { pending: number; unseen: number; refresh: () => void; tick: number };
const AdminCtx = createContext<Ctx>({ pending: 0, unseen: 0, refresh: () => {}, tick: 0 });
export const useAdmin = () => useContext(AdminCtx);

const NAV = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/servicos", label: "Serviços" },
];

/** Executa `fn` a cada `ms`, pausando com a aba oculta e rodando ao voltar. */
function useVisiblePolling(fn: () => void, ms: number) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      ref.current();
      timer = setInterval(() => ref.current(), ms);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVis = () => (document.hidden ? stop() : start());
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ms]);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [count, setCount] = useState({ pending: 0, unseen: 0 });
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    api.admin.pendingCount().then(
      (c) => {
        setCount(c);
        setTick((t) => t + 1);
      },
      (e) => {
        if (e instanceof ApiRequestError && e.status === 401) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      },
    );
  }, [router, pathname]);

  useVisiblePolling(refresh, POLL_MS);

  useEffect(() => {
    document.title = count.pending > 0 ? `(${count.pending}) Pedidos | Longo Bucco` : "Painel | Longo Bucco";
  }, [count.pending, tick, pathname]);

  async function logout() {
    try {
      await api.admin.logout();
    } finally {
      router.replace("/admin/login");
    }
  }

  return (
    <AdminCtx.Provider value={{ ...count, refresh, tick }}>
      <div className="min-h-dvh">
        <p className="bg-warn-bg px-4 py-2 text-center text-base font-bold text-warn">
          Modo de teste: dados em memória (somem ao reiniciar o servidor)
        </p>
        <header className="sticky top-0 z-10 border-b border-blush-2 bg-cream/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2">
            <Link href="/admin" className="flex min-h-12 items-center gap-2">
              <Image src={mark} alt="" width={40} height={40} />
              <span className="font-brand font-semibold tracking-wider">PAINEL</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="min-h-12 rounded-2xl px-3 font-bold text-coffee underline underline-offset-4"
            >
              Sair
            </button>
          </div>
          <nav aria-label="Painel" className="mx-auto max-w-3xl px-2">
            <ul className="flex flex-wrap">
              {NAV.map((n) => {
                const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
                return (
                  <li key={n.href} className="flex-auto">
                    <Link
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-12 items-center justify-center gap-2 border-b-4 px-2 font-bold ${
                        active ? "border-cocoa text-coffee" : "border-transparent text-cocoa"
                      }`}
                    >
                      {n.label}
                      {n.href === "/admin" && count.pending > 0 && (
                        <span
                          className="min-w-7 rounded-full bg-danger px-2 text-center text-base text-white"
                          aria-label={`${count.pending} aguardando confirmação`}
                        >
                          {count.pending}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>
        {count.unseen > 0 && pathname !== "/admin" && (
          <Link
            href="/admin"
            role="status"
            className="mx-auto mt-3 block max-w-3xl rounded-2xl bg-danger-bg px-4 py-3 text-center font-bold text-danger"
          >
            {count.unseen === 1 ? "1 pedido novo" : `${count.unseen} pedidos novos`} aguardando confirmação. Ver pedidos
          </Link>
        )}
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-5">{children}</main>
      </div>
    </AdminCtx.Provider>
  );
}
