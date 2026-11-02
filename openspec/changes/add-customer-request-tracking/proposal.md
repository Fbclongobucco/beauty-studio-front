## Why

A cliente que fez um pedido não tem como voltar a ele pelo site: depois de fechar a aba, só acha o pedido pelo link do WhatsApp. Esta mudança mostra no topo da página inicial um cartão com os pedidos em andamento feitos ou abertos naquele aparelho, com o status, sem login.

## What Changes

- **Cartão "Seu pedido" na página inicial**, acima de "Agendar horário":
  - serviço, dia e horário, profissional e status com a cor do status;
  - botão "Ver pedido", que abre `/agendamento/{id}`;
  - link "Não é meu pedido", que tira o pedido deste aparelho.
  - Até 3 pedidos, do mais próximo para o mais distante; acima disso, "e mais N pedidos".
  - Sem pedido em andamento, o cartão não aparece e a página fica como hoje.
- **Cliente da API:** `api.myRequests()` → `GET /api/appointments/mine` e `api.forgetRequest(id)` → `DELETE /api/appointments/mine/{id}`.
- **API de teste:** o mesmo contrato do backend definitivo (mudança `add-customer-request-tracking` no `beauty-studio-backend`): cookie `my_requests` gravado na criação e na consulta do pedido, mais os dois endpoints novos.
- A página inicial continua abrindo normalmente: não há redirecionamento automático para o pedido.

## Capabilities

### New Capabilities
- `customer-request-tracking`: cartão de acompanhamento na página inicial, com os pedidos em andamento do aparelho.

### Modified Capabilities
- `mock-api`: cookie `my_requests` e os endpoints `GET /api/appointments/mine` e `DELETE /api/appointments/mine/{id}`.

## Impact

- **Front:**
  - `app/page.tsx`;
  - novo `components/public/MyRequests.tsx`;
  - `lib/api-client.ts`, `lib/domain/types.ts`, que ganha `MyRequestsResponse`.
- **API de teste:**
  - `app/api/appointments/route.ts`, `app/api/appointments/[id]/route.ts`;
  - novo `app/api/appointments/mine/route.ts` e `mine/[id]/route.ts`;
  - helper de cookie em `lib/server`.
- **Dependência:** o backend definitivo precisa da mudança correspondente para o cartão aparecer quando o front estiver ligado a ele. Sem ela, `GET /mine` cai em `/{id}` e responde 404, e o cartão simplesmente não aparece.
