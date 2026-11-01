# Proposal

## Why

Hoje o painel `/admin` tem uma senha única. Quem entra vê os pedidos, a agenda e o catálogo de todas as profissionais e pode agir sobre tudo. As donas querem que cada profissional entre com o próprio login e veja só o próprio trabalho. Deve haver também um acesso master, com visão e gestão completas. O painel foi desenhado para celular (coluna de `max-w-3xl`) e aproveita mal a tela do computador, onde a agenda e o catálogo são mais usados. As profissionais pediram também um painel de ganhos individual.

## What Changes

- **BREAKING** Login por usuário e senha, em vez da senha única. Há dois perfis:
  - **master**: vê e gerencia tudo, como o painel atual;
  - **profissional**: vê e age apenas sobre os próprios pedidos, agenda, serviços e ganhos.
- Credenciais definidas em variáveis de ambiente. `ADMIN_PASSWORD` continua sendo a senha do master, com usuário definido em `ADMIN_USERNAME` (padrão `master`). A nova `ADMIN_USERS` traz usuário e senha de cada profissional. As credenciais sobrevivem ao reinício da API em memória.
- A sessão passa a carregar o usuário e o perfil. A API admin aplica o escopo no servidor e ignora filtros que tentem ver dados de outra profissional. Ação sobre recurso de outra profissional responde 404. Ação reservada ao master responde 403 `FORBIDDEN`.
- Novo endpoint `GET /api/admin/me`: quem está logado, com perfil e profissional.
- A contagem de pendentes, o aviso de "Novo" e a marcação de visto passam a ser por profissional. O master vê o total, mas a visita dele não marca pedidos como vistos.
- Serviços: a profissional edita preço, duração, nome, subcategoria e ativo dos próprios serviços. Também pode criar serviço para si mesma. Não pode trocar a profissional responsável nem editar categorias. Categorias e cadastro de profissionais ficam só com o master.
- **Painel de ganhos** (`/admin/ganhos`): total confirmado no período, separado em realizado (atendimento já terminou) e previsto (atendimento futuro). Mostra a quantidade de atendimentos, os atendimentos "Consultar valor" fora da soma, o detalhamento por serviço e um gráfico por dia. O master vê o total do salão e o detalhamento por profissional. Novo endpoint `GET /api/admin/earnings`.
- Versão desktop do painel (a partir de 1024 px):
  - cabeçalho fixo em toda a largura (navegação, contagem, data, atalhos, conta logada) e conteúdo em largura ampla;
  - pedidos pendentes em grade de 2 ou 3 colunas;
  - agenda com visão **Semana**: grade de segunda a sábado, das 09h às 20h, em blocos de 30 min, além da visão Dia;
  - serviços em tabela, com edição em painel lateral.
  O celular mantém o layout atual.

Fica fora desta change:
- Login permanente criado pela tela. O master pode criar ou trocar o login de uma profissional pelo painel, mas, com a API em memória, esse login some ao reiniciar. A persistência fica para o backend definitivo.
- Registro de pagamento real, adicionais (francesinha, encapsular) e descontos. Os ganhos usam o preço gravado no agendamento.
- Texto da seção "Quem somos" da tela inicial, tratado à parte.

## Capabilities

### New Capabilities
- `admin-access`: contas do painel, perfis master e profissional, login, sessão e escopo de dados por profissional aplicado pela API.
- `admin-earnings`: painel e endpoint de ganhos por período, por profissional e por serviço.

### Modified Capabilities
- `admin-appointments`: o acesso por senha única vira acesso por conta. Pedidos, agenda, contagem e "Novo" passam a ser por profissional. Entram a visão semanal e o layout desktop.
- `service-catalog`: a edição do catálogo passa a depender do perfil. A profissional mexe só nos próprios serviços. Categorias e profissionais ficam só com o master.
- `mock-api`: os endpoints admin passam a respeitar o perfil, com 403 `FORBIDDEN` e escopo por profissional. Entram `GET /api/admin/me` e `GET /api/admin/earnings`, e o login recebe `username`.

Essas três capacidades estão hoje só na change `add-salon-booking-frontend`, com todas as tarefas concluídas e ainda não arquivada. Essa change precisa ser arquivada antes desta, para os deltas MODIFIED terem base em `openspec/specs/`.

## Impact

- Autenticação: `lib/server/auth.ts`, `proxy.ts`, `app/api/admin/login`, `components/admin/LoginForm.tsx`, `.env.example` e README.
- Todas as rotas em `app/api/admin/**`, que passam a usar uma sessão com perfil no lugar de `requireAdmin`.
- `lib/server/repository.ts`: filtro por profissional em `pendingCount`, `markSeen` e na listagem, e a nova agregação de ganhos.
- `lib/domain/types.ts`: `AdminSession`, `EarningsResponse` e o código de erro `FORBIDDEN`.
- `lib/api-client.ts`: `login(username, password)`, `me()` e `earnings()`.
- UI: `AdminShell` (cabeçalho desktop e nome logado), `PendingList`, `AgendaView` (visão semana), `ServicesAdmin`/`ServiceForm` (tabela, painel lateral e campos por perfil) e a nova página `app/admin/(painel)/ganhos`.
- Ambiente: nova variável `ADMIN_USERS`. Sessões abertas hoje deixam de valer depois do deploy (o formato do token muda).
