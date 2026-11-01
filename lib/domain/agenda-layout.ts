import { CLOSE_MIN, OPEN_MIN, STEP_MIN, toMinutes } from "./schedule";

/** Linhas de 30 min entre a abertura e o fechamento (09:00–20:00 → 22). */
export const GRID_ROWS = (CLOSE_MIN - OPEN_MIN) / STEP_MIN;

export interface LayoutInput {
  id: string;
  time: string;
  durationMin: number;
}

export interface BlockLayout {
  id: string;
  /** Linha inicial na grade (1 = 09:00). */
  row: number;
  /** Quantidade de linhas de 30 min. */
  span: number;
  /** Faixa do bloco (0 = primeira) dentro do grupo de sobreposição. */
  lane: number;
  /** Total de faixas do grupo de sobreposição. */
  lanes: number;
}

/**
 * Posição dos agendamentos de um dia na grade semanal.
 * Agendamentos que se sobrepõem ficam lado a lado, em faixas.
 */
export function layoutDay(items: LayoutInput[]): BlockLayout[] {
  const sorted = items
    .map((it) => {
      const start = Math.max(OPEN_MIN, toMinutes(it.time));
      const end = Math.min(CLOSE_MIN, Math.max(start + STEP_MIN, toMinutes(it.time) + it.durationMin));
      return { id: it.id, start, end };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const out: BlockLayout[] = [];
  let group: { block: BlockLayout; end: number }[] = [];
  let groupEnd = -1;
  const closeGroup = () => {
    const lanes = Math.max(0, ...group.map((g) => g.block.lane)) + 1;
    for (const g of group) g.block.lanes = lanes;
    group = [];
  };

  for (const it of sorted) {
    if (it.start >= groupEnd && group.length) closeGroup();
    // Primeira faixa livre no grupo atual.
    const busy = new Set(group.filter((g) => g.end > it.start).map((g) => g.block.lane));
    let lane = 0;
    while (busy.has(lane)) lane++;
    const block: BlockLayout = {
      id: it.id,
      row: (it.start - OPEN_MIN) / STEP_MIN + 1,
      span: Math.ceil((it.end - it.start) / STEP_MIN),
      lane,
      lanes: 1,
    };
    group.push({ block, end: it.end });
    groupEnd = Math.max(groupEnd, it.end);
    out.push(block);
  }
  if (group.length) closeGroup();
  return out;
}
