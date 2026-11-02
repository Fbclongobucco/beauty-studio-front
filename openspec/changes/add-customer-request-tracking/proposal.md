## Why

A cliente que fez um pedido não tem como voltar a ele pelo site: depois de fechar a aba, só acha o pedido pelo link do WhatsApp. Com esta mudança, ao voltar à página inicial no mesmo aparelho, ela é levada direto à tela do pedido em andamento, com o status, sem login.

## What Changes

- **Redirecionamento ao voltar:** ao abrir a página inicial com pedido em andamento no aparelho, a cliente vai direto para `/agendamento/{id}` do pedido mais próximo.
  - Uma vez por visita (aba do navegador), para não prendê-la na tela do pedido.
  - "Voltar para o início" na tela do pedido abre a página inicial sem redirecionar.
- **Cartão "Seu pedido" na página inicial**, acima de "Agendar horário", para quando ela volta ao início:
  - serviço, dia e horário, profissional e status com a cor do status;
  - botão "Ver pedido", que abre `/agendamento/{id}`.
  - Até 3 pedidos, do mais próximo para o mais distante; acima disso, "e mais N pedidos".
  - Sem pedido em andamento, o cartão não aparece e a página fica como hoje.
- **Cliente da API:** `api.myRequests()` → `GET /api/appointments/mine`.
- **API de teste:** o mesmo contrato do backend definitivo (mudança `add-customer-request-tracking` no `beauty-studio-backend`): cookie `my_requests` gravado na criação e na consulta do pedido, mais o endpoint novo.

## Capabilities

### New Capabilities
- `customer-request-tracking`: redirecionamento da página inicial para o pedido em andamento e cartão de acompanhamento, com os pedidos do aparelho.

### Modified Capabilities
- `mock-api`: cookie `my_requests` e o endpoint `GET /api/appointments/mine`.

## Impact

- **Front:**
  - `app/page.tsx`;
  - `components/booking/AppointmentStatus.tsx` ("Voltar para o início");
  - novo `components/public/MyRequests.tsx`;
  - `lib/api-client.ts`, `lib/domain/types.ts`, que ganha `MyRequestsResponse`.
- **API de teste:**
  - `app/api/appointments/route.ts`, `app/api/appointments/[id]/route.ts`;
  - novo `app/api/appointments/mine/route.ts`;
  - helper de cookie em `lib/server`.
- **Dependência:** o backend definitivo precisa da mudança correspondente para o cartão aparecer quando o front estiver ligado a ele. Sem ela, `GET /mine` cai em `/{id}` e responde 404, e o cartão simplesmente não aparece.
