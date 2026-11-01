# admin-earnings Specification

## Purpose

Mostra a cada profissional quanto ela tem a receber pelos atendimentos confirmados em um período, separando o que já foi atendido do que ainda está na agenda. Ao master mostra o total do salão por profissional.

## Requirements

### Requirement: Base de cálculo dos ganhos
Os ganhos SHALL somar o preço gravado em cada agendamento com status confirmado e data dentro do período. Pedidos pendentes, recusados e cancelados MUST NOT entrar na soma. Agendamento sem preço ("Consultar valor") MUST ficar fora da soma e ser contado à parte. A tela MUST informar que os valores vêm do preço do serviço na hora do pedido e não incluem adicionais nem descontos.

#### Scenario: Cancelado fora da soma
- **WHEN** a Stéfani tem no mês dois confirmados de Manicure (R$ 20,00) e um cancelado de Pedicure (R$ 25,00)
- **THEN** o total do mês é R$ 40,00 com 2 atendimentos

#### Scenario: Serviço sem preço
- **WHEN** há um atendimento confirmado de serviço sem preço no período
- **THEN** ele não altera o total, e a tela mostra "1 atendimento com valor a consultar, fora do total"

#### Scenario: Preço alterado depois do pedido
- **WHEN** o preço da Manicure muda de R$ 20,00 para R$ 25,00 depois de um agendamento confirmado
- **THEN** esse agendamento continua somando R$ 20,00

### Requirement: Realizado e previsto
O total SHALL ser dividido em "Realizado", com os atendimentos já terminados no fuso America/Sao_Paulo, e "Previsto", com os que ainda não terminaram. Cada parte SHALL mostrar valor e quantidade de atendimentos.

#### Scenario: Divisão no meio do mês
- **WHEN** a Lorrayne tem no mês um Box braids confirmado já atendido (R$ 190,00) e um Ghana braids confirmado para a semana seguinte (R$ 160,00)
- **THEN** a tela mostra Realizado R$ 190,00 (1), Previsto R$ 160,00 (1) e Total R$ 350,00 (2)

### Requirement: Escolha do período
O painel de ganhos SHALL oferecer os períodos "Esta semana" (segunda a sábado), "Este mês", "Mês passado" e "Período" com datas de início e fim. Ao abrir, SHALL mostrar "Este mês". Período com fim antes do início, ou com mais de 366 dias, MUST ser rejeitado com mensagem.

#### Scenario: Mês passado
- **WHEN** em 15/11 a profissional escolhe "Mês passado"
- **THEN** a tela mostra os ganhos de 01/10 a 31/10

#### Scenario: Período invertido
- **WHEN** a profissional informa início 20/11 e fim 10/11
- **THEN** o sistema mostra "A data final deve ser depois da inicial" e não recalcula

### Requirement: Detalhamento por serviço e por dia
O painel de ganhos SHALL listar os serviços do período com a quantidade de atendimentos e o valor, do maior para o menor valor. SHALL mostrar também um gráfico de barras com o valor por dia, que diferencia realizado e previsto. O gráfico MUST ter alternativa em texto para leitores de tela.

#### Scenario: Serviço mais rentável primeiro
- **WHEN** no período a Stéfani fez 3 Manicures (R$ 60,00) e 1 Fibra de vidro (R$ 135,00)
- **THEN** a lista mostra primeiro "Fibra de vidro · 1 · R$ 135,00" e depois "Manicure · 3 · R$ 60,00"

### Requirement: Ganhos individuais e do salão
Com perfil profissional, o painel de ganhos SHALL mostrar só os ganhos da própria profissional. Com perfil master, SHALL mostrar o total do salão e o detalhamento por profissional, com filtro para ver uma profissional por vez.

#### Scenario: Profissional vê só o próprio
- **WHEN** a Michele abre o painel de ganhos
- **THEN** vê apenas os valores dos atendimentos de Depilação dela

#### Scenario: Master por profissional
- **WHEN** o master abre o painel de ganhos de "Este mês"
- **THEN** vê o total do salão e uma linha por profissional, com valor e quantidade

### Requirement: Valores formatados
Valores SHALL aparecer em pt-BR ("R$ 1.234,56"), e o painel SHALL funcionar no celular a partir de 360 px, sem rolagem horizontal.

#### Scenario: Ganhos no celular
- **WHEN** a profissional abre o painel de ganhos em um celular de 360 px
- **THEN** lê total, realizado, previsto e a lista por serviço sem rolagem horizontal
