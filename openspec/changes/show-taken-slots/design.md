## Context

`availableSlots` filtra `gridStarts(duração)` pelo passado e pelas sobreposições com confirmados. `StepTime` renderiza `data.slots` em uma grade de 3 colunas e mostra "Sem horários livres neste dia." quando a lista vem vazia.

## Goals / Non-Goals

**Goals:**
- Grade estável: o horário fica na posição dele, livre ou ocupado.
- Mesmo contrato na API de teste e no backend definitivo.

**Non-Goals:**
- Marcar pendentes.
- Mostrar horários passados.
- Mudar a lista de dias.

## Decisions

### D1. `daySlots` no domínio
`daySlots(duração, data, busy, now)` devolve `{ free, taken }` a partir da mesma grade filtrada pelo passado. `availableSlots` passa a ser `daySlots(...).free`, sem mudar o resultado.

### D2. Botão desabilitado de verdade
O horário ocupado é um `<button disabled>` com `aria-disabled`, no estilo cinza (`bg-black/5`, texto `text-cocoa/50`, borda tracejada) e com a palavra "ocupado" em texto, não só pela cor. Com `disabled`, o botão sai da tabulação e não dispara clique.

Alternativa descartada: `<span>` estático, que perderia a semântica de grade de botões para leitores de tela.

### D3. Compatibilidade
O front lê `data.taken ?? []`. Contra um backend sem a mudança correspondente, mostra só os livres, como hoje.

### D4. Ordem
A grade é `[...slots, ...taken]` ordenada por `HH:mm`. Como o formato tem tamanho fixo, a ordenação de texto é a mesma da ordenação por horário.

## Risks / Trade-offs

- **Revela que o horário está ocupado:** é a mesma informação que o buraco na grade já mostrava, sem identificar a cliente.
