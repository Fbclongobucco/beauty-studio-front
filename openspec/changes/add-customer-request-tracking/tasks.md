## 1. Contrato

- [ ] 1.1 `lib/domain/types.ts`: `MyRequestsResponse { appointments: PublicAppointment[] }`
- [ ] 1.2 `lib/api-client.ts`: `api.myRequests()` e `api.forgetRequest(id)`

## 2. API de teste

- [ ] 2.1 `lib/server/my-requests.ts`:
  - ler e gravar o cookie assinado (D3);
  - até 10 ids, mais recente primeiro, sem duplicar;
  - inválido conta como vazio;
  - `HttpOnly`, `Path=/api/appointments`, 60 dias.
- [ ] 2.2 Gravar o cookie em `POST /api/appointments` (201) e `GET /api/appointments/[id]` (200)
- [ ] 2.3 `app/api/appointments/mine/route.ts` (GET), com o filtro de "em andamento" pelo relógio e fuso de São Paulo de `lib/domain/schedule`, ordenado pelo início, tirando do cookie os ids inexistentes
- [ ] 2.4 `app/api/appointments/mine/[id]/route.ts` (DELETE)
- [ ] 2.5 Testes:
  - criar grava o cookie;
  - `/mine` filtra pendente, confirmado futuro, recusado futuro e passado;
  - cookie adulterado;
  - limite de 10;
  - DELETE não muda o status.

## 3. Página inicial

- [ ] 3.1 `components/public/MyRequests.tsx`:
  - cartão "Seu pedido" / "Seus pedidos";
  - até 3 itens e "e mais N pedidos";
  - status com `STATUS_LABEL` e as cores da tela do pedido;
  - "Ver pedido" e "Não é meu pedido" (D4);
  - `null` quando vazio, carregando ou com erro.
- [ ] 3.2 `app/page.tsx`: `MyRequests` acima de "Agendar horário"

## 4. Verificação

- [ ] 4.1 `npm test` e `npm run lint`
- [ ] 4.2 No navegador, com a API de teste: pedir um horário, voltar ao início e ver o cartão; confirmar no painel e ver "Confirmado"; usar "Não é meu pedido"
- [ ] 4.3 Com o backend definitivo, depois da mudança correspondente aplicada lá: repetir 4.2 e abrir o link do pedido em uma janela anônima para ver o cartão aparecer nela
