## Why

No passo de horário do agendamento, o horário já confirmado para outra cliente some da lista. A grade fica com buracos, e a cliente não entende se o salão atende naquele horário. O salão quer o horário marcado no mesmo lugar, em cinza e sem permitir o toque.

## What Changes

- **Disponibilidade:** `GET /api/availability` ganha `taken: string[]`. São os horários da grade do dia que se sobrepõem a um agendamento confirmado da profissional. `slots` não muda; o campo é aditivo.
- **Passo de horário:** junta `slots` e `taken` em ordem crescente.
  - Os livres continuam como hoje.
  - Os ocupados aparecem em cinza, com a palavra "ocupado" abaixo do horário, desabilitados e fora da ordem de tabulação.
  - Com todos ocupados, a grade cinza aparece junto com o aviso "Todos os horários deste dia já estão ocupados." e o botão "Escolher outro dia".
  - Sem nenhum horário (nem livre nem ocupado), continua "Sem horários livres neste dia.".
- **API de teste:** calcula `taken` igual ao backend definitivo (mudança `show-taken-slots` no `beauty-studio-backend`).
- **Fora do escopo:**
  - pendentes continuam livres, sem marca;
  - horários que já passaram continuam fora da grade;
  - a lista de dias não muda.

## Capabilities

### New Capabilities
<!-- nenhuma -->

### Modified Capabilities
- `appointment-booking`: horário ocupado por confirmado passa a aparecer em cinza e desabilitado, em vez de sumir.
- `mock-api`: `GET /api/availability` responde também `taken`.

## Impact

- `lib/domain/availability.ts` (`daySlots` com livres e ocupados);
- `lib/domain/types.ts` (`AvailabilityResponse.taken`);
- `app/api/availability/route.ts`;
- `components/booking/StepTime.tsx`;
- testes de domínio e da API de teste.
- **Backend definitivo sem a mudança correspondente:** `taken` não vem na resposta, e o front trata como lista vazia, mostrando só os livres, como hoje.
