## ADDED Requirements

### Requirement: Foto do serviço
Cada serviço SHALL ter no máximo uma foto, opcional. No formulário de criação e edição do serviço, o admin SHALL poder enviar, trocar e remover a foto, vendo a pré-visualização antes de salvar. A foto SHALL ser gravada junto com o salvamento do serviço; cancelar o formulário MUST NOT alterar a foto. A permissão segue a do serviço: com perfil master, em qualquer serviço; com perfil profissional, só nos próprios serviços. Formatos aceitos: JPEG, PNG e WebP. Arquivo de outro tipo MUST ser recusado com a mensagem "Envie uma foto em JPEG, PNG ou WebP.". A troca ou remoção SHALL valer de imediato na lista pública e no agendamento.

#### Scenario: Envio de foto em serviço existente
- **WHEN** a Lorrayne abre "Box braids", escolhe uma foto JPEG e salva
- **THEN** a foto aparece na pré-visualização do formulário e, depois de salvar, na lista pública em "Box braids"

#### Scenario: Foto em serviço novo
- **WHEN** a Stéfani cadastra "Spa dos pés" com uma foto e salva
- **THEN** o serviço é criado com a foto

#### Scenario: Troca de foto
- **WHEN** o master envia uma nova foto para "Manicure", que já tinha foto, e salva
- **THEN** só a nova foto fica associada ao serviço

#### Scenario: Remoção de foto
- **WHEN** a profissional toca em "Remover foto" em "Pedicure" e salva
- **THEN** o serviço fica sem foto e a lista pública volta a mostrar "Pedicure" sem imagem

#### Scenario: Cancelar sem salvar
- **WHEN** a profissional escolhe uma foto e toca em "Cancelar"
- **THEN** o serviço continua com a foto anterior, ou sem foto

#### Scenario: Arquivo inválido
- **WHEN** a profissional escolhe um arquivo PDF
- **THEN** o sistema recusa e mostra "Envie uma foto em JPEG, PNG ou WebP."

#### Scenario: Falha no envio da foto
- **WHEN** os dados do serviço são salvos e o envio da foto falha
- **THEN** o formulário continua aberto, informa que o serviço foi salvo mas a foto não, e permite tentar de novo

#### Scenario: Miniatura na tabela do admin
- **WHEN** o master abre a tela de serviços numa tela de 1280 px
- **THEN** cada linha mostra a miniatura da foto, ou um espaço vazio quando o serviço não tem foto

### Requirement: Foto exibida para a cliente
Na lista pública de serviços e na escolha do serviço no agendamento, cada serviço com foto SHALL mostrar a miniatura ao lado do nome, com texto alternativo igual ao nome do serviço. Na lista pública, ao tocar na miniatura, a cliente SHALL ver a foto ampliada, com botão "Fechar". Serviço sem foto MUST manter o layout atual, sem imagem genérica. Foto que não carregar MUST ser ocultada sem quebrar o item.

#### Scenario: Serviço com foto na lista pública
- **WHEN** a cliente abre a categoria Tranças e "Box braids" tem foto
- **THEN** vê a miniatura ao lado de "Box braids", com nome, duração e preço

#### Scenario: Ampliar foto
- **WHEN** a cliente toca na miniatura de "Box braids"
- **THEN** a foto abre ampliada e o botão "Fechar" a fecha, voltando à lista

#### Scenario: Foto no agendamento
- **WHEN** a cliente está no passo 1 do agendamento, categoria Unhas, e "Manicure" tem foto
- **THEN** o botão de "Manicure" mostra a miniatura e continua selecionando o serviço com um toque

#### Scenario: Serviço sem foto
- **WHEN** "Depilação" não tem foto
- **THEN** o item aparece como hoje, sem imagem e sem espaço reservado

#### Scenario: Foto indisponível
- **WHEN** a URL da foto de um serviço não responde
- **THEN** a miniatura é ocultada e o item continua com nome, duração, preço e "Agendar"
