# service-catalog Specification

## Purpose

Mantém o catálogo de serviços do salão (categoria, subcategoria, duração, preço, profissional responsável) e o exibe para as clientes, permitindo incluir novos serviços com o tempo sem mudar código.

## Requirements

### Requirement: Catálogo inicial
O sistema SHALL iniciar com as profissionais, as categorias e os serviços abaixo. Preços e nomes vêm das tabelas oficiais do salão (`docs/referencias/tabela-precos-unhas.jpg` para unhas e `docs/referencias/tabela-precos-trancas.jpg` para tranças). O preço da depilação foi informado pelo usuário. A duração de todo serviço MUST ser múltiplo de 30 minutos.

Profissionais: Stéfani Longo Bucco (Unhas), Lorrayne Longobuco (Tranças), Michele Batista (Depilação).

| Categoria | Subcategoria | Serviço | Preço | Duração | Origem da duração |
|---|---|---|---|---|---|
| Unhas | Cuidados básicos | Manicure | R$ 20,00 | 30 min | informada |
| Unhas | Cuidados básicos | Pedicure | R$ 25,00 | 30 min | informada |
| Unhas | Cuidados básicos | Manicure + Pedicure | R$ 40,00 | 1 h | informada |
| Unhas | Esmaltação e tratamento | Esmaltação em gel | R$ 50,00 | 1 h | ESTIMATIVA |
| Unhas | Esmaltação e tratamento | Blindagem | R$ 40,00 | 1 h | ESTIMATIVA |
| Unhas | Esmaltação e tratamento | Banho de gel | R$ 85,00 | 1 h 30 min | ESTIMATIVA |
| Unhas | Extensão e decoração | Postiça realista | R$ 70,00 | 1 h | ESTIMATIVA |
| Unhas | Extensão e decoração | Colocação molde F1 | R$ 90,00 | 2 h | ESTIMATIVA |
| Unhas | Extensão e decoração | Gel na tip | R$ 115,00 | 2 h | ESTIMATIVA |
| Unhas | Extensão e decoração | Fibra de vidro | R$ 135,00 | 2 h 30 min | ESTIMATIVA |
| Unhas | Manutenções | Manutenção gel | R$ 85,00 | 1 h 30 min | ESTIMATIVA |
| Unhas | Manutenções | Manutenção fibra de vidro | R$ 110,00 | 2 h | ESTIMATIVA |
| Tranças | Tranças nagô | 1 a 3 tranças | R$ 35,00 | 1 h | ESTIMATIVA |
| Tranças | Tranças nagô | 4 a 6 tranças | R$ 45,00 | 1 h 30 min | ESTIMATIVA |
| Tranças | Tranças nagô | 7 a 12 tranças | R$ 60,00 | 2 h | ESTIMATIVA |
| Tranças | Estilos | Box braids | R$ 190,00 | 6 h | ESTIMATIVA |
| Tranças | Estilos | Boxeadora | R$ 140,00 | 3 h | ESTIMATIVA |
| Tranças | Estilos | Goddess braids | R$ 200,00 | 7 h | ESTIMATIVA |
| Tranças | Estilos | Fulani braids | R$ 160,00 | 5 h | ESTIMATIVA |
| Tranças | Estilos | Ghana braids | R$ 160,00 | 4 h | ESTIMATIVA |
| Depilação | — | Depilação | R$ 80,00 | 1 h | informada |

Observações por categoria, exibidas à cliente:
- Unhas: "Francesinha: valor à parte. Encapsular: + R$ 15,00."
- Tranças: "Valores somente de mão de obra."

#### Scenario: Serviços iniciais disponíveis
- **WHEN** a aplicação é iniciada sem dados prévios
- **THEN** os 21 serviços acima aparecem ativos, com preço, duração, subcategoria e profissional corretos

#### Scenario: Observação da categoria
- **WHEN** a cliente abre a categoria Tranças
- **THEN** vê o aviso "Valores somente de mão de obra." antes da lista de serviços

### Requirement: Durações estimadas identificadas
Cada serviço SHALL guardar se a duração é estimada. As durações marcadas ESTIMATIVA na tabela inicial foram autorizadas pelo usuário só para teste. O admin MUST ver a marcação "duração estimada" nesses serviços até a profissional editar a duração. Para a cliente, a marcação MUST NOT aparecer.

#### Scenario: Duração estimada no admin
- **WHEN** a profissional abre a lista de serviços no admin antes de editar durações
- **THEN** "Box braids" aparece com "duração estimada" e "Manicure" aparece sem a marcação

#### Scenario: Correção da duração
- **WHEN** a profissional altera a duração de "Box braids" para 5 h
- **THEN** a marcação "duração estimada" some desse serviço e a agenda passa a usar 5 h

### Requirement: Preço exibido
O preço SHALL aparecer formatado em pt-BR ("R$ 1.234,56"). Serviço sem preço SHALL mostrar "Consultar valor".

#### Scenario: Serviço sem preço
- **WHEN** um serviço não tem preço cadastrado
- **THEN** a cliente vê "Consultar valor" no lugar do preço

### Requirement: Exibição pública dos serviços
A lista pública SHALL mostrar as categorias como blocos grandes ("Unhas", "Tranças", "Depilação"). Ao tocar em uma categoria, a cliente SHALL ver a observação da categoria e os serviços agrupados por subcategoria, cada um com nome, duração em linguagem simples ("30 minutos", "1 hora e 30 minutos", "6 horas") e preço. Só uma categoria fica aberta por vez. Serviços inativos MUST NOT aparecer para a cliente. Categoria sem serviço ativo MUST NOT aparecer.

#### Scenario: Navegação por categoria
- **WHEN** a cliente toca em "Unhas"
- **THEN** abre a lista com os títulos "Cuidados básicos", "Esmaltação e tratamento", "Extensão e decoração" e "Manutenções", com duração por extenso e preço

#### Scenario: Serviço inativo oculto
- **WHEN** o admin desativa um serviço
- **THEN** ele some da lista pública e do fluxo de agendamento, e os agendamentos já existentes continuam visíveis no admin

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

### Requirement: Serviços em tabela no computador
Em telas a partir de 1024 px, a tela de serviços do admin SHALL mostrar os serviços em tabela, com as colunas serviço, categoria e subcategoria, duração (com a marca "duração estimada" quando houver), preço, profissional (só para o master) e status. A edição e a criação SHALL abrir em painel lateral, sem sair da tabela. Abaixo de 1024 px, SHALL manter o layout de celular atual.

#### Scenario: Editar pela tabela
- **WHEN** o master clica em "Box braids" na tabela, numa tela de 1280 px
- **THEN** o formulário abre ao lado da tabela e, ao salvar, a linha mostra os novos valores sem recarregar a página
