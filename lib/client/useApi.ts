"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/api-client";

type State<T> = { key: string; data?: T; error?: ApiRequestError };

/**
 * Busca dados para uma chave. `loading` é derivado (chave atual ≠ chave carregada),
 * sem setState síncrono dentro do efeito. `key = null` desativa a busca.
 */
export function useApi<T>(key: string | null, fetcher: () => Promise<T>) {
  const [state, setState] = useState<State<T>>({ key: "" });
  const [nonce, setNonce] = useState(0);
  const fullKey = key === null ? null : `${key}#${nonce}`;

  useEffect(() => {
    if (fullKey === null) return;
    let alive = true;
    fetcher().then(
      (data) => alive && setState({ key: fullKey, data }),
      (error: unknown) =>
        alive &&
        setState({
          key: fullKey,
          error: error instanceof ApiRequestError ? error : new ApiRequestError(0, "NETWORK", "Algo deu errado."),
        }),
    );
    return () => {
      alive = false;
    };
    // fetcher muda a cada render; a chave identifica a busca.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const current = fullKey !== null && state.key === fullKey;
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    loading: fullKey !== null && !current,
    /** Último dado carregado, mesmo de outra chave (evita piscar durante recarga). */
    stale: state.data,
    reload,
  };
}
