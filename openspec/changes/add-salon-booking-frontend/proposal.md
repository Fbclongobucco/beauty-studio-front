## Why

O Longo Bucco Beauty Studio reabriu (flyer de reinauguração em `docs/referencias/flyer-reinauguracao.png`) e hoje as marcações são feitas manualmente pelo WhatsApp. O salão precisa de uma aplicação web simples, pensada para celular e para clientes idosas, onde a cliente veja os serviços e peça um horário livre, e onde as profissionais confirmem cada pedido. O backend definitivo (mensageria e lembretes por WhatsApp) virá depois. Por isso esta fase entrega o front-end completo sobre uma API de teste em memória, com contratos já preparados para a troca.

## What Changes

- Tela inicial mobile-first com a identidade do flyer: fundo creme/blush, bronze rosé, marrom café, tipografia serifada em caixa alta e script pontual. Mostra a logo, a lista de serviços e um botão grande "Agendar".
- Recriação da logo (monograma "LB" em anel + "LONGO BUCCO / BEAUTY STUDIO") em SVG vetorial e exportação para PNG (`public/brand/logo.png`, `logo-512.png`, ícones do app). Uso na tela inicial e como favicon.
- Seção discreta "Quem somos" com a foto das donas (`public/images/equipe/donas.png`, otimizada).
- Catálogo de serviços inicial, extensível sem mudança de código:
  - Unhas, com Stéfani Longo Bucco: 12 serviços em 4 subcategorias (cuidados básicos, esmaltação e tratamento, extensão e decoração, manutenções), com os preços da tabela oficial do salão.
  - Tranças, com Lorrayne Longobuco: tranças nagô por quantidade (1 a 3, 4 a 6, 7 a 12) e estilos (box braids, boxeadora, goddess, fulani, ghana), com os preços da tabela oficial. Aviso "somente mão de obra".
  - Depilação (1 h, R$ 80,00), com Michele Batista.
  - Durações de Manicure, Pedicure, Manicure + Pedicure e Depilação informadas pelo usuário. As demais são **ESTIMATIVA** autorizada pelo usuário, marcadas no admin.
  - Preços, durações e observações das categorias editáveis no painel admin.
- Fluxo de agendamento em passos curtos: serviço → dia → horário → nome e WhatsApp → confirmar. Grade de 30 min, segunda a sábado, das 09h às 20h. O serviço precisa terminar até 20h.
- Disponibilidade calculada por profissional: só agendamentos **confirmados** bloqueiam horário. Pedidos novos ficam "Aguardando confirmação".
- Área admin (`/admin`) protegida por senha simples: aviso de novos pedidos (contador e destaque), confirmar, recusar ou cancelar; agenda do dia por profissional; cadastro e edição de serviços e preços.
- PWA: aplicação instalável na tela inicial do celular (manifest com ícones da logo), service worker com cache dos arquivos estáticos e página "Sem internet". Push notifications ficam para o backend de mensageria.
- API de teste em memória (Route Handlers do Next.js) atrás de uma interface de repositório. Os dados se perdem ao reiniciar o servidor.
- Ganchos de eventos de domínio (`appointment.created`, `appointment.confirmed`, `appointment.cancelled`) sem efeito por enquanto. São o ponto de integração futuro da mensageria e do agendador de WhatsApp.

## Capabilities

### New Capabilities
- `brand-home`: tela inicial, identidade visual derivada do flyer, logo em PNG, foto das donas, requisitos de acessibilidade para público idoso.
- `service-catalog`: serviços, categorias, subcategorias, duração, preço, profissional responsável e status ativo, com exibição pública por categoria e edição de todos os valores pelo admin.
- `appointment-booking`: regras de horário (expediente, grade de 30 min, dias), cálculo de disponibilidade por profissional, fluxo de pedido da cliente e consulta de status.
- `admin-appointments`: acesso protegido, aviso de pedidos pendentes, confirmação, recusa e cancelamento com bloqueio de horário, agenda por profissional.
- `mock-api`: API HTTP de teste em memória, contratos JSON, validação e ganchos de eventos para a integração futura.

### Modified Capabilities
<!-- Nenhuma: não há specs existentes em openspec/specs/. -->

## Impact

- Código: substitui `app/page.tsx` e `app/layout.tsx` (template padrão). Cria rotas `app/(public)/…`, `app/admin/…`, `app/api/…`, `proxy.ts` e `lib/` (domínio, repositório, disponibilidade).
- Configuração: `cacheComponents: true` já ativo em `next.config.ts`. Rotas com dados em memória devem ser dinâmicas (`connection()`/Suspense). Nova variável `ADMIN_PASSWORD` em `.env.local`.
- Dependências: nenhuma de runtime. `sharp` (já presente em `node_modules`) é usado só pelo script de geração da logo PNG. Fontes via `next/font/google`.
- Assets: novos arquivos em `public/brand/`. As imagens originais em `public/images/` permanecem.
- Limitação conhecida: dados em memória não persistem e não funcionam com múltiplas instâncias (serverless). Uso restrito a teste local.
