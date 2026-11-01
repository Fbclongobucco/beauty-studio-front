# beauty-studio-front

Front-end do **Longo Bucco Beauty Studio**: agendamento de serviços (unhas, tranças e depilação) por disponibilidade, com painel para as profissionais confirmarem os pedidos. Mobile first, pensado para clientes idosas, e instalável como PWA.

Stack: Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, TypeScript. Testes de domínio com Vitest.

## Como rodar

```bash
npm install
cp .env.example .env.local   # defina ADMIN_PASSWORD
npm run dev                  # http://localhost:3000
```

- Site das clientes: `/`
- Agendamento: `/agendar`
- Painel das profissionais: `/admin` (senha em `ADMIN_PASSWORD`)

Outros comandos:

```bash
npm test         # testes de domínio e da API em memória
npm run lint
npm run build && npm start
npm run logo     # regenera logo e ícones em public/brand/
```

## Variáveis de ambiente

- `ADMIN_PASSWORD`: senha única do painel `/admin`. Sem ela, o login fica desabilitado. A sessão dura 12 h, em cookie `httpOnly` assinado com HMAC.
- `NEXT_PUBLIC_API_BASE_URL`: URL base da API. Vazio = mesma origem (API de teste em `app/api`).

## Regras de agenda

- Segunda a sábado, das 09h às 20h (fuso America/Sao_Paulo), em horários de 30 em 30 minutos.
- O serviço precisa terminar até 20h. Exemplo: um serviço de 2 h começa no máximo às 18:00.
- A agenda abre do horário atual até 30 dias à frente.
- A disponibilidade é por profissional. Só agendamentos **confirmados** bloqueiam horário. Pedidos novos ficam "Aguardando confirmação" até a profissional confirmar no painel.
- Dois pedidos no mesmo horário aparecem com "Conflito de horário". Depois que um é confirmado, o outro não pode mais ser confirmado.

## Catálogo, preços e durações

- Os preços vêm das tabelas oficiais do salão, em `docs/referencias/tabela-precos-unhas.jpg` e `docs/referencias/tabela-precos-trancas.jpg`. A depilação (R$ 80,00, 1 h) foi informada pelas donas.
- Estas durações foram informadas pelas donas: Manicure 30 min, Pedicure 30 min, Manicure + Pedicure 1 h, Depilação 1 h.
- **As demais durações são ESTIMATIVA** (autorizada para teste). Elas aparecem com a marca "duração estimada" no painel e devem ser revisadas pelas profissionais em **Painel → Serviços** antes do uso real. A marca some quando a duração é editada.
- Preços, durações, avisos das categorias, novos serviços, novas categorias e novas profissionais são editáveis no painel. Agendamentos já feitos mantêm o preço e a duração do momento do pedido.
- Catálogo inicial: `lib/server/seed.ts`.

## API de teste (dados em memória)

Os dados ficam na memória do processo do servidor. **Tudo se perde ao reiniciar** (agendamentos e edições do painel), e não funciona com várias instâncias (serverless). Serve apenas para testes, até a chegada do backend definitivo. O painel mostra a faixa "Modo de teste".

O front-end acessa os dados **somente por HTTP** (`lib/api-client.ts`). Para trocar pelo backend definitivo, basta implementar os mesmos contratos e apontar `NEXT_PUBLIC_API_BASE_URL`.

### Endpoints públicos

- `GET /api/services`: categorias (com aviso) e serviços ativos.
- `GET /api/availability?serviceId=&date=AAAA-MM-DD`: horários de início livres.
- `GET /api/availability/days?serviceId=&from=AAAA-MM-DD&days=N`: dias abertos e se têm horário livre.
- `POST /api/appointments`: cria o pedido `{ serviceId, date, time, customerName, customerPhone, notes? }`. Respostas: 201, 400 `VALIDATION_ERROR` ou 409 `SLOT_UNAVAILABLE`.
- `GET /api/appointments/{id}`: status público do pedido (link enviado à cliente).

### Endpoints do painel (exigem sessão)

- `POST /api/admin/login`, `POST /api/admin/logout`
- `GET /api/admin/appointments?status=&date=&professionalId=` (inclui `conflict`)
- `GET /api/admin/appointments/pending-count`, `POST /api/admin/appointments/mark-seen`
- `POST /api/admin/appointments/{id}/confirm|reject|cancel` `{ reason? }`. Respostas de erro: 409 `SLOT_TAKEN` ou `INVALID_TRANSITION`.
- `GET|POST /api/admin/services`, `PATCH /api/admin/services/{id}`
- `GET|POST /api/admin/categories`, `PATCH /api/admin/categories/{id}`
- `GET|POST /api/admin/professionals`

Ciclo de status: `pending → confirmed | rejected`, `confirmed → cancelled`.

## Integração futura: mensageria e WhatsApp

A API emite eventos internos em `lib/server/events.ts`:

- `appointment.created`
- `appointment.confirmed`
- `appointment.rejected`
- `appointment.cancelled`

Cada evento leva o agendamento, o serviço e o telefone da cliente em E.164 (`+55...`). Hoje o único assinante registra o evento no log do servidor. O backend de mensageria e o agendador de lembretes por WhatsApp devem consumir esses mesmos eventos. Um assinante com erro não interrompe a operação.

## PWA

- Manifest em `app/manifest.ts`, com ícones gerados por `npm run logo` (192, 512 e maskable).
- Service worker em `public/sw.js`, registrado **só em produção**:
  - arquivos estáticos ficam em cache;
  - sem conexão, a navegação mostra `/offline`;
  - `/api/*` nunca vai para o cache.
- Para instalar, o site precisa estar em HTTPS. Push notifications ficam para o backend de mensageria.

## Acessibilidade

Público principal: clientes idosas. Verificado em 360 px e com zoom de 200% (180 px de largura útil):

- Fonte base de 18 px, alvos de toque de 48 px ou mais e foco visível de 3 px.
- Nenhuma rolagem horizontal, em todas as telas.
- Contraste medido (WCAG 2.1 AA exige 4,5:1):
  - texto café sobre creme: 11,90:1
  - texto secundário cacau sobre creme: 5,45:1
  - cacau sobre blush: 4,89:1
  - botão branco sobre cacau: 6,08:1
  - status aguardando: 6,39:1
  - status confirmado: 5,43:1
  - erro: 6,97:1
  - placeholder: 6,17:1
- O bronze rosé (3,72:1) é usado só em ornamentos.

## Estrutura

```
app/                 rotas (telas, API em app/api, manifest, offline)
components/          UI, telas públicas, assistente de agendamento, painel
lib/domain/          regras puras: horários, disponibilidade, status, validação, formatação
lib/server/          API em memória: store, seed, repositório, eventos, sessão
lib/api-client.ts    cliente HTTP tipado usado pelo front
public/brand/        logo e ícones gerados
public/images/       fotos usadas no site
docs/referencias/    flyer e tabelas de preços (referência)
scripts/             geração da logo (fontes OFL em scripts/fonts/)
openspec/            especificações e plano da mudança
```

## Problemas conhecidos em desenvolvimento

Se uma mudança de CSS não aparecer, ou a página recarregar sem parar depois de um `npm run build`, pare o servidor, apague a pasta `.next` e rode `npm run dev` de novo. Isso vem do cache do Turbopack com o loader do Tailwind.
