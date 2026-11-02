## MODIFIED Requirements

### Requirement: Login por usuário e senha
A tela de login SHALL pedir usuário e senha. O usuário MUST ser comparado sem diferenciar maiúsculas e sem espaços nas pontas. Usuário inexistente e senha errada MUST gerar a mesma mensagem, "Usuário ou senha incorretos", sem criar sessão.

Quando a API recusar o login por excesso de tentativas (429 `TOO_MANY_ATTEMPTS`), a tela SHALL mostrar a mensagem recebida da API, ou "Muitas tentativas de login. Aguarde alguns minutos e tente de novo." se a resposta vier sem mensagem, e MUST NOT criar sessão.

#### Scenario: Login da profissional
- **WHEN** a Lorrayne informa o usuário `Lorrayne` e a senha correta
- **THEN** entra no painel e vê "Lorrayne" como pessoa logada

#### Scenario: Usuário inexistente
- **WHEN** alguém informa o usuário `maria`, que não existe
- **THEN** o sistema mostra "Usuário ou senha incorretos", a mesma mensagem da senha errada

#### Scenario: Excesso de tentativas
- **WHEN** a API responde 429 `TOO_MANY_ATTEMPTS` a uma tentativa de login
- **THEN** a tela mostra "Muitas tentativas de login. Aguarde alguns minutos e tente de novo." e continua na tela de login

### Requirement: Identificação da sessão para o front-end
A API SHALL informar ao front-end a conta logada:
- perfil;
- id e nome da profissional, vazios para o master;
- `whatsappPhone` da profissional em E.164, ou `null` (sempre `null` para o master).

O front-end MUST usar essa resposta para montar menus, filtros, o bloco "Meu WhatsApp" e o aviso de número vazio. A segurança MUST continuar garantida pela API, não pela interface.

#### Scenario: Consulta da sessão
- **WHEN** a Lorrayne logada, sem WhatsApp cadastrado, consulta a própria sessão
- **THEN** recebe o perfil `professional`, o id `lorrayne`, o nome "Lorrayne Longobuco" e `whatsappPhone: null`

### Requirement: Logins criados pelo master
O master SHALL poder criar ou trocar, pelo painel, o login de uma profissional cadastrada que não esteja em `ADMIN_USERS`. A senha MUST ter pelo menos 6 caracteres. Conta definida em `ADMIN_USERS` MUST prevalecer e não pode ser alterada pelo painel. A API MUST NOT devolver senhas. Só o master SHALL ter acesso a essa operação.

A origem do login vem no campo `login` da conta:
- `"env"`: definido no ambiente. A tela mostra "Login ativo (senha definida no servidor)".
- `"db"`: criado no painel e guardado no banco do backend definitivo. A tela mostra "Login ativo (criado no painel)", sem aviso de perda ao reiniciar.
- `"memory"`: criado no painel com a API de teste. Some ao reiniciar o servidor, e a tela MUST avisar isso.
- `null`: sem login.

#### Scenario: Login para nova profissional
- **WHEN** o master cadastra a profissional "Ana Souza" e cria o login `ana` com a senha `ana123`
- **THEN** a Ana entra no painel com esse usuário e senha e vê só o próprio trabalho

#### Scenario: Conta do ambiente protegida
- **WHEN** o master tenta trocar pelo painel a senha da `stefani`, definida em `ADMIN_USERS`
- **THEN** a resposta é 400 e a senha continua a do ambiente

#### Scenario: Master renomeado
- **WHEN** `ADMIN_USERNAME` é `admin`
- **THEN** o master entra com o usuário `admin`, e o usuário `master` passa a dar "Usuário ou senha incorretos"

#### Scenario: Login persistido no backend definitivo
- **WHEN** o front está ligado ao backend definitivo e a conta da Ana vem com `login: "db"`
- **THEN** a tela mostra "Login ativo (criado no painel)", sem o texto "some ao reiniciar o servidor"

#### Scenario: Login em memória na API de teste
- **WHEN** o front usa a API de teste e a conta da Ana vem com `login: "memory"`
- **THEN** a tela mostra "Login ativo (criado no painel; some ao reiniciar o servidor)"
