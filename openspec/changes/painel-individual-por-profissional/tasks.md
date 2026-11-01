# Tasks

## 1. Contas e sessão

- [x] 1.1 Ler os guias de Route Handlers, cookies e `proxy` em `node_modules/next/dist/docs/` e anotar qualquer diferença de API relevante. Verificação: nota curta no PR, ou nada a anotar.
- [x] 1.2 Criar `lib/server/accounts.ts`:
  - lê `ADMIN_PASSWORD` (conta `master`) e `ADMIN_USERS` (`id:senha;...`, dividindo no primeiro `:`);
  - normaliza o usuário (trim, minúsculas);
  - ignora id inexistente, com aviso no log.
  
  Verificação: testes Vitest cobrem senha com `:`, entrada malformada, id inexistente e variáveis vazias.
- [x] 1.3 Reescrever `lib/server/auth.ts`:
  - token `sub.exp.assinatura`, com chave HMAC derivada da conta;
  - `authenticate(username, password)` em tempo constante, com hash também para usuário inexistente;
  - `getSession(request)`, `requireMaster` e `scopeProfessional`.
  
  Verificação: `lib/server/auth.test.ts` atualizado cobre login válido, usuário inexistente, senha errada, expiração, troca de senha invalidando o token e token de uma conta adulterado para outra.
- [x] 1.4 Adicionar o código `FORBIDDEN` e o tipo `AdminSession` em `lib/domain/types.ts`, e o helper `forbidden()` em `lib/server/http.ts`. Verificação: `npx tsc --noEmit` sem erros.
- [x] 1.5 Atualizar `POST /api/admin/login` para `{ username, password }`, com mensagem "Usuário ou senha incorretos" e 503 `LOGIN_DISABLED` sem nenhuma conta. Criar `GET /api/admin/me`. Verificação: teste de rota cobre 200 com cookie, 401 com mensagem única e 503.
- [x] 1.6 Atualizar `.env.example` e README com `ADMIN_USERS`, formato, usuários, limitação do `;` e aviso de que nova profissional precisa entrar no ambiente. Atualizar o `.env.local` de desenvolvimento com as três profissionais. Verificação: o login `stefani` funciona no `next dev`.

## 2. Escopo na API admin

- [x] 2.1 Repositório:
  - `listAppointments` aceita `from`/`to`;
  - `pendingCount(professionalId?)`;
  - `markSeen(ids, professionalId)`.
  
  Verificação: `lib/server/repository.test.ts` cobre intervalo de datas, contagem por profissional e `markSeen` sem efeito sobre pedidos de outra profissional.
- [x] 2.2 Rotas de agendamentos (`appointments`, `pending-count`, `mark-seen`, `[id]/[action]`) com `getSession` e escopo:
  - profissional ignora `professionalId`;
  - 404 para pedido alheio;
  - master não marca visto.
  
  Verificação: testes de rota por perfil.
- [x] 2.3 Rotas de catálogo:
  - `services` GET filtra para a profissional, POST força o `professionalId` dela;
  - `services/[id]` PATCH com 404 para serviço alheio e 403 ao trocar a profissional;
  - `categories` POST/PATCH e `professionals` POST só para o master; `professionals` GET da profissional devolve só ela.
  
  Verificação: testes de rota por perfil.
- [x] 2.4 Teste de cobertura de escopo: lista fixa de todas as rotas em `app/api/admin/**`. O teste falha se existir rota fora da lista e confere 401 sem sessão em cada uma. Verificação: `npm test` passa, e criar uma rota fictícia faz o teste falhar.
- [x] 2.5 `lib/api-client.ts`: `login(username, password)`, `me()`, `appointments({ from, to })`, tratamento de `FORBIDDEN` em `FRIENDLY`. Verificação: `npx tsc --noEmit` e `npm run lint` sem erros.
- [x] 2.6 Atualizar a seção de endpoints do README (perfis, 403, `me`, `from`/`to`). Verificação: endpoints do README conferem com `app/api/admin/**`.

## 3. Painel: sessão, login e menu

- [ ] 3.1 `LoginForm` com os campos usuário e senha (`autoComplete` corretos) e a mensagem única de erro. Verificação: login e erro testados manualmente em 360 px.
- [ ] 3.2 `AdminShell`:
  - busca `me()` e expõe `session` no contexto, redirecionando em 401;
  - mostra o nome logado;
  - em `lg` vira cabeçalho fixo em toda a largura (Pedidos, Agenda, Serviços, Ganhos, contagem, data, atalhos, conta, Sair) com conteúdo até 1440 px;
  - abaixo de `lg` mantém o cabeçalho atual.
  
  Verificação: em 1280 px o cabeçalho fica fixo ao rolar e não cobre os dias da grade semanal; em 360 px não há rolagem horizontal.
- [ ] 3.3 `PendingList`:
  - grade `lg:grid-cols-2` e 3 colunas a partir de 1440 px;
  - não chama `markSeen` quando a sessão é master.
  
  Verificação: em 1440 px, 6 pedidos aparecem em 3 colunas; após o master abrir a lista, a profissional ainda vê "Novo".

## 4. Agenda semanal

- [x] 4.1 `weekStart(date)` em `lib/domain/schedule.ts` e `lib/domain/agenda-layout.ts`, com posição, altura e faixas para sobreposições. Verificação: testes Vitest cobrem bloco de 6 h, dois simultâneos de profissionais diferentes, três sobrepostos e domingo → segunda anterior.
- [ ] 4.2 `AgendaView`:
  - alternância Dia/Semana com `?visao=semana&dia=` no endereço;
  - navegação entre semanas;
  - filtro de profissional só para o master.
  
  Verificação: recarregar a página mantém visão e semana; a profissional não vê o filtro.
- [ ] 4.3 Grade semanal em `lg`:
  - 6 colunas × 22 linhas;
  - blocos como `<button>` com `aria-label`;
  - cor por status e nome da profissional no master.
  
  Ao selecionar um bloco, abre o `AppointmentCard` em painel lateral, com ações por `useAppointmentAction`. Verificação: Box braids 09:00–15:00 ocupa a altura certa; confirmar pela grade atualiza o bloco sem recarregar.
- [ ] 4.4 Visão Semana abaixo de `lg`: lista agrupada por dia. Verificação: em 360 px não há rolagem horizontal, e os blocos aparecem como cards por dia.

## 5. Serviços por perfil e tabela desktop

- [ ] 5.1 `ServicesAdmin`/`ServiceForm` por perfil. Para a profissional:
  - sem campo de profissional;
  - sem controles de categoria (criar/editar observação);
  - sem seção de profissionais;
  - lista só com os próprios serviços.
  
  Para o master, o cadastro de profissional avisa que o login exige configurar `ADMIN_USERS`. Verificação: a Michele vê só "Depilação"; o master vê tudo.
- [ ] 5.2 Tabela em `lg`:
  - colunas serviço, categoria/subcategoria, duração (com "duração estimada"), preço, profissional (só master) e status;
  - edição e criação em painel lateral com o `ServiceForm`.
  
  Verificação: editar "Box braids" em 1280 px atualiza a linha sem recarregar; em 360 px seguem os cards atuais.

## 6. Ganhos

- [x] 6.1 `lib/domain/earnings.ts` com `computeEarnings` (total, realizado/previsto com quantidades, sem preço, por serviço ordenado por valor, por dia, por profissional) e `EarningsResponse` em `types.ts`. Verificação: testes Vitest cobrem os cenários da spec `admin-earnings` (cancelado fora, sem preço, preço alterado, divisão realizado/previsto, ordenação).
- [x] 6.2 `GET /api/admin/earnings`:
  - validação do período (`to >= from`, até 366 dias);
  - escopo por perfil, com `professionalId` válido só para o master.
  
  Adicionar `api.admin.earnings()`. Verificação: testes de rota cobrem 400, escopo da profissional e master por profissional.
- [ ] 6.3 Página `app/admin/(painel)/ganhos`:
  - períodos Esta semana / Este mês (padrão) / Mês passado / Período;
  - cartões Total, Realizado e Previsto;
  - aviso dos sem preço e nota fixa da base de cálculo;
  - lista por serviço;
  - lista por profissional e filtro (só master).
  
  Verificação: os cenários da spec conferem no `next dev` com agendamentos de teste; em 360 px não há rolagem horizontal.
- [ ] 6.4 Gráfico de barras por dia em SVG inline, empilhando realizado e previsto, com tabela `sr-only` equivalente. Carregar a skill `dataviz` antes de escrever o gráfico. Verificação: os valores do gráfico conferem com a tabela; contraste das barras ≥ 3:1 sobre o fundo.
- [x] 6.5 README: seção "Ganhos" com a base de cálculo e o endpoint. Verificação: texto confere com a spec `admin-earnings`.

## 7. Verificação integrada

- [ ] 7.1 Fluxo completo no `next dev`:
  - cliente agenda Manicure, Box braids e Depilação;
  - cada profissional entra e vê só o próprio pedido e confirma;
  - o master vê os três na agenda semanal e nos ganhos.
  
  Verificação: roteiro executado sem divergência da spec.
- [x] 7.2 `npm test`, `npm run lint` e `npm run build` sem erros. Verificação: saída dos três comandos.

## 8. Logins pelo painel

- [x] 8.1 `ADMIN_USERNAME` (padrão `master`) para o login do master; `sub` interno continua `master`. Verificação: teste de rota com `admin` entrando e `master` recusado.
- [x] 8.2 Logins em memória em `lib/server/accounts.ts` e `GET/POST /api/admin/accounts` (só master, senha ≥ 6, conta de `ADMIN_USERS` protegida, sem senha na resposta). Verificação: testes de rota e rota incluída na lista de cobertura.
- [ ] 8.3 Seção "Profissionais e logins" em Serviços (master): situação do login de cada profissional, criar ou trocar senha, aviso de que some ao reiniciar. Verificação: no `next dev`, criar profissional e login e entrar com ele.
- [x] 8.4 `.env.example`, README e `.env.local` (`admin` / `admin123`). Verificação: login `admin` no `next dev`.

## Workflow follow-up

- Pré-requisito: arquivar `add-salon-booking-frontend` antes de arquivar esta change, para os deltas MODIFIED terem base em `openspec/specs/`.
- Arquivar esta change depois da revisão.
