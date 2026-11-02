## ADDED Requirements

### Requirement: Volta à página inicial leva ao pedido
Ao abrir a página inicial, o front SHALL consultar `GET /api/appointments/mine`. Havendo pedido em andamento, SHALL levar a cliente para `/agendamento/{id}` do primeiro da lista (o de início mais próximo), sem criar entrada nova no histórico do navegador.

O redirecionamento MUST acontecer no máximo uma vez por visita (aba do navegador). MUST NOT acontecer quando a página inicial é aberta pelo "Voltar para o início" da tela do pedido, que leva a `/?inicio=1`. Lista vazia ou erro na consulta MUST deixar a página inicial como hoje.

#### Scenario: Cliente volta com pedido pendente
- **WHEN** a cliente que pediu Manicure para sexta 06/11 às 11:00 abre a página inicial no mesmo aparelho, numa visita nova
- **THEN** vai direto para a tela do pedido, que mostra "Aguardando confirmação"

#### Scenario: Volta ao início para agendar outro
- **WHEN** na tela do pedido ela toca em "Voltar para o início"
- **THEN** a página inicial abre normalmente, com o cartão "Seu pedido" no topo, e ela consegue agendar outro serviço

#### Scenario: Só uma vez por visita
- **WHEN** ela já foi levada ao pedido nesta aba e abre a página inicial de novo pelo logo
- **THEN** a página inicial abre sem redirecionar

#### Scenario: Aparelho sem pedidos
- **WHEN** alguém abre a página inicial pela primeira vez
- **THEN** a página aparece como hoje, sem redirecionamento e sem cartão

### Requirement: Cartão de acompanhamento na página inicial
Ao abrir a página inicial, o front SHALL consultar `GET /api/appointments/mine`. Havendo pedidos, SHALL mostrar acima do botão "Agendar horário" o cartão "Seu pedido" ("Seus pedidos" com mais de um).

Cada pedido no cartão SHALL mostrar:
- serviço;
- dia da semana e data por extenso, com o horário;
- profissional;
- status com o rótulo e a cor de status já usados na tela do pedido;
- o botão "Ver pedido", que leva a `/agendamento/{id}`.

O cartão SHALL mostrar até 3 pedidos, na ordem da API. Acima disso, mostra o texto "e mais N pedidos".

Lista vazia ou erro na consulta MUST deixar a página como hoje, sem cartão e sem mensagem de erro.

#### Scenario: Cartão ao voltar ao início
- **WHEN** a cliente que pediu Manicure para sexta 06/11 às 11:00 volta à página inicial pelo "Voltar para o início"
- **THEN** vê no topo "Seu pedido: Manicure, sexta-feira, 6 de novembro, às 11:00, com Stéfani", o status "Aguardando confirmação" e o botão "Ver pedido", e o botão "Agendar horário" continua logo abaixo

#### Scenario: Pedido confirmado
- **WHEN** a profissional confirma o pedido e a cliente reabre a página inicial
- **THEN** o cartão mostra o status "Confirmado"

#### Scenario: API indisponível
- **WHEN** a consulta dos pedidos falha
- **THEN** a página aparece sem cartão e sem aviso de erro, e o catálogo carrega normalmente
