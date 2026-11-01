# Design

## Context

- Hoje a autenticação é uma senha única (`ADMIN_PASSWORD`). O token de sessão é `exp.assinatura`, com HMAC-SHA256 derivado da senha (`lib/server/auth.ts`). Cada Route Handler admin chama `requireAdmin(request)`, que só responde se há sessão válida. O `proxy.ts` só verifica se o cookie `admin_session` existe.
- Os dados ficam em memória (`lib/server/store.ts`) e se perdem ao reiniciar. Por isso as credenciais não podem ficar no store.
- `Appointment.professionalId` e `Service.professionalId` já existem. O escopo por profissional não exige mudança no modelo de dados.
- `seenByAdminAt` é um campo único por agendamento. Como cada pedido pertence a uma profissional só, ele passa a ser o "visto pela dona".
- UI: `AdminShell` (cabeçalho e navegação no topo, `max-w-3xl`), `PendingList`, `AgendaView` (dia), `ServicesAdmin`/`ServiceForm` (cards por categoria). Tudo em Tailwind 4, sem biblioteca de componentes nem de gráficos.
- Next.js 16.4 com `proxy.ts` no lugar de middleware. Antes de mexer em cookies, proxy e Route Handlers, consultar `node_modules/next/dist/docs/`, como pede o `AGENTS.md`.

## Goals / Non-Goals

**Goals:**
- Garantir o escopo por profissional no servidor, num único ponto que todos os handlers usam.
- Manter o contrato HTTP substituível. O backend definitivo implementa as mesmas regras.
- Aproveitar o computador (≥ 1024 px) sem piorar o celular.

**Non-Goals:**
- Gestão de senhas pela tela, recuperação de senha e bloqueio por tentativas.
- Biblioteca de gráficos ou de calendário.
- Persistência das credenciais fora do ambiente.

## Decisions

### 1. Credenciais em variáveis de ambiente
- Master: usuário fixo `master`, senha em `ADMIN_PASSWORD`. Mantém compatibilidade com o `.env.local` atual.
- Profissionais: `ADMIN_USERS="stefani:senha1;lorrayne:senha2;michele:senha3"`. Cada entrada é separada por `;` e dividida no **primeiro** `:`. A senha pode conter `:`, mas não `;`.
- As credenciais são lidas uma vez por processo, em `lib/server/accounts.ts`. Id sem profissional no seed ou no store é ignorado, com aviso no log.
- Alternativas descartadas:
  - JSON numa variável: frágil de escapar no `.env`.
  - Senha cadastrada no store: some ao reiniciar.

### 2. Token de sessão com conta
- Formato `sub.exp.assinatura`, com `sub` = `master` ou o id da profissional.
- A chave HMAC deriva de `beauty-studio-session:${sub}:${senhaDaConta}`. Trocar a senha de uma conta invalida só as sessões dela, sem precisar de segredo extra.
- O perfil não vai no token: é calculado a partir de `sub` (`master` → master, demais → professional). Isso evita confiar em dado do cliente.
- A comparação da senha continua em tempo constante sobre os hashes. Usuário inexistente também calcula hash, para não dar pista pelo tempo de resposta.

### 3. Um guarda de sessão para todos os handlers
`requireAdmin` vira `getSession(request)`, que retorna `{ session } | { denied: Response }`. O `session` traz `{ role, professionalId, name }`. Funções auxiliares:
- `requireMaster(session)` → 403 `FORBIDDEN`;
- `scopeProfessional(session, requested)` → para a profissional devolve sempre o id dela; para o master devolve o filtro pedido.
- Agendamento ou serviço de outra profissional responde 404: o handler busca o recurso e compara `professionalId` antes de agir. Num processo único, entre a busca e a transição o `professionalId` não muda.

Alternativa descartada: aplicar o escopo dentro do `Repository`. Misturaria regra de acesso com acesso a dados e mudaria a interface que o backend definitivo substitui.

### 4. Contagem e "visto" por profissional
- `pendingCount(professionalId?)` e `markSeen(ids, professionalId)` recebem o escopo.
- Para o master, a rota `mark-seen` responde `{ marked: 0 }` sem alterar nada. A UI do master nem chama a rota. Assim a visita do master não apaga o "Novo" da profissional.

### 5. Ganhos como função pura de domínio
- `lib/domain/earnings.ts` exporta `computeEarnings(appointments, { from, to, now })`. A função soma só os `confirmed`, separa realizado (`endISO <= now`) e previsto, conta os sem preço, agrupa por serviço (pelo `serviceName` gravado), por dia e por profissional. Tudo em centavos inteiros.
- A rota `GET /api/admin/earnings` valida o período: máximo de 366 dias, `to >= from`. Ela aplica o escopo, lê `listAppointments({ from, to, professionalId })` e chama a função.
- Com isso o cálculo fica testável em Vitest, sem HTTP.
- Gráfico: barras em SVG inline (sem biblioteca), com uma barra empilhada por dia (realizado + previsto). A alternativa acessível é uma tabela `sr-only` com os mesmos números. Seguir a skill `dataviz` na implementação, com as cores do tema do salão.

### 6. Agenda semanal
- `listAppointments` ganha `from` e `to` (inclusivos). A semana vai de segunda a sábado, a partir de `weekStart(date)` em `lib/domain/schedule.ts`.
- Layout em `lib/domain/agenda-layout.ts` (puro e testado):
  - posição vertical = (início − 09:00) / 30 min;
  - altura = duração / 30 min;
  - agendamentos que se sobrepõem no mesmo dia recebem faixas lado a lado.
  Isso cobre o master com "Todas" e o conflito de pendentes da mesma profissional.
- Grade em CSS Grid: 6 colunas e 22 linhas de 30 min. Cada bloco é um `<button>` com `aria-label` completo. Ao selecionar, abre o `AppointmentCard` existente num painel lateral (≥ 1024 px) ou num diálogo, reaproveitando `useAppointmentAction`.
- Estado no endereço: `?visao=semana&dia=AAAA-MM-DD`, seguindo o padrão `dia`/`profissional` já usado.
- Abaixo de 1024 px, a visão Semana mostra uma lista agrupada por dia, sem grade.

### 7. Layout desktop
- Breakpoint `lg` do Tailwind (1024 px).
- No `AdminShell`:
  - em `lg`, cabeçalho fixo em toda a largura, em duas faixas, e conteúdo em `max-w-[90rem]`:
    - faixa 1: logo, navegação com a contagem de pendentes, nome e perfil da conta e "Sair";
    - faixa 2: data de hoje, resumo de pendentes e novos, atalhos (Agenda de hoje, Esta semana, Ganhos do mês), link para a página de agendamento e o aviso de modo de teste;
    - a altura do cabeçalho fica na variável CSS `--admin-top`, usada pelos elementos `sticky` da grade semanal;
    - substitui o menu lateral fixo da primeira versão, a pedido das donas (aproveitar a largura da tela);
  - abaixo de `lg`, o cabeçalho atual fica como está.
- O `AdminShell` passa a buscar `GET /api/admin/me` e a expor `session` no contexto. Menus e filtros dependem desse valor.
- Pedidos: `grid lg:grid-cols-2 min-[1440px]:grid-cols-3`.
- Serviços: em `lg`, tabela com painel lateral de edição usando o `ServiceForm` existente. No celular continuam os cards atuais. Para a profissional:
  - o campo profissional some e o servidor força o `professionalId`;
  - os controles de categoria e a seção de profissionais somem.

### 8. Login
- O `LoginForm` ganha o campo usuário (`autoComplete="username"`).
- `api.admin.login(username, password)`.
- Mensagem única para usuário inexistente e senha errada: "Usuário ou senha incorretos".

## Risks / Trade-offs

- [Senha em texto puro no ambiente] → É aceitável para a fase de teste, e o arquivo `.env*` já está no `.gitignore`. O backend definitivo deve guardar hash (registrar no README).
- [Nova profissional cadastrada no painel não consegue entrar até alguém editar o ambiente e reiniciar] → Avisar no próprio formulário de cadastro do master e documentar no README.
- [Sessões atuais caem no deploy] → Impacto baixo (só teste). Registrar na nota da mudança.
- [Escopo esquecido em alguma rota] → Testes de API por perfil cobrindo todas as rotas `app/api/admin/**`, com uma lista fixa de rotas no teste para detectar rota nova sem cobertura.
- [Ganhos confundidos com faturamento real] → Rótulo e nota fixa na tela explicando a base de cálculo. Não usar "faturamento".
- [Grade semanal com serviços longos (Goddess braids, 7 h) ocupa quase o dia] → É o comportamento correto. O bloco mostra o texto no topo e fica rolável.

## Migration Plan

1. Arquivar `add-salon-booking-frontend`, para criar `openspec/specs/` como base dos deltas.
2. Implementar e incluir `ADMIN_USERS` em `.env.example` e no README.
3. No ambiente: definir `ADMIN_USERS` com as três profissionais. `ADMIN_PASSWORD` continua sendo o master.
4. Rollback: reverter o deploy. A variável `ADMIN_USERS` sobrando no ambiente não afeta a versão anterior.
