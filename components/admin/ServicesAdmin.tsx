"use client";

import { useId, useState } from "react";
import { api, ApiRequestError } from "@/lib/api-client";
import { centsToInput, formatDurationShort, formatPrice } from "@/lib/domain/format";
import { parsePriceBRL } from "@/lib/domain/validation";
import type { Category, Professional, Service } from "@/lib/domain/types";
import { useApi } from "@/lib/client/useApi";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { DurationSelect, Field, PriceInput, inputClass } from "./fields";
import { ServiceForm } from "./ServiceForm";
import { useAdmin } from "./AdminShell";

const PRICE_ERROR = "Informe um valor em reais, ex.: 45,00";

export function ServicesAdmin() {
  const { session } = useAdmin();
  const isMaster = session.role === "master";
  const { data, stale, error, reload } = useApi("admin-catalog", api.admin.catalog);
  const catalog = data ?? stale;
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const done = (msg: string) => {
    setFlash(msg);
    reload();
  };

  if (error && !catalog) return <p className="rounded-3xl bg-danger-bg p-5 font-bold text-danger">{error.message}</p>;
  if (!catalog) return <Spinner />;
  const { services, categories, professionals } = catalog;
  // A API já filtra para a profissional; aqui só se escondem categorias vazias para ela.
  const visibleCategories = isMaster ? categories : categories.filter((c) => services.some((s) => s.categoryId === c.id));

  return (
    <div>
      <h1 className="font-brand text-2xl font-semibold">Serviços e valores</h1>
      <p className="mt-1 text-base">
        Altere preço e duração e salve. A mudança vale na hora para as clientes. Agendamentos já
        feitos mantêm o valor e a duração do dia do pedido.
      </p>
      {flash && (
        <p role="status" className="mt-4 rounded-2xl bg-ok-bg px-4 py-3 font-bold text-ok">
          {flash}
        </p>
      )}

      {/* Computador: tabela com edição ao lado. */}
      <div className="hidden lg:block">
        <ServicesTable
          services={services}
          categories={categories}
          professionals={professionals}
          isMaster={isMaster}
          onSaved={done}
        />
        {isMaster && (
          <section className="mt-10">
            <h2 className="font-brand text-2xl font-semibold">Avisos das categorias</h2>
            <div className="mt-3 grid grid-cols-2 gap-4 min-[1440px]:grid-cols-3">
              {categories.map((c) => (
                <div key={`${c.id}:${c.note ?? ""}`}>
                  <h3 className="font-bold text-coffee">{c.name}</h3>
                  <CategoryNote category={c} onSaved={done} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Celular e tablet: cards por categoria. */}
      <div className="mt-5 lg:hidden">
        {creating ? (
          <div className="rounded-3xl border-2 border-cocoa bg-white p-5">
            <h2 className="mb-4 text-xl font-bold">Novo serviço</h2>
            <ServiceForm
              categories={categories}
              professionals={professionals}
              services={services}
              isMaster={isMaster}
              onCancel={() => setCreating(false)}
              onSaved={(s) => {
                setCreating(false);
                done(`Serviço "${s.name}" criado.`);
              }}
            />
          </div>
        ) : (
          <Button className="w-full" onClick={() => setCreating(true)}>
            + Novo serviço
          </Button>
        )}
      </div>

      <div className="lg:hidden">
        {visibleCategories.map((c) => (
          <CategorySection
            key={`${c.id}:${c.note ?? ""}`}
            category={c}
            services={services.filter((s) => s.categoryId === c.id)}
            allServices={services}
            categories={categories}
            professionals={professionals}
            isMaster={isMaster}
            onSaved={done}
          />
        ))}
      </div>

      {isMaster && <ProfessionalsSection professionals={professionals} onSaved={done} />}
    </div>
  );
}

function CategorySection({
  category,
  services,
  allServices,
  categories,
  professionals,
  isMaster,
  onSaved,
}: {
  category: Category;
  services: Service[];
  allServices: Service[];
  categories: Category[];
  professionals: Professional[];
  isMaster: boolean;
  onSaved: (msg: string) => void;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-brand text-2xl font-semibold text-coffee">{category.name}</h2>
      {isMaster && <CategoryNote category={category} onSaved={onSaved} />}
      {services.length === 0 ? (
        <p className="mt-3 text-base">Nenhum serviço nesta categoria.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {services.map((s) => (
            <li key={`${s.id}:${s.priceCents}:${s.durationMin}:${s.name}:${s.active}`}>
              <ServiceRow
                service={s}
                professionals={professionals}
                categories={categories}
                allServices={allServices}
                isMaster={isMaster}
                onSaved={onSaved}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Aviso da categoria para as clientes (só master). */
function CategoryNote({ category, onSaved }: { category: Category; onSaved: (msg: string) => void }) {
  const [note, setNote] = useState(category.note ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const id = useId();
  const dirty = note.trim() !== (category.note ?? "");

  async function saveNote() {
    setBusy(true);
    setErr(null);
    try {
      await api.admin.updateCategory(category.id, { note: note.trim() || null });
      onSaved(`Aviso de ${category.name} atualizado.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-3xl bg-blush p-4">
      <Field id={id} label="Aviso para as clientes (aparece ao abrir a categoria)" error={err ?? undefined}>
        <textarea id={id} value={note} maxLength={200} rows={2} onChange={(e) => setNote(e.target.value)} className={inputClass} />
      </Field>
      <Button variant="secondary" className="mt-3 w-full" disabled={!dirty || busy} onClick={saveNote}>
        {busy ? "Salvando..." : "Salvar aviso"}
      </Button>
    </div>
  );
}

function ServiceRow({
  service,
  professionals,
  categories,
  allServices,
  isMaster,
  onSaved,
}: {
  service: Service;
  professionals: Professional[];
  categories: Category[];
  allServices: Service[];
  isMaster: boolean;
  onSaved: (msg: string) => void;
}) {
  const [price, setPrice] = useState(centsToInput(service.priceCents));
  const [duration, setDuration] = useState(service.durationMin);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const priceId = useId();
  const durId = useId();

  const parsed = price.trim() === "" ? null : parsePriceBRL(price);
  const priceInvalid = price.trim() !== "" && parsed === null;
  const dirty = (parsed ?? null) !== service.priceCents || duration !== service.durationMin;
  const prof = professionals.find((p) => p.id === service.professionalId);

  async function save() {
    if (priceInvalid) return setErr(PRICE_ERROR);
    setBusy(true);
    setErr(null);
    try {
      const patch: { priceCents?: number | null; durationMin?: number } = {};
      if (parsed !== service.priceCents) patch.priceCents = parsed;
      if (duration !== service.durationMin) patch.durationMin = duration;
      await api.admin.updateService(service.id, patch);
      onSaved(`${service.name}: ${formatPrice(parsed)} · ${formatDurationShort(duration)}.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-3xl border-2 border-cocoa bg-white p-5">
        <h3 className="mb-4 text-xl font-bold">Editar {service.name}</h3>
        <ServiceForm
          service={service}
          categories={categories}
          professionals={professionals}
          services={allServices}
          isMaster={isMaster}
          onCancel={() => setEditing(false)}
          onSaved={(s) => {
            setEditing(false);
            onSaved(`Serviço "${s.name}" atualizado.`);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border-2 bg-white/90 p-4 ${service.active ? "border-blush-2" : "border-dashed border-cocoa/40 opacity-80"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-bold text-coffee">{service.name}</p>
        {service.durationEstimated && (
          <span className="rounded-full bg-warn-bg px-3 py-0.5 text-base font-bold text-warn">duração estimada</span>
        )}
        {!service.active && <span className="rounded-full bg-blush-2 px-3 py-0.5 text-base font-bold">Inativo</span>}
      </div>
      <p className="text-base text-cocoa">
        {[service.subcategory, isMaster ? (prof?.name ?? "Sem profissional") : null].filter(Boolean).join(" · ")}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field id={priceId} label="Preço" error={priceInvalid ? PRICE_ERROR : undefined}>
          <PriceInput
            id={priceId}
            value={price}
            aria-invalid={priceInvalid || undefined}
            aria-describedby={priceInvalid ? `${priceId}-err` : undefined}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
        <Field id={durId} label="Duração">
          <DurationSelect id={durId} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </Field>
      </div>
      {price.trim() === "" && <p className="mt-1 text-base">Sem preço: a cliente vê &quot;Consultar valor&quot;.</p>}
      {err && !priceInvalid && <p className="mt-2 font-bold text-danger">{err}</p>}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button onClick={save} disabled={!dirty || busy || priceInvalid}>
          {busy ? "Salvando..." : "Salvar"}
        </Button>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Editar tudo
        </Button>
      </div>
    </div>
  );
}

function ProfessionalsSection({ professionals, onSaved }: { professionals: Professional[]; onSaved: (m: string) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const id = useId();
  // Recarrega os logins quando a lista de profissionais muda (nova profissional).
  const accounts = useApi(`accounts:${professionals.map((p) => p.id).join(",")}`, api.admin.accounts);
  const [loginFor, setLoginFor] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setErr(null);
    try {
      const p = await api.admin.createProfessional(name);
      setName("");
      setLoginFor(p.id);
      onSaved(`${p.name} cadastrada. Crie o login dela abaixo.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  const byId = new Map((accounts.data?.accounts ?? []).map((a) => [a.professionalId, a.login]));

  return (
    <section className="mt-10">
      <h2 className="font-brand text-2xl font-semibold">Profissionais e logins</h2>
      <p className="mt-1 text-base">
        Seu usuário: <code>{accounts.data?.masterUsername ?? "…"}</code> (acesso completo). Cada profissional entra com o
        próprio usuário e vê só o trabalho dela.
      </p>
      <ul className="mt-3 grid gap-3 lg:grid-cols-2 min-[1440px]:grid-cols-3">
        {professionals.map((p) => (
          <li key={p.id} className="rounded-2xl bg-white/80 px-4 py-3">
            <p>
              <span className="font-bold">{p.name}</span> · usuário <code>{p.id}</code>
            </p>
            <LoginStatus
              professional={p}
              login={accounts.data ? (byId.get(p.id) ?? null) : undefined}
              open={loginFor === p.id}
              onOpen={() => setLoginFor(loginFor === p.id ? null : p.id)}
              onSaved={(msg) => {
                setLoginFor(null);
                accounts.reload();
                onSaved(msg);
              }}
            />
          </li>
        ))}
      </ul>
      <div className="mt-4 lg:max-w-xl">
        <Field id={id} label="Nova profissional" error={err ?? undefined}>
          <input id={id} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="off" />
        </Field>
        <p className="mt-2 text-base">
          O usuário é gerado no cadastro (primeiro nome, sem acento, em minúsculas). Depois, crie a senha dela na lista acima.
        </p>
        <Button variant="secondary" className="mt-3 w-full lg:w-auto" disabled={busy || name.trim().length < 2} onClick={add}>
          Cadastrar profissional
        </Button>
      </div>
    </section>
  );
}

/** Situação do login da profissional e formulário para criar ou trocar a senha (logins do painel ficam em memória). */
function LoginStatus({
  professional,
  login,
  open,
  onOpen,
  onSaved,
}: {
  professional: Professional;
  login: "env" | "memory" | null | undefined;
  open: boolean;
  onOpen: () => void;
  onSaved: (msg: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const id = useId();

  if (login === undefined) return <p className="text-base text-cocoa">Carregando login…</p>;
  if (login === "env") return <p className="text-base text-ok">Login ativo (senha definida no servidor)</p>;

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      await api.admin.setAccount(professional.id, password);
      setPassword("");
      onSaved(`Login de ${professional.name.split(" ")[0]} ${login ? "atualizado" : "criado"}: usuário ${professional.id}.`);
    } catch (e) {
      setErr(e instanceof ApiRequestError && e.fields ? Object.values(e.fields)[0] : e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className={`text-base ${login ? "text-ok" : "text-warn"}`}>
        {login ? "Login ativo (criado no painel; some ao reiniciar o servidor)" : "Sem login: ainda não consegue entrar"}
      </p>
      {!open ? (
        <button type="button" onClick={onOpen} className="min-h-12 font-bold underline underline-offset-4">
          {login ? "Trocar senha" : "Criar login"}
        </button>
      ) : (
        <div className="mt-2">
          <Field id={id} label={`Senha de ${professional.name.split(" ")[0]} (mínimo 6 caracteres)`} error={err ?? undefined}>
            <input
              id={id}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button onClick={save} disabled={busy || password.length < 6}>
              {busy ? "Salvando..." : "Salvar senha"}
            </Button>
            <Button variant="secondary" onClick={onOpen} disabled={busy}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Computador: tabela de serviços com formulário de edição/criação ao lado. */
function ServicesTable({
  services,
  categories,
  professionals,
  isMaster,
  onSaved,
}: {
  services: Service[];
  categories: Category[];
  professionals: Professional[];
  isMaster: boolean;
  onSaved: (msg: string) => void;
}) {
  const [panel, setPanel] = useState<{ id: string | null } | null>(null);
  const editing = panel?.id ? services.find((s) => s.id === panel.id) : undefined;
  const catOrder = new Map(categories.map((c, i) => [c.id, i]));
  const rows = [...services].sort(
    (a, b) => (catOrder.get(a.categoryId) ?? 99) - (catOrder.get(b.categoryId) ?? 99) || a.sortOrder - b.sortOrder,
  );
  const th = "px-4 py-3 font-bold";

  return (
    <div className="mt-5">
      <div>
        <Button onClick={() => setPanel({ id: null })}>+ Novo serviço</Button>
        <div className="mt-4 overflow-x-auto rounded-3xl border-2 border-blush-2 bg-white/90">
          <table className="w-full text-left text-base">
            <caption className="sr-only">Serviços</caption>
            <thead className="bg-blush text-coffee">
              <tr>
                <th scope="col" className={th}>
                  Serviço
                </th>
                <th scope="col" className={th}>
                  Categoria
                </th>
                <th scope="col" className={th}>
                  Duração
                </th>
                <th scope="col" className={`${th} text-right`}>
                  Preço
                </th>
                {isMaster && (
                  <th scope="col" className={th}>
                    Profissional
                  </th>
                )}
                <th scope="col" className={th}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const selected = panel?.id === s.id;
                return (
                  <tr
                    key={s.id}
                    onClick={() => setPanel({ id: s.id })}
                    className={`cursor-pointer border-t border-blush-2 ${selected ? "bg-blush" : "hover:bg-cream"} ${s.active ? "" : "text-cocoa"}`}
                  >
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        aria-label={`Editar ${s.name}`}
                        aria-pressed={selected}
                        className="min-h-10 text-left font-bold text-coffee underline-offset-4 hover:underline"
                      >
                        {s.name}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      {categories.find((c) => c.id === s.categoryId)?.name}
                      {s.subcategory && <span className="block text-cocoa">{s.subcategory}</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {formatDurationShort(s.durationMin)}
                      {s.durationEstimated && (
                        <span className="mt-0.5 block w-fit rounded-full bg-warn-bg px-2 text-sm font-bold text-warn">
                          duração estimada
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">{formatPrice(s.priceCents)}</td>
                    {isMaster && (
                      <td className="px-4 py-2">{professionals.find((p) => p.id === s.professionalId)?.name.split(" ")[0] ?? "—"}</td>
                    )}
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-3 py-0.5 text-sm font-bold ${s.active ? "bg-ok-bg text-ok" : "bg-blush-2 text-coffee"}`}
                      >
                        {s.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {panel && (
        // Gaveta fixa à direita: a tabela mantém a largura toda.
        <aside
          aria-label="Edição do serviço"
          className="fixed inset-y-0 right-0 z-30 w-[28rem] max-w-full overflow-y-auto border-l-2 border-cocoa bg-white p-6 shadow-xl"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold">{editing ? `Editar ${editing.name}` : "Novo serviço"}</h2>
            <button
              type="button"
              onClick={() => setPanel(null)}
              className="min-h-12 shrink-0 font-bold underline underline-offset-4"
            >
              Fechar
            </button>
          </div>
          <ServiceForm
            key={editing?.id ?? "novo"}
            service={editing}
            categories={categories}
            professionals={professionals}
            services={services}
            isMaster={isMaster}
            onCancel={() => setPanel(null)}
            onSaved={(s) => {
              setPanel(null);
              onSaved(editing ? `Serviço "${s.name}" atualizado.` : `Serviço "${s.name}" criado.`);
            }}
          />
        </aside>
      )}
    </div>
  );
}
