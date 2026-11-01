"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

const inputClass =
  "mt-2 block w-full rounded-2xl border-2 border-blush-2 bg-white px-4 py-3 text-lg focus:border-cocoa";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = useId();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.admin.login(username, password);
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor={`${id}-user`} className="block font-bold">
          Usuário
        </label>
        <input
          id={`${id}-user`}
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-invalid={!!error || undefined}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={`${id}-pw`} className="block font-bold">
          Senha
        </label>
        <input
          id={`${id}-pw`}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className={inputClass}
        />
        {error && (
          <p id={`${id}-err`} role="alert" className="mt-2 font-bold text-danger">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={busy || !username.trim() || !password}>
        {busy ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
