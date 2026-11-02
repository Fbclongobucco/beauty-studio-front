## ADDED Requirements

### Requirement: Cartão de acompanhamento na página inicial
Ao abrir a página inicial, o front SHALL consultar `GET /api/appointments/mine`. Havendo pedidos, SHALL mostrar acima do botão "Agendar horário" o cartão "Seu pedido" ("Seus pedidos" com mais de um).

Cada pedido no cartão SHALL mostrar:
- serviço;
- dia da semana e data por extenso, com o horário;
- profissional;
- status com o rótulo e a cor de status já usados na tela do pedido;
- o botão "Ver pedido", que leva a `/agendamento/{id}`.

O cartão SHALL mostrar até 3 pedidos, na ordem da API. Acima disso, mostra o texto "e mais N pedidos".

Lista vazia ou erro na consulta MUST deixar a página como hoje, sem cartão e sem mensagem de erro. O front MUST NOT redirecionar a cliente automaticamente para o pedido.

#### Scenario: Cliente volta com pedido pendente
- **WHEN** a cliente que pediu Manicure para sexta 06/11 às 11:00 abre a página inicial no mesmo aparelho
- **THEN** vê no topo "Seu pedido: Manicure, sexta-feira, 6 de novembro, às 11:00, com Stéfani", o status "Aguardando confirmação" e o botão "Ver pedido", e o botão "Agendar horário" continua logo abaixo

#### Scenario: Pedido confirmado
- **WHEN** a profissional confirma o pedido e a cliente reabre a página inicial
- **THEN** o cartão mostra o status "Confirmado"

#### Scenario: Aparelho sem pedidos
- **WHEN** alguém abre a página inicial pela primeira vez
- **THEN** a página aparece como hoje, sem cartão

#### Scenario: API indisponível
- **WHEN** a consulta dos pedidos falha
- **THEN** a página aparece sem cartão e sem aviso de erro, e o catálogo carrega normalmente

### Requirement: Não é meu pedido
Cada pedido do cartão SHALL ter o link "Não é meu pedido". Ao tocar, o front SHALL chamar `DELETE /api/appointments/mine/{id}` e tirar o pedido do cartão. Sem pedidos restantes, o cartão some. A ação MUST NOT cancelar nem alterar o pedido.

#### Scenario: Aparelho compartilhado
- **WHEN** a irmã da cliente abre a página inicial no mesmo tablet e toca em "Não é meu pedido"
- **THEN** o pedido sai do cartão nesse tablet e continua "Aguardando confirmação" no painel
