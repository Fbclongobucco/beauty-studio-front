"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import mark from "@/public/brand/logo-mark.png";
import { api, ApiRequestError } from "@/lib/api-client";
import type { AdminSession } from "@/lib/domain/types";
import { Spinner } from "@/components/ui/Spinner";
import { formatDateLong } from "@/lib/domain/format";
import { nowInSalon } from "@/lib/domain/schedule";

export const POLL_MS = 20_000;

type Ctx = { pending: number; unseen: number; refresh: () => void; tick: number; session: AdminSession };
const AdminCtx = createContext<Ctx>({
  pending: 0,
  unseen: 0,
  refresh: () => {},
  tick: 0,
  session: { role: "master", professionalId: null, name: "" },
});
export const useAdmin = () => useContext(AdminCtx);

const NAV = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/servicos", label: "Serviços" },
  { href: "/admin/ganhos", label: "Ganhos" },
];

/** Nome curto da conta: primeiro nome da profissional ou "Master". */
export function accountLabel(s: AdminSession): string {
  return s.role === "master" ? "Master" : s.name.split(" ")[0];
}

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
  const [session, setSession] = useState<AdminSession | null>(null);

  const toLogin = useCallback(
    () => router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`),
    [router, pathname],
  );

  useEffect(() => {
    api.admin.me().then(setSession, (e) => {
      if (e instanceof ApiRequestError && e.status === 401) toLogin();
    });
    // Só no carregamento: a sessão não muda sem novo login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => {
    api.admin.pendingCount().then(
      (c) => {
        setCount(c);
        setTick((t) => t + 1);
      },
      (e) => {
        if (e instanceof ApiRequestError && e.status === 401) toLogin();
      },
    );
  }, [toLogin]);

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

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const badge = count.pending > 0 && (
    <span
      className="min-w-7 rounded-full bg-danger px-2 text-center text-base text-white"
      aria-label={`${count.pending} aguardando confirmação`}
    >
      {count.pending}
    </span>
  );
  const quick = "min-h-10 rounded-full px-3 py-1 font-bold text-coffee hover:bg-blush";

  return (
    // --admin-top: altura do cabeçalho fixo do computador; usada por elementos "sticky" da grade semanal.
    <div className="min-h-dvh [--admin-top:0px] lg:[--admin-top:6.75rem]">
      {/* Computador: cabeçalho fixo em toda a largura, em duas faixas. */}
      <header className="sticky top-0 z-20 hidden border-b border-blush-2 bg-cream/95 backdrop-blur lg:block">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-6 border-b border-blush-2 px-8">
          <Link href="/admin" className="flex shrink-0 items-center gap-3">
            <Image src={mark} alt="" width={40} height={40} />
            <span className="leading-tight">
              <span className="block font-brand font-semibold tracking-wider">LONGO BUCCO</span>
              <span className="block text-sm text-cocoa">Painel do salão</span>
            </span>
          </Link>
          <nav aria-label="Painel" className="min-w-0 flex-1">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => {
                const active = isActive(n.href);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-2 rounded-full px-4 font-bold ${
                        active ? "bg-cocoa text-white" : "text-coffee hover:bg-blush"
                      }`}
                    >
                      {n.label}
                      {n.href === "/admin" && badge}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {session && (
            <div className="flex shrink-0 items-center gap-4">
              <div className="text-right leading-tight">
                <p className="font-bold">{session.role === "master" ? "Master" : session.name}</p>
                <p className="text-sm text-cocoa">{session.role === "master" ? "Acesso completo" : "Profissional"}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="min-h-11 rounded-full border-2 border-cocoa px-4 font-bold text-coffee hover:bg-blush"
              >
                Sair
              </button>
            </div>
          )}
        </div>
        <div className="mx-auto flex h-11 max-w-[90rem] items-center gap-2 px-8 text-base">
          {session && (
            <p className="mr-2 font-bold text-cocoa first-letter:uppercase">{formatDateLong(nowInSalon().date)}</p>
          )}
          <Link
            href="/admin"
            className={`${quick} ${count.pending > 0 ? "bg-danger-bg text-danger hover:bg-danger-bg" : ""}`}
          >
            {count.pending === 0
              ? "Nenhum pedido aguardando"
              : count.pending === 1
                ? "1 aguardando confirmação"
                : `${count.pending} aguardando confirmação`}
            {count.unseen > 0 && ` · ${count.unseen} ${count.unseen === 1 ? "novo" : "novos"}`}
          </Link>
          <span aria-hidden="true" className="text-blush-2">
            |
          </span>
          <Link href="/admin/agenda" className={quick}>
            Agenda de hoje
          </Link>
          <Link href="/admin/agenda?visao=semana" className={quick}>
            Esta semana
          </Link>
          <Link href="/admin/ganhos" className={quick}>
            Ganhos do mês
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <a href="/agendar" target="_blank" rel="noopener" className={quick}>
              Página de agendamento ↗
            </a>
            <span className="rounded-full bg-warn-bg px-3 py-1 text-sm font-bold text-warn" title="Os dados somem ao reiniciar o servidor">
              Modo de teste: dados em memória
            </span>
          </div>
        </div>
      </header>

      {/* Celular e tablet: faixa de teste e cabeçalho com navegação no topo (layout atual). */}
      <p className="bg-warn-bg px-4 py-2 text-center text-base font-bold text-warn lg:hidden">
        Modo de teste: dados em memória (somem ao reiniciar o servidor)
      </p>
      <header className="sticky top-0 z-10 border-b border-blush-2 bg-cream/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2">
          <Link href="/admin" className="flex min-h-12 items-center gap-2">
            <Image src={mark} alt="" width={40} height={40} />
            <span className="font-brand font-semibold tracking-wider">PAINEL</span>
          </Link>
          <div className="flex items-center gap-2">
            {session && <span className="text-base font-bold">{accountLabel(session)}</span>}
            <button
              type="button"
              onClick={logout}
              className="min-h-12 rounded-2xl px-3 font-bold text-coffee underline underline-offset-4"
            >
              Sair
            </button>
          </div>
        </div>
        <nav aria-label="Painel" className="mx-auto max-w-3xl px-2">
          <ul className="flex flex-wrap">
            {NAV.map((n) => {
              const active = isActive(n.href);
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
                    {n.href === "/admin" && badge}
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
          className="mx-4 mt-3 block rounded-2xl bg-danger-bg px-4 py-3 text-center font-bold text-danger sm:mx-auto sm:max-w-3xl lg:hidden"
        >
          {count.unseen === 1 ? "1 pedido novo" : `${count.unseen} pedidos novos`} aguardando confirmação. Ver pedidos
        </Link>
      )}
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-5 lg:max-w-[90rem] lg:px-8 lg:pt-8">
        {session ? (
          <AdminCtx.Provider value={{ ...count, refresh, tick, session }}>{children}</AdminCtx.Provider>
        ) : (
          <Spinner />
        )}
      </main>
    </div>
  );
}
