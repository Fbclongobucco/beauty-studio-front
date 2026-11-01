"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = useId();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.admin.login(password);
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor={id} className="block font-bold">
          Senha
        </label>
        <input
          id={id}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className="mt-2 block w-full rounded-2xl border-2 border-blush-2 bg-white px-4 py-3 text-lg focus:border-cocoa"
        />
        {error && (
          <p id={`${id}-err`} role="alert" className="mt-2 font-bold text-danger">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={busy || !password}>
        {busy ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
