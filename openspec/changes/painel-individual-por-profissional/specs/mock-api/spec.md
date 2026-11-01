## MODIFIED Requirements

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
