# admin-access Specification

## Purpose

Define as contas do painel do salão, os perfis master e profissional e o escopo de dados de cada perfil. Cada profissional vê e altera só o próprio trabalho, e o master vê e gerencia tudo.

## Requirements

### Requirement: Contas configuradas no ambiente
O painel SHALL ter uma conta master, com o usuário definido em `ADMIN_USERNAME` (padrão `master`) e a senha definida em `ADMIN_PASSWORD`, e uma conta para cada profissional listada em `ADMIN_USERS`, com usuário igual ao id da profissional e uma senha própria. Sem `ADMIN_PASSWORD`, o master MUST ficar desabilitado. Entrada de `ADMIN_USERS` com id de profissional inexistente MUST ser ignorada e avisada no log do servidor.

#### Scenario: Profissional configurada
- **WHEN** `ADMIN_USERS` contém a entrada da `stefani` com senha própria
- **THEN** o usuário `stefani` consegue entrar no painel com essa senha

#### Scenario: Profissional sem senha configurada
- **WHEN** o master cadastra uma nova profissional no painel e ela não está em `ADMIN_USERS`
- **THEN** essa profissional não consegue entrar até o master criar o login dela no painel ou a conta dela ser incluída no ambiente

#### Scenario: Nenhuma conta configurada
- **WHEN** `ADMIN_PASSWORD` e `ADMIN_USERS` estão vazias
- **THEN** a tela de login informa que o login está desabilitado e a API responde 503 `LOGIN_DISABLED`

### Requirement: Login por usuário e senha
A tela de login SHALL pedir usuário e senha. O usuário MUST ser comparado sem diferenciar maiúsculas e sem espaços nas pontas. Usuário inexistente e senha errada MUST gerar a mesma mensagem, "Usuário ou senha incorretos", sem criar sessão.

#### Scenario: Login da profissional
- **WHEN** a Lorrayne informa o usuário `Lorrayne` e a senha correta
- **THEN** entra no painel e vê "Lorrayne" como pessoa logada

#### Scenario: Usuário inexistente
- **WHEN** alguém informa o usuário `maria`, que não existe
- **THEN** o sistema mostra "Usuário ou senha incorretos", a mesma mensagem da senha errada

### Requirement: Sessão identifica a conta
A sessão SHALL identificar a conta e o perfil, expirar em 12 horas e ser invalidada quando a senha dessa conta mudar no ambiente. O painel SHALL mostrar o nome da pessoa logada e a opção "Sair".

#### Scenario: Troca de senha encerra sessão
- **WHEN** a senha da `michele` muda em `ADMIN_USERS` e o servidor reinicia
- **THEN** a sessão aberta da Michele deixa de valer e ela volta para a tela de login

### Requirement: Escopo da profissional
Com perfil profissional, toda leitura e ação do painel e da API admin MUST se limitar aos agendamentos, serviços e ganhos da própria profissional. Filtros de outra profissional enviados pelo cliente MUST ser ignorados. Ação sobre agendamento ou serviço de outra profissional MUST responder 404, sem revelar que o recurso existe.

#### Scenario: Filtro de outra profissional ignorado
- **WHEN** a Stéfani chama a lista de agendamentos com `professionalId=lorrayne`
- **THEN** recebe apenas os agendamentos da Stéfani

#### Scenario: Ação em agendamento alheio
- **WHEN** a Michele tenta confirmar um pedido da Lorrayne pelo id
- **THEN** a resposta é 404 e o pedido não muda

### Requirement: Ações exclusivas do master
Só o master SHALL poder criar ou editar categorias, cadastrar profissionais e ver ou filtrar dados de todas as profissionais. Com perfil profissional, essas operações MUST responder 403 `FORBIDDEN`, e a interface MUST NOT oferecer esses controles.

#### Scenario: Profissional tenta editar categoria
- **WHEN** a Stéfani envia uma alteração da observação da categoria Unhas
- **THEN** a resposta é 403 `FORBIDDEN` e a observação não muda

#### Scenario: Master vê todas
- **WHEN** o master abre a agenda com o filtro "Todas"
- **THEN** vê os agendamentos das três profissionais

### Requirement: Identificação da sessão para o front-end
A API SHALL informar ao front-end a conta logada: perfil, id e nome da profissional (vazio para o master). O front-end MUST usar essa resposta para montar menus e filtros. A segurança MUST continuar garantida pela API, não pela interface.

#### Scenario: Consulta da sessão
- **WHEN** a Lorrayne logada consulta a própria sessão
- **THEN** recebe o perfil `professional`, o id `lorrayne` e o nome "Lorrayne Longobuco"

### Requirement: Logins criados pelo master
O master SHALL poder criar ou trocar, pelo painel, o login de uma profissional cadastrada que não esteja em `ADMIN_USERS`. A senha MUST ter pelo menos 6 caracteres. Esse login MUST ficar só em memória e sumir ao reiniciar o servidor, e a tela MUST avisar isso. Conta definida em `ADMIN_USERS` MUST prevalecer e não pode ser alterada pelo painel. A API MUST NOT devolver senhas. Só o master SHALL ter acesso a essa operação.

#### Scenario: Login para nova profissional
- **WHEN** o master cadastra a profissional "Ana Souza" e cria o login `ana` com a senha `ana123`
- **THEN** a Ana entra no painel com esse usuário e senha e vê só o próprio trabalho

#### Scenario: Conta do ambiente protegida
- **WHEN** o master tenta trocar pelo painel a senha da `stefani`, definida em `ADMIN_USERS`
- **THEN** a resposta é 400 e a senha continua a do ambiente

#### Scenario: Master renomeado
- **WHEN** `ADMIN_USERNAME` é `admin`
- **THEN** o master entra com o usuário `admin`, e o usuário `master` passa a dar "Usuário ou senha incorretos"
