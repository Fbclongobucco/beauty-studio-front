# admin-appointments Specification

## Purpose

Dá às profissionais do salão uma área restrita para receber avisos de novos pedidos, confirmar, recusar ou cancelar agendamentos e acompanhar a agenda de cada profissional.

## Requirements

### Requirement: Acesso protegido por senha
A área `/admin` e as operações administrativas da API MUST exigir login com usuário e senha de uma conta configurada no ambiente, conforme a capacidade `admin-access`. Sem sessão válida, páginas admin SHALL redirecionar para a tela de login e a API admin SHALL responder 401. A sessão SHALL expirar em 12 horas e ter opção "Sair".

#### Scenario: Acesso sem login
- **WHEN** alguém abre `/admin` sem sessão
- **THEN** é levado para a tela de login

#### Scenario: Senha errada
- **WHEN** o usuário ou a senha informados estão incorretos
- **THEN** o sistema mostra "Usuário ou senha incorretos" e não cria sessão

### Requirement: Aviso de novos pedidos
O admin SHALL mostrar a contagem de pedidos "Aguardando confirmação" em destaque em todas as telas admin e no título da aba do navegador. A contagem SHALL se atualizar sozinha em até 30 segundos após um novo pedido, sem recarregar a página. Para a profissional, a contagem e a marca "Novo" SHALL considerar só os pedidos dela. Para o master, a contagem SHALL ser a do salão todo. Só a visita da profissional dona do pedido MUST marcar o pedido como visto. A visita do master MUST NOT tirar a marca "Novo" da profissional.

#### Scenario: Pedido chega com o admin aberto
- **WHEN** uma cliente envia um pedido de Manicure enquanto a Stéfani está no admin
- **THEN** em até 30 segundos o contador da Stéfani aumenta, o título da aba mostra "(1) Pedidos" e o pedido aparece na lista marcado "Novo"

#### Scenario: Pedido de outra profissional
- **WHEN** chega um pedido de Depilação enquanto a Stéfani está no admin
- **THEN** o contador da Stéfani não muda

#### Scenario: Master não marca como visto
- **WHEN** o master abre a lista de pendentes antes da Lorrayne
- **THEN** a Lorrayne ainda vê os pedidos dela marcados "Novo"

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
O admin SHALL ter uma visão de agenda por dia, com os agendamentos em ordem de horário, mostrando cliente, telefone (com link para WhatsApp), serviço, duração e status. O admin SHALL ter uma lista de pedidos pendentes ordenada pela data do atendimento. O filtro por profissional SHALL aparecer só para o master. A profissional SHALL ver sempre e somente a própria agenda.

#### Scenario: Agenda filtrada
- **WHEN** o master seleciona o dia 06/11 e o filtro "Lorrayne Longobuco"
- **THEN** só os agendamentos da Lorrayne nesse dia aparecem, em ordem de horário

#### Scenario: Agenda da profissional
- **WHEN** a Lorrayne abre a agenda do dia 06/11
- **THEN** vê só os agendamentos dela, sem filtro de profissional na tela

#### Scenario: Contato com a cliente
- **WHEN** a profissional toca no telefone de uma cliente
- **THEN** abre uma conversa do WhatsApp com esse número

### Requirement: Admin utilizável no celular
As telas admin SHALL funcionar em celular a partir de 360 px, com os mesmos mínimos de tamanho de texto e área de toque das telas públicas.

#### Scenario: Confirmar pelo celular
- **WHEN** a profissional abre a lista de pendentes em um celular de 360 px
- **THEN** consegue ler os dados e tocar em "Confirmar" sem zoom nem rolagem horizontal

### Requirement: Agenda semanal
A agenda SHALL oferecer as visões "Dia" e "Semana". Em telas a partir de 1024 px, a visão Semana SHALL ser uma grade com colunas de segunda a sábado e linhas das 09:00 às 20:00 em passos de 30 minutos. Cada agendamento aparece como bloco com altura proporcional à duração, cor do status e horário, cliente e serviço. Em telas menores, a visão Semana SHALL listar os agendamentos agrupados por dia. A visão e a semana escolhidas SHALL ficar no endereço da página.

#### Scenario: Bloco proporcional à duração
- **WHEN** a Lorrayne tem Box braids confirmado na quarta às 09:00, com 6 h
- **THEN** a grade mostra um bloco "Confirmado" na coluna de quarta, das 09:00 às 15:00

#### Scenario: Navegar entre semanas
- **WHEN** a profissional clica em "Próxima semana"
- **THEN** a grade passa a mostrar a semana seguinte, e o endereço muda para que um recarregamento mantenha a semana

### Requirement: Ações a partir da agenda semanal
Ao selecionar um bloco na visão Semana, o admin SHALL mostrar os dados completos do agendamento e as ações do status atual (Confirmar, Recusar, Cancelar), com as mesmas regras de confirmação e conflito da lista. Na visão do master com "Todas", agendamentos simultâneos de profissionais diferentes SHALL aparecer lado a lado no mesmo dia, sem se sobrepor.

#### Scenario: Confirmar pela grade
- **WHEN** a profissional seleciona um bloco "Aguardando confirmação" e confirma
- **THEN** o bloco passa a "Confirmado" sem recarregar a página

#### Scenario: Simultâneos no master
- **WHEN** a Stéfani e a Michele têm atendimento na segunda às 10:00 e o master vê "Todas"
- **THEN** os dois blocos aparecem lado a lado na coluna de segunda, com o nome da profissional em cada um

### Requirement: Painel adaptado ao computador
Em telas a partir de 1024 px, o painel SHALL ter um cabeçalho fixo em toda a largura do topo, com logo, navegação (Pedidos, Agenda, Serviços, Ganhos), contagem de pendentes, nome da pessoa logada e "Sair", além da data de hoje e de atalhos para a agenda do dia, a semana e os ganhos. O conteúdo SHALL usar a largura disponível, até 1440 px. A lista de pedidos pendentes SHALL aparecer em grade, com 2 colunas a partir de 1024 px e 3 a partir de 1440 px. Abaixo de 1024 px, o layout de celular atual SHALL ser mantido.

#### Scenario: Pedidos no computador
- **WHEN** a profissional abre a lista de pendentes numa tela de 1440 px com 6 pedidos
- **THEN** os pedidos aparecem em 3 colunas, com os botões Confirmar e Recusar visíveis em cada um

#### Scenario: Celular inalterado
- **WHEN** o painel é aberto em 360 px
- **THEN** a navegação continua no topo e os pedidos em uma coluna, sem rolagem horizontal
