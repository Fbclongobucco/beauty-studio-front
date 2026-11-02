## MODIFIED Requirements

### Requirement: Disponibilidade por profissional
Um horário SHALL estar disponível para um serviço quando o intervalo [início, início + duração) não se sobrepõe a nenhum agendamento **confirmado** da profissional responsável. Pedidos aguardando confirmação MUST NOT bloquear horário. Agendamentos de outras profissionais MUST NOT afetar a disponibilidade.

No passo de horário, o início que se sobrepõe a um confirmado da profissional SHALL aparecer na grade, na sua posição, com estas características:
- em cinza;
- com a palavra "ocupado" abaixo do horário;
- desabilitado;
- MUST NOT ser selecionável por toque, clique ou teclado.

Horários que já passaram e horários fora da grade do serviço continuam sem aparecer.

Quando o dia só tem horários ocupados, a grade SHALL aparecer toda em cinza, com o aviso "Todos os horários deste dia já estão ocupados." e o botão "Escolher outro dia".

#### Scenario: Confirmado bloqueia a mesma profissional
- **WHEN** existe um "Manicure + Pedicure" confirmado com Stéfani às 10:00
- **THEN** 10:00 e 10:30 aparecem em cinza, como "ocupado" e desabilitados para "Manicure", e 09:30 aparece assim para "Manicure + Pedicure"

#### Scenario: Toque em horário ocupado
- **WHEN** a cliente toca em 10:00 marcado como ocupado
- **THEN** nada é selecionado e a cliente continua no passo de horário

#### Scenario: Outra profissional livre
- **WHEN** existe um "Manicure + Pedicure" confirmado com Stéfani às 10:00
- **THEN** o horário 10:00 continua disponível para "Depilação" com Michele

#### Scenario: Pendente não bloqueia
- **WHEN** existe um pedido de "Manicure" às 11:00 aguardando confirmação
- **THEN** 11:00 continua disponível, sem marca de ocupado, para outra cliente pedir "Manicure"

#### Scenario: Dia todo ocupado
- **WHEN** todos os horários de "Manicure" de um sábado estão ocupados por confirmados
- **THEN** a grade aparece toda em cinza, com o aviso "Todos os horários deste dia já estão ocupados." e o botão "Escolher outro dia"
