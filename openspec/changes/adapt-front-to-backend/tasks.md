## 1. Preparação

- [ ] 1.1 Confirmar com o usuário que a mudança `add-service-photo` (concluída, sem commit) foi commitada ou arquivada antes de mexer nos mesmos arquivos
- [ ] 1.2 Rodar `npm test` e `npm run lint` como linha de base

## 2. Tipos e cliente da API

- [ ] 2.1 `lib/domain/types.ts`:
  - `whatsappPhone: string | null` em `Professional` e `AdminSession`;
  - `"db"` em `AdminAccount.login`;
  - `TOO_MANY_ATTEMPTS` e `SERVICE_UNAVAILABLE` em `ApiErrorCode`.
- [ ] 2.2 `lib/api-client.ts`:
  - mensagens `FRIENDLY` dos dois códigos novos (D6);
  - `api.admin.updateMe({ whatsappPhone })` → `PATCH /api/admin/me`, que devolve `AdminSession`.

## 3. API de teste

- [ ] 3.1 Store e seed: `whatsappPhone: null` nas profissionais; `repo.updateProfessionalWhatsapp(id, phone | null)`; `createProfessional` cria com `null`
- [ ] 3.2 `sessionFor` devolve `whatsappPhone` (o master sempre `null`)
- [ ] 3.3 `PATCH /api/admin/me`:
  - 403 `FORBIDDEN` para o master;
  - 400 `VALIDATION_ERROR` em `fields.whatsappPhone` com `PHONE_MESSAGE`;
  - `null` ou vazio remove o número;
  - 200 com a sessão atualizada.
- [ ] 3.4 Conferir que `GET /api/admin/professionals` e `GET /api/admin/services` trazem `whatsappPhone` e que os endpoints públicos não trazem
- [ ] 3.5 Testes em `lib/server/admin-api.test.ts`:
  - salvar e remover o número;
  - número inválido;
  - master recebe 403;
  - número ausente em `GET /api/services`;
  - sessão com `whatsappPhone`.

## 4. Painel

- [ ] 4.1 `AdminShell`:
  - expor `setSession` no `AdminCtx` (D1);
  - aviso "Cadastre seu WhatsApp para receber os pedidos novos" para profissional sem número, com link para `/admin/servicos#meu-whatsapp`, nos layouts de celular e de computador.
- [ ] 4.2 Criar `components/admin/MyWhatsApp.tsx`:
  - número atual formatado ou "Nenhum número cadastrado";
  - campo com `maskPhoneInput`;
  - validação `parsePhoneBR` e `PHONE_MESSAGE`;
  - "Salvar" e "Remover número";
  - confirmação "WhatsApp salvo" ou "WhatsApp removido";
  - erro da API ao lado do campo;
  - grava no contexto a sessão devolvida.
- [ ] 4.3 `ServicesAdmin`: mostrar `MyWhatsApp` no topo, só para a profissional, com a âncora `meu-whatsapp`
- [ ] 4.4 "Profissionais e logins" (master): mostrar o WhatsApp formatado ou "WhatsApp não cadastrado", só leitura
- [ ] 4.5 `LoginStatus`: tratar `"db"` como "Login ativo (criado no painel)", com troca de senha e sem aviso de reinício; manter o texto de `"memory"`
- [x] 4.6 `AdminShell`: remover a faixa e o selo de "Modo de teste" nos dois layouts

## 5. Agendamento

- [ ] 5.1 `StepCustomer`: texto "As atualizações do seu pedido chegam por mensagem neste WhatsApp."
- [ ] 5.2 `StepReview`: junto ao número, avisar que as atualizações do pedido chegam nesse WhatsApp, ajustando o texto atual de confirmação
- [x] 5.3 `AppointmentStatus`: remover o botão "Copiar ou compartilhar o link" e o texto "Guarde este link para acompanhar."

## 6. Verificação

- [ ] 6.1 `npm test` e `npm run lint` sem falhas
- [ ] 6.2 Com a API de teste (`NEXT_PUBLIC_API_BASE_URL` vazio), conferir no navegador:
  - a profissional salva e remove o número, e o aviso aparece e some;
  - o master vê o número só para leitura;
  - o login criado pelo painel mostra o aviso de reinício.
- [ ] 6.3 Com o backend definitivo (`./stack.sh local up -d` e `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`), repetir 6.2 e conferir:
  - login criado pelo painel com `"db"`;
  - pedido novo da profissional com número gera a mensagem no log do notification-service (`./stack.sh local logs notification-service`).
- [ ] 6.4 Atualizar o README do front: variável `NEXT_PUBLIC_API_BASE_URL`, "Meu WhatsApp" (a frase sobre a faixa de teste já foi tirada do README)
