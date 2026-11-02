## MODIFIED Requirements

### Requirement: Endpoints públicos
A API SHALL expor estes endpoints, em JSON:
- `GET /api/services`: categorias com observação e serviços ativos, com subcategoria, duração em minutos, preço em centavos (ou nulo) e profissional. Não expõe a marcação de duração estimada.
- `GET /api/availability?serviceId=&date=YYYY-MM-DD`:
  - `slots`: horários de início livres (HH:mm) para o serviço na data;
  - `taken`: horários da grade do dia, ainda não passados, que se sobrepõem a um agendamento confirmado da profissional, em ordem crescente e sem repetir os de `slots`.
  - A resposta não informa quem ocupa o horário.
- `GET /api/availability/days?serviceId=&from=YYYY-MM-DD&days=N`: para cada dia, se há algum horário livre.
- `POST /api/appointments`: cria pedido com `serviceId`, `date`, `time`, `customerName`, `customerPhone` e `notes` opcional. Responde 201 com o agendamento.
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

#### Scenario: Horários ocupados
- **WHEN** a Stéfani tem Manicure confirmada na sexta às 11:00, e o cliente HTTP consulta Manicure nesse dia
- **THEN** a resposta traz `taken: ["11:00"]`, e `slots` não traz 11:00
