## MODIFIED Requirements

### Requirement: Inclusão e edição de serviços pelo admin
O admin SHALL poder criar e editar serviços: nome, categoria e subcategoria (existentes ou novas), duração (múltiplo de 30 min, de 30 min a 8 h), preço opcional, profissional responsável e status ativo. Todos os valores do catálogo inicial (preços, durações e observações das categorias, como o valor do encapsular) MUST ser editáveis pelo painel, sem mudança de código. Com perfil master, o admin SHALL poder editar qualquer serviço, categorias e observações e cadastrar novas profissionais. Com perfil profissional, o admin SHALL ver e editar só os próprios serviços. A profissional também pode criar serviço, que fica sempre em nome dela, em categoria existente. Ela MUST NOT trocar a profissional responsável, criar ou editar categorias nem cadastrar profissionais. Alterações SHALL valer de imediato na lista pública e no agendamento. Agendamentos já feitos MUST manter o preço e a duração do momento do pedido.

#### Scenario: Edição de preço
- **WHEN** a Stéfani altera o preço de "Manicure" de R$ 20,00 para R$ 25,00 e salva
- **THEN** a lista pública passa a mostrar R$ 25,00, e os agendamentos de Manicure já existentes continuam com R$ 20,00

#### Scenario: Edição da observação da categoria
- **WHEN** o master altera a observação de Unhas para "Encapsular: + R$ 20,00."
- **THEN** a cliente passa a ver o novo texto ao abrir a categoria Unhas

#### Scenario: Preço inválido
- **WHEN** a profissional informa preço negativo ou com texto
- **THEN** o sistema rejeita e mostra "Informe um valor em reais, ex.: 45,00"

#### Scenario: Novo serviço
- **WHEN** a Stéfani cadastra "Spa dos pés", categoria Unhas, subcategoria Cuidados básicos, 1 h, R$ 45,00
- **THEN** o serviço é criado em nome da Stéfani e aparece na lista pública e no agendamento com a duração e o preço informados

#### Scenario: Duração inválida
- **WHEN** a profissional informa duração de 45 minutos
- **THEN** o sistema rejeita e informa que a duração deve ser múltiplo de 30 minutos

#### Scenario: Profissional vê só os próprios serviços
- **WHEN** a Michele abre a tela de serviços
- **THEN** vê apenas "Depilação", sem o campo de profissional responsável e sem os controles de categoria

#### Scenario: Profissional tenta transferir serviço
- **WHEN** a Lorrayne envia uma alteração que troca a profissional de "Box braids" para `stefani`
- **THEN** a resposta é 403 `FORBIDDEN` e o serviço continua com a Lorrayne

## ADDED Requirements

### Requirement: Serviços em tabela no computador
Em telas a partir de 1024 px, a tela de serviços do admin SHALL mostrar os serviços em tabela, com as colunas serviço, categoria e subcategoria, duração (com a marca "duração estimada" quando houver), preço, profissional (só para o master) e status. A edição e a criação SHALL abrir em painel lateral, sem sair da tabela. Abaixo de 1024 px, SHALL manter o layout de celular atual.

#### Scenario: Editar pela tabela
- **WHEN** o master clica em "Box braids" na tabela, numa tela de 1280 px
- **THEN** o formulário abre ao lado da tabela e, ao salvar, a linha mostra os novos valores sem recarregar a página
