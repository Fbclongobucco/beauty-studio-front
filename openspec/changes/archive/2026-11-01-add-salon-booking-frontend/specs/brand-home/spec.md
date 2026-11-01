## Purpose

Define a tela inicial pública do Longo Bucco Beauty Studio: identidade visual derivada do flyer de reinauguração, uso da logo em PNG, presença discreta da foto das donas e regras de legibilidade para clientes idosas.

## ADDED Requirements

### Requirement: Identidade visual derivada do flyer
A aplicação SHALL usar a paleta do flyer de reinauguração: fundos creme/blush, bronze rosé como acento e marrom café para títulos e textos. Títulos de marca SHALL usar fonte serifada em caixa alta. A fonte script SHALL aparecer só em destaques curtos (no máximo uma frase por tela).

#### Scenario: Paleta aplicada na tela inicial
- **WHEN** a cliente abre a tela inicial
- **THEN** o fundo é creme/blush, os títulos são marrom café e os botões principais usam bronze rosé ou marrom café com texto claro

#### Scenario: Script restrito a destaque
- **WHEN** qualquer tela pública é renderizada
- **THEN** no máximo um trecho curto usa a fonte script e nenhum texto de instrução, rótulo ou botão usa essa fonte

### Requirement: Logo em PNG na tela inicial
A tela inicial SHALL exibir a logo do salão (monograma "LB" em anel com "LONGO BUCCO" e "BEAUTY STUDIO") a partir de um arquivo PNG com fundo transparente gerado pelo projeto. A mesma marca SHALL servir de ícone da aplicação (favicon e ícone de atalho no celular). A logo SHALL manter proporção e cores originais, sem distorção nem efeitos adicionados.

#### Scenario: Logo visível no topo
- **WHEN** a cliente abre a tela inicial em um celular de 360 px de largura
- **THEN** a logo aparece no topo, centralizada, legível e sem corte

#### Scenario: Arquivos PNG disponíveis
- **WHEN** o projeto é instalado
- **THEN** existem arquivos PNG da logo com fundo transparente em pelo menos 1024 px e 512 px de largura, além do ícone da aplicação

### Requirement: Foto das donas discreta
A tela inicial SHALL exibir a foto das donas em uma seção "Quem somos" abaixo da lista de serviços, em tamanho reduzido, com os nomes das profissionais. A foto MUST ter texto alternativo descritivo e MUST NOT ocupar a primeira dobra da tela.

#### Scenario: Foto abaixo dos serviços
- **WHEN** a cliente rola a tela inicial
- **THEN** a seção "Quem somos" com a foto aparece depois da lista de serviços e do botão "Agendar"

### Requirement: Tela inicial simples
A tela inicial SHALL mostrar, nesta ordem: logo, frase curta de boas-vindas, botão principal "Agendar horário", lista de serviços agrupada por categoria, seção "Quem somos" e rodapé com endereço (Rua Itaboraí, nº 19, Heliópolis, Belford Roxo) e botão de contato pelo WhatsApp do salão ((21) 96811-7976).

#### Scenario: Ação principal na primeira dobra
- **WHEN** a cliente abre a tela inicial em um celular de 360 x 640 px
- **THEN** o botão "Agendar horário" está visível sem rolar

#### Scenario: Contato pelo WhatsApp
- **WHEN** a cliente toca no botão de WhatsApp do rodapé
- **THEN** abre uma conversa com o número (21) 96811-7976

### Requirement: Mobile first e acessível para clientes idosas
As telas públicas SHALL ser projetadas primeiro para celular (a partir de 360 px) e adaptadas para telas maiores. O texto de corpo MUST ter pelo menos 18 px. Áreas de toque MUST ter pelo menos 48 x 48 px. O contraste entre texto e fundo MUST atender WCAG 2.1 AA. Botões MUST ter rótulo em texto, não só ícone. As telas MUST NOT ter rolagem horizontal nem limite de tempo para preencher.

#### Scenario: Texto e botões legíveis
- **WHEN** qualquer tela pública é aberta em um celular de 360 px
- **THEN** o texto de corpo tem pelo menos 18 px, os botões têm pelo menos 48 px de altura e não há rolagem horizontal

#### Scenario: Zoom do navegador
- **WHEN** a cliente amplia o texto do navegador para 200%
- **THEN** o conteúdo continua legível e operável, sem sobreposição

### Requirement: Aplicativo instalável (PWA)
A aplicação SHALL ser instalável como PWA: manifest com nome "Longo Bucco Beauty Studio", nome curto "Longo Bucco", ícones da logo (192 px, 512 px e versão maskable), cores creme da identidade, idioma pt-BR e abertura em modo standalone na tela inicial. Um service worker SHALL guardar em cache os arquivos estáticos (scripts, estilos, fontes, logo) e mostrar uma página "Sem internet" com o contato do WhatsApp quando a navegação falhar por falta de conexão. Respostas da API MUST NOT ser servidas do cache: horários e agendamentos são sempre buscados na rede.

#### Scenario: Instalação no celular
- **WHEN** a cliente abre o site no Chrome do Android por HTTPS
- **THEN** o navegador oferece "Instalar app" e, depois de instalado, o ícone com a logo abre a tela inicial sem a barra do navegador

#### Scenario: Sem conexão
- **WHEN** a cliente abre o app instalado sem internet
- **THEN** vê a página "Sem internet" com o botão do WhatsApp do salão, e nenhum horário antigo é exibido como disponível
