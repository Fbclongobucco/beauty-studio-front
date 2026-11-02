## ADDED Requirements

### Requirement: Acompanhamento dos pedidos do aparelho
A API de teste SHALL seguir o contrato de acompanhamento do backend definitivo:
- o cookie `my_requests` é gravado pelo servidor nas respostas de `POST /api/appointments` (201) e `GET /api/appointments/{id}` (200);
- o cookie é `HttpOnly`, com `Path=/api/appointments` e 60 dias de validade;
- ele guarda até 10 ids assinados, do mais recente para o mais antigo, sem duplicar;
- valor inválido conta como vazio;
- `GET /api/appointments/mine` responde `{ appointments: PublicAppointment[] }`, ordenado pelo início, com:
  - os pendentes;
  - os confirmados que ainda não terminaram;
  - os recusados e cancelados com início no futuro;
- `DELETE /api/appointments/mine/{id}` tira o id do cookie e responde a lista atualizada, sem alterar o pedido.

O cookie MUST NOT conter dados da cliente.

#### Scenario: Pedido criado na API de teste
- **WHEN** a cliente cria um pedido com o front usando a API de teste
- **THEN** a resposta grava `my_requests`, e `GET /api/appointments/mine` traz o pedido com `status: "pending"`

#### Scenario: Cookie adulterado
- **WHEN** a requisição traz um `my_requests` com valor alterado
- **THEN** `GET /api/appointments/mine` responde 200 com a lista vazia

#### Scenario: Esquecer pedido
- **WHEN** o front chama `DELETE /api/appointments/mine/{id}` para um pedido do cookie
- **THEN** a resposta traz a lista sem esse pedido, e o pedido continua no painel com o mesmo status
