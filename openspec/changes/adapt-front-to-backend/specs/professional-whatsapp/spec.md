## ADDED Requirements

### Requirement: Profissional cadastra o próprio WhatsApp
O painel da profissional SHALL ter o bloco "Meu WhatsApp", com o número atual e um campo para informar ou trocar o número.

Regras do campo:
- máscara progressiva igual à do agendamento;
- validação de número brasileiro com DDD, de 10 ou 11 dígitos;
- número inválido MUST mostrar "Informe o WhatsApp com DDD, ex.: (21) 96811-7976" ao lado do campo, sem enviar;
- "Salvar" SHALL enviar `PATCH /api/admin/me` com `{ whatsappPhone }`;
- "Remover número" SHALL enviar `{ whatsappPhone: null }`.

Depois de salvar ou remover, o painel SHALL mostrar o número devolvido pela API, formatado, e uma confirmação curta. Erro da API MUST aparecer no bloco, sem perder o que foi digitado. O bloco SHALL explicar que o número recebe o aviso de cada pedido novo.

O master MUST NOT ver esse bloco.

#### Scenario: Cadastro do número
- **WHEN** a Stéfani, logada, digita `21999990000` em "Meu WhatsApp" e toca em "Salvar"
- **THEN** o campo mostra `(21) 99999-0000`, o painel envia `PATCH /api/admin/me` e passa a exibir "(21) 99999-0000" como número atual, com a confirmação "WhatsApp salvo"

#### Scenario: Número inválido
- **WHEN** a Michele digita `9999-0000` e toca em "Salvar"
- **THEN** o painel mostra "Informe o WhatsApp com DDD, ex.: (21) 96811-7976" e não chama a API

#### Scenario: Remoção do número
- **WHEN** a Lorrayne toca em "Remover número"
- **THEN** o painel envia `{ whatsappPhone: null }` e passa a mostrar o aviso de número vazio

#### Scenario: Master não edita
- **WHEN** o master abre o painel
- **THEN** o bloco "Meu WhatsApp" não aparece

### Requirement: Aviso enquanto o WhatsApp estiver vazio
Com sessão de profissional e `whatsappPhone` nulo, o painel SHALL mostrar, em todas as telas, o aviso "Cadastre seu WhatsApp para receber os pedidos novos", com um link para o bloco "Meu WhatsApp". O aviso MUST sumir assim que o número for salvo, sem recarregar a página.

#### Scenario: Profissional sem número
- **WHEN** a Michele, sem WhatsApp cadastrado, abre a agenda
- **THEN** vê o aviso com o link para "Meu WhatsApp"

#### Scenario: Aviso some ao salvar
- **WHEN** a Michele salva um número válido
- **THEN** o aviso deixa de aparecer em todas as telas do painel

### Requirement: Master vê o WhatsApp só para leitura
Em "Profissionais e logins", o master SHALL ver o WhatsApp de cada profissional formatado, ou "WhatsApp não cadastrado". A interface MUST NOT oferecer ao master um campo para alterar esse número.

#### Scenario: Lista do master
- **WHEN** o master abre "Profissionais e logins", com a Stéfani com número e a Lorrayne sem número
- **THEN** a Stéfani mostra "(21) 99999-0000" e a Lorrayne mostra "WhatsApp não cadastrado", sem botão de edição do número
