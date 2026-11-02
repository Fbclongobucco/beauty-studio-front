# beauty-studio-front

Front-end do **Longo Bucco Beauty Studio**: agendamento de serviços (unhas, tranças e depilação) por disponibilidade, com painel para as profissionais confirmarem os pedidos. Mobile first, pensado para clientes idosas, e instalável como PWA.

Stack: Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, TypeScript. Testes de domínio com Vitest.

## Como rodar

```bash
npm install
cp .env.example .env.local   # defina ADMIN_PASSWORD e ADMIN_USERS
npm run dev                  # http://localhost:3000
```

- Site das clientes: `/`
- Agendamento: `/agendar`
- Painel das profissionais: `/admin` (usuário e senha, veja "Contas do painel")

Outros comandos:

```bash
npm test         # testes de domínio e da API em memória
npm run lint
npm run build && npm start
npm run logo     # regenera logo e ícones em public/brand/
```

## Produção (Vercel)

O front sobe na Vercel e a API numa VPS, no mesmo domínio (ex.: `salao.com.br` e `api.salao.com.br`). Passo a passo no `DEPLOY.md` do repositório `beauty-studio-backend`.
- Variável na Vercel: `NEXT_PUBLIC_API_BASE_URL=https://api.salao.com.br` (fixada no build: faça novo deploy depois de mudar).
- Use domínio próprio: com `*.vercel.app`, o painel não enxerga a sessão.
- Com `NEXT_PUBLIC_API_BASE_URL` definido, a API de teste em memória (`/api/*`) responde 404.

## Variáveis de ambiente

- `ADMIN_USERNAME`: usuário da conta master (opcional, padrão `master`). Com outro nome, `master` deixa de entrar.
- `ADMIN_PASSWORD`: senha da conta master. Sem ela, o master fica desabilitado.
- `ADMIN_USERS`: contas das profissionais, no formato `stefani:senha1;lorrayne:senha2;michele:senha3`.
  - O usuário é o id da profissional.
  - Cada entrada é dividida no primeiro `:`. A senha pode conter `:`, mas não `;`.
  - Id sem profissional cadastrada é ignorado, com aviso no log.
  - Sem nenhuma conta válida, o login fica desabilitado.
- `NEXT_PUBLIC_API_BASE_URL`: URL base da API, fixada no build. Vazio = mesma origem (API de teste em `app/api`). Para o backend definitivo local: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 npm run dev` (gateway do `beauty-studio-backend`, `./stack.sh local up -d`). Em produção, front e API precisam estar no mesmo site para os cookies de sessão e de acompanhamento chegarem à API.

## Contas do painel

Há dois perfis:

- **master**: vê e gerencia tudo. Pedidos e agenda de todas, catálogo completo, categorias, cadastro de profissionais e ganhos do salão.
- **profissional**: vê e age só sobre o próprio trabalho. Pedidos, agenda, os próprios serviços (preço, duração, nome, subcategoria, ativo e criação em nome dela) e os próprios ganhos. Não troca a profissional de um serviço, não edita categorias e não cadastra profissionais.

O escopo é aplicado pela API, não só pela tela. Filtro de outra profissional é ignorado. Agendamento ou serviço alheio responde 404. Ação exclusiva do master responde 403 `FORBIDDEN`.

Detalhes:

- O usuário não diferencia maiúsculas.
- A sessão dura 12 h, em cookie `httpOnly` assinado com HMAC por conta. Trocar a senha de uma conta encerra só as sessões dela.
- Pedido marcado como visto vale só para a profissional dona. A visita do master não apaga o "Novo".
- Logins das profissionais:
  - definidos em `ADMIN_USERS`: permanentes e não editáveis pelo painel;
  - criados pelo master em **Serviços → Profissionais e logins**: na API de teste ficam só em memória e **somem ao reiniciar o servidor** (`login: "memory"`); no backend definitivo ficam no banco (`login: "db"`). Senha com no mínimo 6 caracteres;
  - na API de teste, para um login permanente, inclua a profissional em `ADMIN_USERS` e reinicie o servidor.
- **Meu WhatsApp:** a profissional informa o próprio número no topo de **Serviços**. É ele que recebe o aviso de cada pedido novo dela (envio feito pelo backend definitivo; a API de teste não envia mensagens). Enquanto o número estiver vazio, o painel dela mostra "Cadastre seu WhatsApp para receber os pedidos novos". O master vê os números só para leitura, em **Profissionais e logins**.
- As senhas ficam em texto puro no ambiente, o que só é aceitável na fase de teste. O backend definitivo deve guardar hash.

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
- Cada serviço pode ter **uma foto**, opcional, cadastrada em **Painel → Serviços** (formulário "Editar tudo" no celular, ou painel lateral da tabela no computador). A foto só é gravada no "Salvar". O navegador reduz a imagem para no máximo 1600 px, em JPEG, antes de enviar. A cliente vê a miniatura na lista de serviços (toque para ampliar) e na escolha do serviço no agendamento.

## Ganhos

Em `/admin/ganhos`, cada profissional vê os próprios ganhos. O master vê o total do salão, a divisão por profissional e um filtro por profissional.

- Base de cálculo: soma do preço gravado em cada agendamento **confirmado** com data no período.
  - Pendentes, recusados e cancelados ficam fora.
  - Não inclui adicionais nem descontos. Não é registro de pagamento.
- **Realizado**: atendimentos já terminados (horário de término no fuso America/Sao_Paulo). **Previsto**: os que ainda não terminaram.
- Serviço sem preço ("Consultar valor") fica fora da soma e aparece contado à parte.
- Períodos:
  - Esta semana (segunda a sábado);
  - Este mês (padrão);
  - Mês passado;
  - Período livre, de até 366 dias.
- Detalhamento por serviço, do maior para o menor valor, e gráfico de barras por dia (realizado + previsto), com tabela "Ver valores por dia".
- Endpoint `GET /api/admin/earnings?from=AAAA-MM-DD&to=AAAA-MM-DD&professionalId=`.
  - Valores em centavos.
  - Retorna `total`, `realized`, `expected`, `unpriced`, `byService`, `byDay` e `byProfessional`.
  - Período inválido: 400 `VALIDATION_ERROR`.

## API de teste (dados em memória)

Os dados ficam na memória do processo do servidor. **Tudo se perde ao reiniciar** (agendamentos, edições do painel e fotos dos serviços), e não funciona com várias instâncias (serverless). Serve apenas para testes, até a chegada do backend definitivo.

O front-end acessa os dados **somente por HTTP** (`lib/api-client.ts`). Para trocar pelo backend definitivo, basta implementar os mesmos contratos e apontar `NEXT_PUBLIC_API_BASE_URL`.

### Endpoints públicos

- `GET /api/services`: categorias (com aviso) e serviços ativos, cada um com `photoUrl` (ou `null`).
- `GET /api/service-photos/{photoId}`: imagem guardada pela API de teste. O backend definitivo pode servir as fotos de outro endereço (storage/CDN); o front usa a `photoUrl` como vier.
- `GET /api/availability?serviceId=&date=AAAA-MM-DD`: `slots` (horários de início livres) e `taken` (horários da grade ocupados por confirmado, mostrados em cinza e desabilitados).
- `GET /api/availability/days?serviceId=&from=AAAA-MM-DD&days=N`: dias abertos e se têm horário livre.
- `POST /api/appointments`: cria o pedido `{ serviceId, date, time, customerName, customerPhone, notes? }`. Respostas: 201, 400 `VALIDATION_ERROR` ou 409 `SLOT_UNAVAILABLE`.
- `GET /api/appointments/{id}`: status público do pedido (link enviado à cliente).
- `GET /api/appointments/mine`: pedidos em andamento deste aparelho (pendentes, confirmados que não terminaram, recusados ou cancelados ainda no futuro), do início mais próximo para o mais distante.
  - Vêm do cookie `my_requests`, gravado pela API (`HttpOnly`, caminho `/api/appointments`, 60 dias, até 10 ids assinados) ao criar ou abrir um pedido.
  - Ao abrir a página inicial numa visita nova, a cliente com pedido em andamento é levada à tela dele. "Voltar para o início" (`/?inicio=1`) abre a página inicial com o cartão "Seu pedido", sem redirecionar.

### Endpoints do painel (exigem sessão)

Sem sessão: 401. Operação exclusiva do master com sessão de profissional: 403 `FORBIDDEN`. Para a profissional, toda lista vem filtrada para ela.

- `POST /api/admin/login` `{ username, password }`.
  - Erros: 401 "Usuário ou senha incorretos"; 503 `LOGIN_DISABLED` sem contas.
- `POST /api/admin/logout`.
- `GET /api/admin/me`: `{ role: "master" | "professional", professionalId, name, whatsappPhone }`.
- `PATCH /api/admin/me` `{ whatsappPhone }`: só a profissional, para o próprio número. Aceita número com DDD, com ou sem máscara, e guarda em E.164; `null` ou vazio remove. Responde a sessão atualizada. Erros: 400 `VALIDATION_ERROR` em `fields.whatsappPhone`; master: 403 `FORBIDDEN`.
- `GET /api/admin/appointments?status=&date=&from=&to=&professionalId=`.
  - Inclui `conflict`.
  - `from`/`to` são inclusivos.
  - `professionalId` só vale para o master.
- `GET /api/admin/appointments/pending-count`: da profissional, ou do salão para o master.
- `POST /api/admin/appointments/mark-seen` `{ ids? }`: marca só pedidos da profissional logada. Para o master não marca nada.
- `POST /api/admin/appointments/{id}/confirm|reject|cancel` `{ reason? }`.
  - Pedido alheio: 404.
  - Erros: 409 `SLOT_TAKEN` ou `INVALID_TRANSITION`.
- `GET|POST /api/admin/services`.
  - A profissional recebe só os dela.
  - Na criação, o serviço fica sempre em nome dela.
- `PATCH /api/admin/services/{id}`.
  - Serviço alheio: 404.
  - Troca de profissional por quem não é master: 403.
  - `photoUrl` no corpo é ignorado; a foto só muda pelos endpoints abaixo.
- `PUT /api/admin/services/{id}/photo`: `multipart/form-data` com o arquivo no campo `photo`. Substitui a foto anterior e responde 200 com o serviço.
  - Aceita JPEG, PNG e WebP, conferidos pelo conteúdo do arquivo (não pelo nome), até 5 MB.
  - Erros: 400 `VALIDATION_ERROR` com `fields.photo` ("Envie uma foto em JPEG, PNG ou WebP.", "A foto deve ter no máximo 5 MB." ou "Escolha uma foto."); serviço alheio: 404.
  - Cada envio gera uma `photoUrl` nova, para o cache não mostrar a foto antiga.
- `DELETE /api/admin/services/{id}/photo`: remove a foto e responde 200 com `photoUrl: null` (também sem foto). Serviço alheio: 404.
- `GET /api/admin/categories`: todos. `POST /api/admin/categories` e `PATCH /api/admin/categories/{id}`: só master.
- `GET /api/admin/professionals`: master recebe todas; profissional recebe só a própria; cada uma com `whatsappPhone` (fora dos endpoints públicos). `POST`: só master.
- `GET /api/admin/accounts`: só master. `{ masterUsername, accounts: [{ professionalId, name, login: "env" | "memory" | null }] }`, sem senhas. O backend definitivo usa `"db"` no lugar de `"memory"`.
- `POST /api/admin/accounts` `{ professionalId, password }`: só master. Cria ou troca o login da profissional, em memória.
  - Profissional inexistente, conta definida em `ADMIN_USERS` ou senha com menos de 6 caracteres: 400 `VALIDATION_ERROR`.
- `GET /api/admin/earnings?from=&to=&professionalId=`: ganhos do período (veja "Ganhos").

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
