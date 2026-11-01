# appointment-booking Specification

## Purpose

Permite que a cliente peça um horário para um serviço conforme a disponibilidade real da profissional responsável, respeitando o expediente e a grade de 30 minutos do salão.

## Requirements

### Requirement: Expediente e grade de horários
O salão SHALL atender de segunda a sábado, das 09h às 20h, no fuso America/Sao_Paulo. Os horários de início SHALL seguir uma grade de 30 minutos (09:00, 09:30, ..., 19:30). Um serviço MUST terminar até 20:00. Domingo MUST NOT ter horários.

#### Scenario: Último horário para serviço de 2 horas
- **WHEN** a cliente escolhe "7 a 12 tranças" com duração cadastrada de 2 h
- **THEN** o último horário oferecido é 18:00

#### Scenario: Serviço longo
- **WHEN** a cliente escolhe "Goddess braids" com duração cadastrada de 7 h
- **THEN** os horários oferecidos vão de 09:00 a 13:00

#### Scenario: Último horário para serviço de 30 minutos
- **WHEN** a cliente escolhe "Manicure" (30 min)
- **THEN** o último horário oferecido é 19:30

#### Scenario: Domingo fechado
- **WHEN** a cliente olha os dias disponíveis
- **THEN** nenhum domingo aparece como selecionável

### Requirement: Janela de agendamento
A cliente SHALL poder agendar a partir do horário atual até 30 dias corridos à frente. Horários que já passaram no dia atual MUST NOT ser oferecidos.

#### Scenario: Hoje à tarde
- **WHEN** a cliente agenda às 14:10 de uma segunda-feira
- **THEN** o primeiro horário oferecido nesse dia é 14:30

### Requirement: Disponibilidade por profissional
Um horário SHALL estar disponível para um serviço quando o intervalo [início, início + duração) não se sobrepõe a nenhum agendamento **confirmado** da profissional responsável. Pedidos aguardando confirmação MUST NOT bloquear horário. Agendamentos de outras profissionais MUST NOT afetar a disponibilidade.

#### Scenario: Confirmado bloqueia a mesma profissional
- **WHEN** existe um "Manicure + Pedicure" confirmado com Stéfani às 10:00
- **THEN** os horários 10:00 e 10:30 não aparecem para "Manicure", e 09:30 não aparece para "Manicure + Pedicure"

#### Scenario: Outra profissional livre
- **WHEN** existe um "Manicure + Pedicure" confirmado com Stéfani às 10:00
- **THEN** o horário 10:00 continua disponível para "Depilação" com Michele

#### Scenario: Pendente não bloqueia
- **WHEN** existe um pedido de "Manicure" às 11:00 aguardando confirmação
- **THEN** 11:00 continua disponível para outra cliente pedir "Manicure"

### Requirement: Fluxo de pedido em passos
O agendamento SHALL ter passos curtos, um por tela: (1) serviço (primeiro a categoria, depois o serviço, com preço e duração visíveis), (2) dia, (3) horário, (4) nome e WhatsApp, (5) revisão e envio. Cada passo SHALL mostrar o número do passo, um botão "Voltar" e manter as escolhas anteriores. Dias SHALL aparecer como botões grandes com dia da semana e data por extenso. Dia sem horário livre SHALL aparecer desabilitado com o texto "Sem horários".

#### Scenario: Pedido completo
- **WHEN** a cliente escolhe "Depilação", sexta-feira 06/11, 15:00, informa nome e WhatsApp e toca em "Enviar pedido"
- **THEN** o sistema registra o pedido com status "Aguardando confirmação" e mostra a tela de pedido enviado

#### Scenario: Voltar preserva escolhas
- **WHEN** a cliente está no passo de horário e toca em "Voltar"
- **THEN** volta ao passo de dia com o dia escolhido ainda marcado

### Requirement: Dados da cliente
O pedido MUST exigir nome (mínimo 2 caracteres) e telefone WhatsApp brasileiro com DDD (10 ou 11 dígitos). O telefone SHALL ser guardado em formato internacional (+55...). Observação SHALL ser opcional, com até 300 caracteres. Mensagens de erro SHALL aparecer em texto simples ao lado do campo.

#### Scenario: Telefone inválido
- **WHEN** a cliente informa "9681-7976" sem DDD
- **THEN** o sistema mostra "Informe o WhatsApp com DDD, ex.: (21) 96811-7976" e não envia o pedido

### Requirement: Horário ocupado no envio
Se o horário deixar de estar disponível entre a escolha e o envio, o sistema MUST recusar o pedido e levar a cliente de volta ao passo de horário com aviso claro.

#### Scenario: Confirmação concorrente
- **WHEN** o admin confirma outro agendamento no mesmo horário e profissional antes de a cliente enviar
- **THEN** a cliente vê "Esse horário acabou de ser ocupado. Escolha outro." e a lista de horários atualizada

### Requirement: Pedido enviado e consulta de status
Após o envio, o sistema SHALL mostrar resumo (serviço, profissional, data, horário, preço, status), explicar que o salão vai confirmar e oferecer link permanente para consultar o status. O status SHALL ser um entre: "Aguardando confirmação", "Confirmado", "Recusado", "Cancelado".

#### Scenario: Consulta após confirmação
- **WHEN** a cliente abre o link do pedido depois que a profissional confirmou
- **THEN** o status exibido é "Confirmado"

#### Scenario: Link inexistente
- **WHEN** alguém abre um link de pedido com identificador inválido
- **THEN** o sistema mostra "Agendamento não encontrado" e um botão para a tela inicial
