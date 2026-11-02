/**
 * Marca da visita (aba do navegador): a página inicial leva a cliente ao pedido em andamento só uma vez,
 * e não leva se ela já abriu a tela de um pedido nesta aba.
 */
const KEY = "lb-mine-redirected";

export function alreadyShownThisVisit(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    // Sem sessionStorage (modo privado restrito): não redireciona, para não prender a cliente.
    return true;
  }
}

export function markShownThisVisit(): void {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {}
}
