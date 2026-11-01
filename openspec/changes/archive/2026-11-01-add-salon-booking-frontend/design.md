## Context

- Projeto recém-criado: Next.js 16.4.3 (App Router), React 19.3, Tailwind CSS 4, TypeScript. Hoje existe só o template (`app/page.tsx` com "Hello world!").
- `next.config.ts` já ativa `cacheComponents: true` e `partialPrefetching: true`. Nesse modo, tudo o que lê dados em tempo de requisição precisa estar dentro de `<Suspense>` ou ser componente cliente. Sem isso, o build falha no prerender.
- No Next 16, `middleware.ts` foi renomeado para `proxy.ts` (`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). Route Handlers não usam cache por padrão.
- `sharp` já está em `node_modules` (dependência opcional do Next).
- Imagens disponíveis: `docs/referencias/flyer-reinauguracao.png` (print do flyer, 1179 x 2556 px; logo com cerca de 260 px de largura útil) e `public/images/equipe/donas.png` (donas, 2358 x 2084 px, RGBA, 3,6 MB).
- Cores amostradas do flyer: creme `#FBF1E5`, blush `#F6E3D7`, blush profundo `#F1D2C4`, bronze rosé `#A96E58`, cacau `#885640`, café `#502216`, café escuro `#311C10`.
- Requisitos em `specs/*/spec.md`. Motivação em `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Primeira dobra estática (logo, chamada, botão) prerenderizada. Dados de serviços e horários carregados no cliente pela API.
- Lógica de disponibilidade isolada, pura e testável, independente do framework.
- Camada de repositório e de eventos com interface estável, para trocar a memória por banco e plugar a mensageria sem reescrever telas.

**Non-Goals:**
- Persistência, múltiplas instâncias, deploy serverless.
- Envio real de WhatsApp, lembretes agendados, pagamentos.
- Contas de cliente, login por profissional, permissões diferentes por profissional.
- Bloqueio manual de horários (folga, almoço) e feriados. Ficam para uma mudança futura.
- Internacionalização. Só pt-BR.

## Decisions

### 1. Estrutura de pastas

```
app/
  layout.tsx                  fontes, metadata, cores base, lang="pt-BR"
  page.tsx                    tela inicial (shell estático + <ServiceList/> cliente)
  agendar/page.tsx            assistente de agendamento (cliente)
  agendamento/[id]/page.tsx   status do pedido
  admin/login/page.tsx
  admin/(painel)/layout.tsx   barra com contador de pendentes
  admin/(painel)/page.tsx     pendentes
  admin/(painel)/agenda/page.tsx
  admin/(painel)/servicos/page.tsx
  api/...                     Route Handlers (ver spec mock-api)
components/                   UI (Button, DayPicker, SlotGrid, ServiceCard...)
lib/domain/                   tipos, regras de horário, disponibilidade, transições
lib/server/                   store em memória, repositório, eventos, auth
lib/api-client.ts             fetch tipado para a API (usado pelo front)
scripts/generate-logo.mjs     gera PNGs da logo
public/brand/                 logo e ícones gerados (favicon via metadata.icons)
public/images/equipe/         fotos usadas no site
docs/referencias/             flyer e tabelas de preços (referência, não servidos)
proxy.ts                      redireciona /admin sem cookie para /admin/login
```

Alternativa: `src/`. Descartada para manter o padrão já criado pelo template.

### 2. Front acessa só HTTP; dados dinâmicos no cliente
Telas usam `lib/api-client.ts` com base `process.env.NEXT_PUBLIC_API_BASE_URL ?? ""` (mesma origem por padrão). Lista de serviços, dias, horários e admin são componentes cliente com estado de carregamento (skeleton). Isso cumpre o contrato substituível da spec `mock-api` e encaixa no `cacheComponents`: o shell é estático e os dados ficam no cliente.

Alternativa: Server Components lendo o repositório direto. Descartada porque acopla a tela à memória do processo e viola o contrato. Alternativa: Server Component fazendo fetch para a própria API. Descartada porque não funciona no build e duplica o salto de rede.

### 3. Store em memória como singleton em `globalThis`
`lib/server/store.ts` guarda `{ professionals, services, appointments }` em `globalThis.__beautyStore`, inicializado com o seed. Isso evita perder ou duplicar dados no hot reload do `next dev`, onde módulos são reavaliados. O acesso passa por `lib/server/repository.ts` (interface `Repository` com métodos assíncronos), preparando a troca por banco.

Mutação de confirmação é síncrona dentro de um único processo Node. A checagem de conflito e a gravação acontecem sem `await` entre elas, o que evita condição de corrida nesta fase.

### 4. Modelo de dados

```ts
Professional { id, name, active }
Category { id, name, note?, sortOrder }
Service { id, name, categoryId, subcategory?, durationMin,
          durationEstimated: boolean, priceCents: number|null,
          professionalId, active, sortOrder }
Appointment { id, serviceId, professionalId, serviceName, durationMin, priceCents,
              date: "YYYY-MM-DD", time: "HH:mm", startISO, endISO,
              customerName, customerPhoneE164, notes?,
              status: "pending"|"confirmed"|"rejected"|"cancelled",
              createdAt, confirmedAt?, rejectedAt?, cancelledAt?, reason?,
              seenByAdminAt? }
```

O agendamento copia nome, duração, preço e profissional do serviço no momento do pedido. Assim, editar preço ou duração no admin não altera atendimentos já marcados. Preço em centavos inteiros, para evitar erro de arredondamento. A edição de `durationMin` no admin grava `durationEstimated: false`. IDs: `crypto.randomUUID()`. O link público de status usa esse UUID, que não é adivinhável.

### 5. Regras de horário e fuso
- Constantes em `lib/domain/schedule.ts`: `OPEN = "09:00"`, `CLOSE = "20:00"`, `STEP_MIN = 30`, `WORK_DAYS = [1..6]` (seg a sáb), `WINDOW_DAYS = 30`, `TZ = "America/Sao_Paulo"`.
- Datas e horas trafegam como texto local (`date`, `time`). `startISO`/`endISO` usam offset fixo `-03:00`, porque o Brasil não tem horário de verão desde 2019. "Agora" é obtido com `Intl.DateTimeFormat(..., { timeZone: TZ })`, nunca pelo fuso da máquina.
- Disponibilidade (função pura `availableSlots(service, date, confirmedOfProfessional, now)`): gera inícios de `OPEN` até `CLOSE - duração` em passos de 30 min. Remove os passados (no dia de hoje, só a partir do próximo múltiplo de 30 min), domingo e fora da janela. Remove também os que se sobrepõem a algum confirmado da mesma profissional (`a.start < b.end && b.start < a.end`).
- `days` reutiliza a mesma função para cada dia da janela.

### 6. Conflitos e confirmação
- `POST /api/appointments` revalida o horário com a mesma função antes de gravar (409 `SLOT_UNAVAILABLE`).
- `confirm` checa sobreposição só contra confirmados da mesma profissional (409 `SLOT_TAKEN`).
- A marca "Conflito de horário" é calculada na listagem admin: pendente que sobrepõe confirmado (não confirmável) ou outro pendente (confirmável, só aviso). Na UI, o botão "Confirmar" fica desabilitado apenas no primeiro caso.

### 7. Autenticação admin simples
- `ADMIN_PASSWORD` em `.env.local`. Sem ela, o login fica desabilitado e o servidor registra aviso no log.
- `POST /api/admin/login` compara em tempo constante e grava o cookie `admin_session` (`httpOnly`, `sameSite=lax`, `secure` em produção, 12 h). O valor é `exp.assinatura`, com HMAC-SHA256 via Web Crypto e chave derivada de `ADMIN_PASSWORD`.
- `proxy.ts` (matcher `/admin/:path*`, exceto `/admin/login`) faz só a checagem otimista de presença do cookie e redireciona. Cada Route Handler admin valida a assinatura de fato (`requireAdmin()`). Esse é o padrão recomendado na doc do Next 16: o proxy não é solução completa de autorização.

Alternativas: NextAuth/Auth.js, ou uma senha por profissional. Ficam fora porque haverá backend próprio.

### 8. Aviso de novos pedidos por polling
O layout admin consulta `GET /api/admin/appointments/pending-count` a cada 20 s, pausa com a aba oculta (`visibilitychange`) e consulta na volta. O resultado atualiza o contador e o `document.title`. Ao abrir a lista de pendentes, o front chama `POST /api/admin/appointments/mark-seen` para preencher `seenByAdminAt`. Pendentes sem esse campo aparecem marcados "Novo".

Alternativa: SSE ou WebSocket. Descartada nesta fase porque Route Handler com stream e estado em memória aumenta a complexidade sem ganho real para um salão. O backend futuro pode substituir.

### 9. Eventos de domínio
`lib/server/events.ts`: `emit(type, payload)` com lista de assinantes registrada no store global. O assinante padrão faz `console.info("[event]", type, payload)`. Cada assinante roda em `try/catch` e via `queueMicrotask`, sem bloquear a resposta. O backend de mensageria vai registrar seu assinante aqui ou receber os mesmos eventos por fila.

### 10. Validação
Validação manual em `lib/domain/validation.ts`, sem dependência nova. Formato: `{ code: "VALIDATION_ERROR", fields: { campo: mensagem } }`. Telefone: remove não dígitos, aceita 10 ou 11 dígitos, DDD de 11 a 99, e gera `+55…`. Máscara de entrada `(21) 96811-7976` no campo.

Alternativa: Zod. Seria útil, mas é uma dependência de runtime. Pode entrar quando o backend real definir o esquema.

### 11. Identidade visual e tokens
Tokens CSS em `app/globals.css` via `@theme` do Tailwind 4:

```
--color-cream   #FBF1E5   fundo principal
--color-blush   #F6E3D7   cartões, faixas
--color-blush-2 #F1D2C4   bordas suaves, selecionado
--color-rose    #A96E58   ornamentos, ícones, texto grande
--color-cocoa   #885640   botão primário (texto branco)
--color-coffee  #502216   títulos e texto
--color-ink     #311C10   texto de alto contraste
```

Contraste: branco sobre `#A96E58` não atinge 4,5:1. Por isso o bronze rosé fica restrito a ornamento e texto grande. Botões usam `cocoa` ou `coffee`. Os valores de contraste devem ser medidos na implementação (tarefa de verificação), não presumidos.

Fontes via `next/font/google`, auto-hospedadas no build:
- Cinzel: marca e títulos em caixa alta (próxima do "LONGO BUCCO" do flyer).
- Great Vibes: um destaque script por tela (ex.: "Mais que beleza, é sobre você!").
- Lato: corpo e controles. Alta legibilidade em tamanhos grandes.

Base: `html { font-size: 112.5% }` (18 px), botões `min-h-14`, foco visível em `coffee`, ornamentos com linhas finas e coração pequeno como no flyer. Sem sombras pesadas.

### 12. Logo em PNG
O flyer só traz a logo em baixa resolução (cerca de 260 px) e sobre fundo com textura. Por isso a logo será **recriada**, não recortada:
1. A composição (anel em gradiente bronze, círculo interno blush, monograma "LB" com laço, "LONGO BUCCO", "BEAUTY STUDIO" e coração) fica em uma única fonte de verdade, `scripts/generate-logo.mjs`. `components/Logo.tsx` só exibe o PNG via `next/image`. Isso evita duas versões da arte divergindo.
2. `scripts/generate-logo.mjs`: renderiza a composição com `ImageResponse` de `next/og`, que já vem no Next, usando arquivos TTF das fontes OFL salvos em `scripts/fonts/`. Depois `sharp` gera `public/brand/logo.png` (1024 px), `logo-512.png`, `logo-mark.png` (só o monograma), `public/brand/icon.png` (512) e `public/brand/apple-icon.png` (180), declarados em `metadata.icons`, todos com fundo transparente.
3. A tela inicial usa `logo.png` via `next/image` com `priority`.

Fallback: se a profissional fornecer o arquivo original da logo (vetor do designer), ele substitui os PNGs gerados sem mudar código.

### 13. Foto das donas
`public/images/equipe/donas.png` (3,6 MB) é servida por `next/image` com `sizes` pequeno (cerca de 280 px), que converte para WebP/AVIF sob demanda. Fica em cartão blush arredondado na seção "Quem somos", abaixo dos serviços, com legenda dos nomes. O arquivo original não é alterado.

### 14. Seed do catálogo, preços e durações
Serviços, preços e durações estão na tabela da spec `service-catalog`. Fontes:
- Preços de unhas: `docs/referencias/tabela-precos-unhas.jpg`. Preços de tranças: `docs/referencias/tabela-precos-trancas.jpg`. Preço da depilação (R$ 80,00): informado pelo usuário.
- Durações informadas pelo usuário: Manicure 30 min, Pedicure 30 min, Manicure + Pedicure 1 h, Depilação 1 h.
- Demais durações: **ESTIMATIVA**, autorizada pelo usuário. Premissas: tempo típico de mão de obra de uma profissional, arredondado para a grade de 30 min, sem dado do salão. Tranças nagô seguem a referência anterior do usuário (parcial 1 h, completa 2 h), com 4 a 6 tranças interpolado em 1 h 30 min. Confiança baixa; a duração real pode variar cerca de 50% para mais ou para menos, sobretudo nos estilos longos (box braids, goddess). Entram com `durationEstimated: true` e marcação no admin. As donas devem verificar antes do uso real.

Decisões de leitura das tabelas:
- "Goddes Braids" foi grafado como "Goddess braids".
- A terceira linha de "Manutenções" (R$ 110,00, nome ilegível) foi descartada por decisão do usuário.
- "Francesinha: valor à parte" e "Encapsular: + R$ 15,00" viram observação da categoria Unhas, não serviço agendável. A cliente pode pedir na observação do agendamento. Não somam tempo nem preço ao pedido.
- "OBS: somente mão de obra" vira observação da categoria Tranças.
- Ordem de exibição segue a ordem das tabelas (`sortOrder`).

Premissa de nomes: "Mão", "Pé" e "Pé e mão" do pedido original correspondem a Manicure, Pedicure e Manicure + Pedicure da tabela.

### 14a. Edição de valores no admin
A tela `admin/servicos` lista os serviços agrupados como no público. Cada linha tem edição direta de preço (campo com máscara "R$ 0,00", aceita vírgula) e duração (seletor em passos de 30 min, de 30 min a 8 h), com botão "Salvar" por linha. O formulário completo cobre nome, categoria, subcategoria, profissional e ativo. As observações das categorias são editadas no topo de cada grupo. Como o front lê os serviços pela API a cada carregamento, a alteração vale de imediato para a cliente. Na API em memória, as edições também se perdem ao reiniciar o servidor (risco abaixo).

### 15. Testes
`vitest` como devDependency, só para `lib/domain` (grade, disponibilidade, transições, validação de telefone). As telas são verificadas manualmente em viewport de 360 px e com zoom de 200%. Os cenários das specs servem de roteiro.

### 16. PWA
- `app/manifest.ts` (convenção de arquivo do Next): nome, nome curto, `start_url: "/"`, `display: "standalone"`, `background_color`/`theme_color` creme `#FBF1E5`, `lang: "pt-BR"`, ícones `public/brand/icon-192.png`, `icon.png` (512) e `icon-maskable.png` (512, monograma com margem de segurança sobre fundo creme), gerados por `npm run logo`.
- `public/sw.js` escrito à mão, sem dependência: cache-first para `/_next/static/*`, `/brand/*` e fontes; navegação network-first com fallback para `/offline` (pré-cacheada na instalação). Requisições a `/api/*` e métodos diferentes de GET passam direto para a rede, sem cache. A versão do cache fica numa constante; ao ativar, caches antigos são apagados.
- Registro por um componente cliente no layout, só em produção (`NODE_ENV === "production"`). Em `next dev` o service worker atrapalha o hot reload.
- Cabeçalhos de `sw.js` em `next.config.ts` (`Cache-Control: no-cache`, `Content-Type`, CSP `default-src 'self'`), conforme o guia de PWA do Next 16.
- Sem botão próprio de instalação: o guia não recomenda (`beforeinstallprompt` não funciona no Safari iOS), e a instalação automática do navegador basta.
- Push notifications: fora desta fase. Exigem chaves VAPID e backend, que virão com a mensageria.

Alternativa: `next-pwa`/Serwist. Descartada por ser dependência a mais para um cache simples e por exigir configuração de build própria.

## Risks / Trade-offs

- [Dados somem ao reiniciar ou em deploy serverless] → Uso restrito a teste local, aviso no README e no admin ("Modo de teste: dados em memória").
- [Logo recriada diferente da original] → Aprovação visual pelas donas. Fallback com o arquivo original do designer.
- [Fontes do Google exigem rede no build] → Build em máquina com internet. Os TTFs do script de logo ficam versionados em `scripts/fonts/`.
- [Polling atrasa o aviso em até 20 s] → Atende o limite de 30 s da spec. O backend futuro pode usar push.
- [Senha única compartilhada] → Aceitável para teste. O backend definitivo deve ter usuário por profissional.
- [Pendentes não bloqueiam: duas clientes podem pedir o mesmo horário] → Comportamento pedido pelo usuário. O admin mostra "Conflito de horário" e a cliente recusada é avisada pelo status (e, no futuro, por WhatsApp).
- [Durações estimadas erradas bloqueiam a agenda a mais ou a menos] → Marcação "duração estimada" no admin e edição direta. As donas devem revisar antes de divulgar.
- [Edições de preço e duração no admin somem ao reiniciar o servidor] → Limitação da API de teste, avisada na faixa "Modo de teste". O backend definitivo persiste o catálogo.
- [Service worker servindo versão antiga após deploy] → `sw.js` sem cache HTTP, versão de cache trocada a cada mudança e `skipWaiting` + `clients.claim`. Os assets do Next têm hash no nome.
- [21 serviços deixam a tela longa para clientes idosas] → Categorias como blocos grandes, uma aberta por vez, e escolha de categoria antes do serviço no agendamento.

## Migration Plan

Não há dados nem usuários em produção. Ordem: tokens e fontes → logo → domínio com testes → store e API → telas públicas → admin → verificação. Rollback: reverter o commit. Para o backend futuro, implementar os mesmos endpoints, apontar `NEXT_PUBLIC_API_BASE_URL` para ele e remover `app/api` e `lib/server`.

## Open Questions

- Arquivo original da logo (vetor) disponível com o designer? Se existir, substitui os PNGs gerados.
- Texto da seção "Quem somos": será usada uma frase neutra provisória até as donas enviarem o texto delas.
- Instagram `@longobuccobeautystudio` no rodapé: o link entra se as donas confirmarem.
- Nome do serviço de R$ 110,00 ilegível na tabela de manutenções: descartado agora. Se for confirmado depois, as donas cadastram pelo admin.
