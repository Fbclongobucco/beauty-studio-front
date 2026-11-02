## MODIFIED Requirements

### Requirement: Armazenamento em memória
A API SHALL manter profissionais, serviços e agendamentos em memória do processo do servidor, carregando o catálogo inicial ao iniciar. Os dados MUST se perder quando o servidor reinicia. A documentação do projeto MUST informar essa limitação.

O painel MUST NOT mostrar faixa ou selo de "Modo de teste", com esta API ou com o backend definitivo. A limitação fica registrada só na documentação.

#### Scenario: Reinício do servidor
- **WHEN** o servidor de desenvolvimento é reiniciado
- **THEN** os agendamentos somem e o catálogo volta ao estado inicial

#### Scenario: Painel sem faixa de teste
- **WHEN** o painel abre, com a API de teste ou com o backend definitivo
- **THEN** não aparece faixa nem selo de "Modo de teste"

### Requirement: Endpoints administrativos
A API SHALL expor os endpoints abaixo, só com sessão admin e respeitando o perfil (capacidade `admin-access`).

Agendamentos:
- `GET /api/admin/appointments?status=&date=&from=&to=&professionalId=`: lista filtrada, com indicação de conflito.
  - `from` e `to` (YYYY-MM-DD, inclusivos) servem à visão semanal.
  - Para a profissional, `professionalId` é ignorado e a lista vem só com os dela.
- `GET /api/admin/appointments/pending-count`: contagem de pendentes e não vistos, da profissional ou do salão (master).
- `POST /api/admin/appointments/mark-seen`: marca como vistos só pedidos da profissional logada; para o master não marca nada.
- `POST /api/admin/appointments/{id}/confirm`, `/reject` e `/cancel`: transições de status, com `reason` opcional. Agendamento de outra profissional: 404.

Catálogo:
- `GET` e `POST /api/admin/services`, e `PATCH /api/admin/services/{id}`: manutenção do catálogo (preço, duração, nome, categoria, subcategoria, profissional, ativo), incluindo a marcação de duração estimada. Para a profissional:
  - só os próprios serviços;
  - criação sempre em nome dela;
  - troca de profissional responde 403 `FORBIDDEN`.
- `GET /api/admin/categories`: leitura para todos. `POST /api/admin/categories` e `PATCH /api/admin/categories/{id}`: só master.
- `GET /api/admin/professionals`: master recebe todas, profissional recebe só a própria, cada uma com `whatsappPhone` (E.164 ou `null`). `POST`: só master.

Sessão e contas:
- `GET /api/admin/me`: `{ role: "master" | "professional", professionalId, name, whatsappPhone }`.
- `PATCH /api/admin/me` com `{ whatsappPhone }`: só a profissional altera o próprio número.
  - Aceita número brasileiro com DDD, com ou sem máscara, e guarda em E.164.
  - `null` ou texto vazio remove o número.
  - Responde com a sessão atualizada.
  - Número inválido: 400 `VALIDATION_ERROR` em `fields.whatsappPhone`.
  - Sessão master: 403 `FORBIDDEN`.
- `GET /api/admin/accounts` e `POST /api/admin/accounts` `{ professionalId, password }`: só master. Logins das profissionais, sem senhas na resposta; login criado fica em memória.
- `POST /api/admin/login` com `{ username, password }` e `POST /api/admin/logout`.

Ganhos:
- `GET /api/admin/earnings?from=&to=&professionalId=`: ganhos do período (capacidade `admin-earnings`); `professionalId` só vale para o master.

O `whatsappPhone` MUST NOT aparecer nos endpoints públicos. Esta API MUST NOT enviar mensagens.

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

#### Scenario: Profissional salva o próprio WhatsApp
- **WHEN** a Stéfani envia `PATCH /api/admin/me` com `{ "whatsappPhone": "(21) 99999-0000" }`
- **THEN** a resposta é 200 com `whatsappPhone: "+5521999990000"`, e `GET /api/admin/professionals` do master mostra esse número para a Stéfani

#### Scenario: Master não altera o próprio WhatsApp
- **WHEN** o master envia `PATCH /api/admin/me`
- **THEN** a resposta é 403 `FORBIDDEN`

#### Scenario: Número fora do catálogo público
- **WHEN** a cliente chama `GET /api/services`
- **THEN** a resposta não contém o WhatsApp de nenhuma profissional

### Requirement: Contrato substituível
O front-end MUST acessar dados só pelos endpoints HTTP acima, sem ler o armazenamento em memória direto, para que o backend definitivo possa substituir a API mantendo os mesmos contratos.

O front-end SHALL tratar os códigos de erro que só o backend definitivo emite:
- `TOO_MANY_ATTEMPTS` (429);
- `SERVICE_UNAVAILABLE` (503), que mostra a mensagem da API ou "Serviço temporariamente indisponível. Tente de novo em instantes.".

#### Scenario: Troca de backend
- **WHEN** a URL base da API é apontada para outro servidor que implementa os mesmos contratos
- **THEN** o front-end funciona sem mudança de código

#### Scenario: Backend indisponível
- **WHEN** a profissional confirma um pedido e o gateway responde 503 `SERVICE_UNAVAILABLE` sem mensagem no corpo
- **THEN** o painel mostra "Serviço temporariamente indisponível. Tente de novo em instantes." e o pedido continua pendente
