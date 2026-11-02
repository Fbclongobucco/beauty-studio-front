## MODIFIED Requirements

### Requirement: Dados da cliente
O pedido MUST exigir:
- nome com no mínimo 2 caracteres;
- telefone WhatsApp brasileiro com DDD, de 10 ou 11 dígitos, guardado em formato internacional (+55...).

A observação SHALL ser opcional, com até 300 caracteres. Mensagens de erro SHALL aparecer em texto simples ao lado do campo.

O passo de nome e WhatsApp SHALL informar que as atualizações do pedido (confirmação, recusa ou cancelamento) chegam por mensagem nesse WhatsApp. O passo de revisão SHALL repetir o aviso junto ao número informado.

#### Scenario: Telefone inválido
- **WHEN** a cliente informa "9681-7976" sem DDD
- **THEN** o sistema mostra "Informe o WhatsApp com DDD, ex.: (21) 96811-7976" e não envia o pedido

#### Scenario: Aviso sobre as atualizações
- **WHEN** a cliente chega ao passo de nome e WhatsApp
- **THEN** vê o texto "As atualizações do seu pedido chegam por mensagem neste WhatsApp."

#### Scenario: Revisão com o número
- **WHEN** a cliente informa `(21) 98888-7777` e avança para a revisão
- **THEN** a revisão mostra o número e informa que as atualizações do pedido chegam nesse WhatsApp

### Requirement: Pedido enviado e consulta de status
Após o envio, o sistema SHALL mostrar resumo (serviço, profissional, data, horário, preço, status) e explicar que o salão vai confirmar pelo WhatsApp. O status SHALL ser um entre: "Aguardando confirmação", "Confirmado", "Recusado", "Cancelado".

Cada pedido SHALL ter um endereço permanente de consulta do status, e é esse link que segue nas mensagens de WhatsApp do backend definitivo. A tela MUST NOT oferecer botão de copiar ou compartilhar o link.

#### Scenario: Consulta após confirmação
- **WHEN** a cliente abre o link do pedido depois que a profissional confirmou
- **THEN** o status exibido é "Confirmado"

#### Scenario: Link inexistente
- **WHEN** alguém abre um link de pedido com identificador inválido
- **THEN** o sistema mostra "Agendamento não encontrado" e um botão para a tela inicial

#### Scenario: Sem botão de copiar link
- **WHEN** a cliente abre a tela do pedido enviado
- **THEN** vê "Atualizar status", "Falar com o salão" e "Voltar para o início", sem opção de copiar ou compartilhar o link, e o texto do status pendente não pede para guardar o link
