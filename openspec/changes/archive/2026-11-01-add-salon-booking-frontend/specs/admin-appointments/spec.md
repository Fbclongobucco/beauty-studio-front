## Purpose

Dá às profissionais do salão uma área restrita para receber avisos de novos pedidos, confirmar, recusar ou cancelar agendamentos e acompanhar a agenda de cada profissional.

## ADDED Requirements

### Requirement: Acesso protegido por senha
A área `/admin` e as operações administrativas da API MUST exigir login com senha única configurada no ambiente. Sem sessão válida, páginas admin SHALL redirecionar para a tela de login e a API admin SHALL responder 401. A sessão SHALL expirar em 12 horas e ter opção "Sair".

#### Scenario: Acesso sem login
- **WHEN** alguém abre `/admin` sem sessão
- **THEN** é levado para a tela de login

#### Scenario: Senha errada
- **WHEN** a senha informada está incorreta
- **THEN** o sistema mostra "Senha incorreta" e não cria sessão

### Requirement: Aviso de novos pedidos
O admin SHALL mostrar a contagem de pedidos "Aguardando confirmação" em destaque no topo de todas as telas admin e no título da aba do navegador. A contagem SHALL se atualizar sozinha em até 30 segundos após um novo pedido, sem recarregar a página. Pedidos novos ainda não vistos SHALL aparecer marcados como "Novo".

#### Scenario: Pedido chega com o admin aberto
- **WHEN** uma cliente envia um pedido enquanto a profissional está no admin
- **THEN** em até 30 segundos o contador aumenta, o título da aba mostra "(1) Pedidos" e o pedido aparece na lista marcado "Novo"

### Requirement: Confirmar pedido bloqueia o horário
A profissional SHALL poder confirmar um pedido pendente. Ao confirmar, o status passa a "Confirmado" e o intervalo fica indisponível para novos pedidos daquela profissional. O sistema MUST impedir a confirmação se o intervalo já estiver ocupado por outro agendamento confirmado da mesma profissional.

#### Scenario: Confirmação normal
- **WHEN** a profissional confirma o pedido de "Manicure" com Stéfani às 11:00
- **THEN** o status vira "Confirmado" e 11:00 deixa de ser oferecido para serviços da Stéfani

#### Scenario: Conflito na confirmação
- **WHEN** a profissional tenta confirmar um pedido cujo horário já tem outro confirmado da mesma profissional
- **THEN** o sistema recusa a ação e mostra "Horário já ocupado por outro agendamento confirmado"

### Requirement: Indicação de pedidos em conflito
Pedidos pendentes que se sobrepõem a um agendamento confirmado ou a outro pendente da mesma profissional SHALL ser marcados como "Conflito de horário" na lista do admin.

#### Scenario: Dois pedidos no mesmo horário
- **WHEN** duas clientes pedem "Manicure" às 11:00 e a profissional confirma uma delas
- **THEN** o outro pedido passa a mostrar "Conflito de horário" e o botão "Confirmar" fica desabilitado

### Requirement: Recusar e cancelar
A profissional SHALL poder recusar um pedido pendente e cancelar um agendamento confirmado, com motivo opcional. Cancelar SHALL liberar o horário. Toda ação que muda status SHALL pedir confirmação ("Tem certeza?").

#### Scenario: Cancelamento libera horário
- **WHEN** a profissional cancela o agendamento confirmado das 11:00
- **THEN** o status vira "Cancelado" e 11:00 volta a ser oferecido

### Requirement: Agenda por dia e profissional
O admin SHALL ter uma visão de agenda por dia com filtro por profissional, listando os agendamentos em ordem de horário com cliente, telefone (com link para WhatsApp), serviço, duração e status. O admin SHALL ter uma lista de pedidos pendentes ordenada pela data do atendimento.

#### Scenario: Agenda filtrada
- **WHEN** a profissional seleciona o dia 06/11 e o filtro "Lorrayne Longobuco"
- **THEN** só os agendamentos da Lorrayne nesse dia aparecem, em ordem de horário

#### Scenario: Contato com a cliente
- **WHEN** a profissional toca no telefone de uma cliente
- **THEN** abre uma conversa do WhatsApp com esse número

### Requirement: Admin utilizável no celular
As telas admin SHALL funcionar em celular a partir de 360 px, com os mesmos mínimos de tamanho de texto e área de toque das telas públicas.

#### Scenario: Confirmar pelo celular
- **WHEN** a profissional abre a lista de pendentes em um celular de 360 px
- **THEN** consegue ler os dados e tocar em "Confirmar" sem zoom nem rolagem horizontal
