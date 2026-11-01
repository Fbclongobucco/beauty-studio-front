# mock-api Specification

## Purpose

Fornece uma API HTTP de teste, com dados em memória, que o front-end usa enquanto o backend definitivo não existe, com contratos estáveis e pontos de extensão para mensageria e lembretes por WhatsApp.

## Requirements

### Requirement: Armazenamento em memória
A API SHALL manter profissionais, serviços e agendamentos em memória do processo do servidor, carregando o catálogo inicial ao iniciar. Os dados MUST se perder quando o servidor reinicia. A documentação do projeto MUST informar essa limitação.

#### Scenario: Reinício do servidor
- **WHEN** o servidor de desenvolvimento é reiniciado
- **THEN** os agendamentos somem e o catálogo volta ao estado inicial

### Requirement: Endpoints públicos
A API SHALL expor, em JSON:
- `GET /api/services`: categorias com observação e serviços ativos com subcategoria, duração em minutos, preço em centavos (ou nulo) e profissional. Não expõe a marcação de duração estimada.
- `GET /api/availability?serviceId=&date=YYYY-MM-DD`: horários de início disponíveis (HH:mm) para o serviço na data.
- `GET /api/availability/days?serviceId=&from=YYYY-MM-DD&days=N`: para cada dia, se há algum horário livre.
- `POST /api/appointments`: cria pedido com `serviceId`, `date`, `time`, `customerName`, `customerPhone`, `notes` opcional. Responde 201 com o agendamento.
- `GET /api/appointments/{id}`: status público do agendamento, sem expor dados de outras clientes.

#### Scenario: Criação válida
- **WHEN** o cliente HTTP envia `POST /api/appointments` com dados válidos para um horário livre
- **THEN** a resposta é 201 com `id`, `status: "pending"`, início e fim em ISO 8601 com fuso -03:00 e o preço e a duração vigentes no momento do pedido

#### Scenario: Horário indisponível
- **WHEN** o `POST /api/appointments` pede um horário fora do expediente ou ocupado por confirmado
- **THEN** a resposta é 409 com código `SLOT_UNAVAILABLE` e mensagem em pt-BR

#### Scenario: Dados inválidos
- **WHEN** o corpo do pedido falta `customerPhone` ou traz data em formato errado
- **THEN** a resposta é 400 com código `VALIDATION_ERROR` e a lista de campos inválidos

### Requirement: Endpoints administrativos
A API SHALL expor, só com sessão admin e respeitando o perfil (capacidade `admin-access`):
- `GET /api/admin/appointments?status=&date=&from=&to=&professionalId=`: lista filtrada, com indicação de conflito. `from` e `to` (YYYY-MM-DD, inclusivos) servem à visão semanal. Para a profissional, `professionalId` é ignorado e a lista vem só com os dela.
- `GET /api/admin/appointments/pending-count`: contagem de pendentes e não vistos, da profissional ou do salão (master).
- `POST /api/admin/appointments/mark-seen`: marca como vistos só pedidos da profissional logada; para o master não marca nada.
- `POST /api/admin/appointments/{id}/confirm`, `/reject`, `/cancel`: transições de status, com `reason` opcional. Agendamento de outra profissional: 404.
- `GET/POST /api/admin/services`, `PATCH /api/admin/services/{id}`: manutenção do catálogo (preço, duração, nome, categoria, subcategoria, profissional, ativo). Inclui a marcação de duração estimada. Para a profissional: só os próprios serviços; criação sempre em nome dela; troca de profissional responde 403 `FORBIDDEN`.
- `GET /api/admin/categories`: leitura para todos. `POST /api/admin/categories` e `PATCH /api/admin/categories/{id}`: só master.
- `GET /api/admin/professionals`: master recebe todas; profissional recebe só a própria. `POST`: só master.
- `GET /api/admin/me`: `{ role: "master" | "professional", professionalId, name }`.
- `GET /api/admin/accounts` e `POST /api/admin/accounts` `{ professionalId, password }`: só master; logins das profissionais, sem senhas na resposta; login criado fica em memória.
- `GET /api/admin/earnings?from=&to=&professionalId=`: ganhos do período (capacidade `admin-earnings`); `professionalId` só vale para o master.
- `POST /api/admin/login` com `{ username, password }` e `POST /api/admin/logout`.

#### Scenario: Transição inválida
- **WHEN** o admin tenta confirmar um agendamento já cancelado
- **THEN** a resposta é 409 com código `INVALID_TRANSITION`

#### Scenario: Sem sessão
- **WHEN** um cliente HTTP chama qualquer `/api/admin/*` (exceto login) sem sessão
- **THEN** a resposta é 401

#### Scenario: Operação exclusiva do master
- **WHEN** uma sessão de profissional chama `POST /api/admin/professionals`
- **THEN** a resposta é 403 com código `FORBIDDEN`

#### Scenario: Resposta de ganhos
- **WHEN** o master chama `GET /api/admin/earnings?from=2026-11-01&to=2026-11-30`
- **THEN** a resposta traz, em centavos, o total, o realizado e o previsto com as quantidades, a quantidade sem preço, a lista por serviço, a série por dia e a lista por profissional

#### Scenario: Período de ganhos inválido
- **WHEN** a chamada de ganhos tem `to` antes de `from` ou mais de 366 dias
- **THEN** a resposta é 400 `VALIDATION_ERROR` com o campo indicado

### Requirement: Transições de status
O ciclo de vida do agendamento SHALL seguir: `pending` → `confirmed` | `rejected`; `confirmed` → `cancelled`. Qualquer outra transição MUST ser recusada. Cada transição SHALL registrar data e hora.

#### Scenario: Recusa de pendente
- **WHEN** o admin recusa um agendamento `pending`
- **THEN** o status vira `rejected` e o horário segue livre

### Requirement: Eventos de domínio para integrações futuras
A API SHALL emitir eventos internos `appointment.created`, `appointment.confirmed`, `appointment.rejected` e `appointment.cancelled`, com os dados do agendamento, do serviço e o telefone da cliente. Nesta fase os assinantes SHALL apenas registrar o evento no log do servidor. Falha de um assinante MUST NOT impedir a operação.

#### Scenario: Evento ao confirmar
- **WHEN** o admin confirma um agendamento
- **THEN** o log do servidor registra `appointment.confirmed` com id, data, horário e telefone em formato +55

### Requirement: Contrato substituível
O front-end MUST acessar dados só pelos endpoints HTTP acima, sem ler o armazenamento em memória direto, para que o backend definitivo possa substituir a API mantendo os mesmos contratos.

#### Scenario: Troca de backend
- **WHEN** a URL base da API é apontada para outro servidor que implementa os mesmos contratos
- **THEN** o front-end funciona sem mudança de código
