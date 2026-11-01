## 1. Base do projeto e identidade visual

- [x] 1.1 Ler `node_modules/next/dist/docs/01-app/` (proxy, route handlers, fonts, images, cache components) e anotar diferenças relevantes; verificar ao confirmar que as decisões do design.md seguem válidas
- [x] 1.2 Adicionar `vitest` como devDependency e script `test`; verificar que `npm test` roda (sem testes, saída limpa)
- [x] 1.3 Configurar `app/layout.tsx` com `lang="pt-BR"`, metadata do salão e fontes Cinzel, Great Vibes e Lato via `next/font/google`; verificar no navegador que as três fontes carregam
- [x] 1.4 Definir tokens de cor, tipografia base de 18 px, foco visível e utilitários de ornamento em `app/globals.css` (`@theme`); verificar com página de teste temporária que os tokens aparecem
- [x] 1.5 Criar componentes base acessíveis (`Button`, `Card`, `StepHeader`, `Ornament`, `Spinner`, `ConfirmDialog`) com altura mínima de 48 px; verificar no viewport de 360 px

## 2. Logo e imagens

- [x] 2.1 Baixar os TTFs (licença OFL) de Cinzel e da fonte do monograma para `scripts/fonts/`, com arquivo de licença; verificar que os arquivos existem
- [x] 2.2 Implementar `components/Logo.tsx` (SVG: anel bronze em gradiente, círculo blush, monograma LB, "LONGO BUCCO", "BEAUTY STUDIO", coração); comparar ao lado do recorte do flyer
- [x] 2.3 Implementar `scripts/generate-logo.mjs` (ImageResponse + sharp) e script `npm run logo`; verificar que gera `public/brand/logo.png` (1024), `logo-512.png`, `logo-mark.png`, `public/brand/icon.png` (512) e `public/brand/apple-icon.png` (180), declarados em `metadata.icons` com fundo transparente
- [x] 2.4 Apresentar os PNGs gerados ao usuário para aprovação visual antes de seguir com as telas

## 3. Domínio (lógica pura, com testes)

- [x] 3.1 Criar tipos em `lib/domain/types.ts` (Professional, Category, Service com subcategoria e `durationEstimated`, Appointment com preço e duração copiados, status, erros de API); verificar com `tsc --noEmit`
- [x] 3.2 Implementar `lib/domain/schedule.ts` (constantes, data/hora em America/Sao_Paulo, grade, janela de 30 dias, domingo fechado); testes cobrindo último horário por duração (19:30 para 30 min, 18:00 para 2 h, 13:00 para 7 h) e "hoje às 14:10 → 14:30"
- [x] 3.3 Implementar `availableSlots` e `availableDays` com bloqueio só por confirmados da mesma profissional; testes para os cenários "Confirmado bloqueia", "Outra profissional livre" e "Pendente não bloqueia"
- [x] 3.4 Implementar transições de status (`pending→confirmed|rejected`, `confirmed→cancelled`) e detecção de conflito (com confirmado ou com pendente); testes para transição inválida e para os dois tipos de conflito
- [x] 3.5 Implementar `lib/domain/validation.ts` (nome, telefone BR → E.164, observação até 300, data/hora, duração múltipla de 30 entre 30 e 480, preço em reais "45,00" → 4500 centavos, rejeitando negativo e texto); testes com "9681-7976" inválido e "(21) 96811-7976" → "+5521968117976"
- [x] 3.6 Implementar formatadores pt-BR (preço "R$ 1.234,56", duração "1 hora e 30 minutos", data "sexta-feira, 6 de novembro"); testes unitários

## 4. API de teste em memória

- [x] 4.1 Criar `lib/server/store.ts` (singleton em `globalThis`) e `lib/server/seed.ts` com 3 profissionais, 3 categorias com observação e os 21 serviços da spec `service-catalog` (preços das tabelas, durações ESTIMATIVA com `durationEstimated: true`, ordem das tabelas); conferir o seed linha a linha contra as duas imagens de preços e verificar que o hot reload não duplica nem apaga dados
- [x] 4.2 Criar `lib/server/repository.ts` (interface assíncrona + implementação em memória) e `lib/server/events.ts` (emit, assinante de log, isolamento de falhas); teste de que um assinante com erro não quebra o emit
- [x] 4.3 Implementar `GET /api/services`, `GET /api/availability` e `GET /api/availability/days`; verificar com `curl` as respostas e os 400 de parâmetros inválidos
- [x] 4.4 Implementar `POST /api/appointments` (validação 400, revalidação 409 `SLOT_UNAVAILABLE`, 201 com preço e duração copiados do serviço, evento `appointment.created`) e `GET /api/appointments/[id]` (404 se não existir, sem dados de outras clientes); verificar com `curl`
- [x] 4.5 Implementar `lib/server/auth.ts` (HMAC Web Crypto, cookie 12 h, comparação em tempo constante, `requireAdmin`) e `POST /api/admin/login|logout`; verificar login certo, senha errada e 401 sem cookie
- [x] 4.6 Implementar `GET /api/admin/appointments` (filtros + conflito), `pending-count`, `mark-seen` e `confirm|reject|cancel` (409 `SLOT_TAKEN` e `INVALID_TRANSITION`, eventos); verificar com `curl` o cenário de dois pedidos no mesmo horário
- [x] 4.7 Implementar `GET/POST /api/admin/services`, `PATCH /api/admin/services/[id]` (editar a duração zera `durationEstimated`), `GET /api/admin/categories`, `PATCH /api/admin/categories/[id]` (observação) e `GET/POST /api/admin/professionals`; verificar com `curl` a rejeição de duração de 45 min e de preço negativo, e que editar o preço não altera agendamento existente
- [x] 4.8 Criar `proxy.ts` redirecionando `/admin/*` sem cookie para `/admin/login`; criar `.env.example` com `ADMIN_PASSWORD` e `NEXT_PUBLIC_API_BASE_URL`; verificar o redirecionamento no navegador
- [x] 4.9 Criar `lib/api-client.ts` tipado (base configurável, mapeamento dos erros para mensagens pt-BR); verificar com `tsc --noEmit`

## 5. Telas públicas

- [x] 5.1 Tela inicial `app/page.tsx`: logo PNG, frase de boas-vindas, frase script única, botão "Agendar horário" na primeira dobra; verificar em 360 x 640 px que o botão aparece sem rolar
- [x] 5.2 Componente cliente `ServiceList`: categorias como blocos grandes (uma aberta por vez), observação da categoria, serviços por subcategoria com duração por extenso, preço ou "Consultar valor", skeleton de carregamento e botão "Agendar" por serviço (leva ao assistente com o serviço escolhido); verificar em 360 px a navegação em Unhas e que serviço inativo não aparece
- [x] 5.3 Seção "Quem somos" com a foto via `next/image` (tamanho reduzido, alt descritivo, nomes das profissionais) abaixo dos serviços, e rodapé com endereço e botão de WhatsApp (`https://wa.me/5521968117976`); verificar posição e link
- [x] 5.4 Assistente `app/agendar`: passos 1 (categoria e depois serviço, com preço e duração) e 2 (dia), com botões grandes e "Sem horários" desabilitado; estado no `searchParams` para o "Voltar" do navegador funcionar; verificar que domingo não aparece e que "Voltar" mantém a escolha
- [x] 5.5 Passos 3 (grade de horários) e 4 (nome, WhatsApp com máscara, observação, erros ao lado do campo); verificar a mensagem de telefone sem DDD
- [x] 5.6 Passo 5 (revisão e "Enviar pedido") com tratamento de 409, que volta ao passo 3 com aviso e lista atualizada; verificar simulando a confirmação concorrente via `curl`
- [x] 5.7 Página `app/agendamento/[id]`: resumo, status em texto e cor, explicação "o salão vai confirmar pelo WhatsApp", botão de copiar/compartilhar o link e estado "Agendamento não encontrado"; verificar os dois casos

## 6. Área admin

- [x] 6.1 Tela `admin/login` (campo de senha grande, mensagem "Senha incorreta") e botão "Sair" no painel; verificar o fluxo completo
- [x] 6.2 Layout do painel com navegação (Pedidos, Agenda, Serviços), contador de pendentes com polling de 20 s pausado em aba oculta, `document.title` "(n) Pedidos" e faixa "Modo de teste: dados em memória"; verificar que um novo pedido aparece em até 30 s
- [x] 6.3 Lista de pendentes ordenada pela data do atendimento, marca "Novo", marca "Conflito de horário", ações Confirmar/Recusar com `ConfirmDialog` e motivo opcional; verificar o cenário de dois pedidos às 11:00
- [x] 6.4 Agenda por dia com seletor de data e filtro por profissional, telefone com link `wa.me`, ação Cancelar; verificar que cancelar libera o horário no fluxo público
- [x] 6.5 Tela `admin/servicos`: lista agrupada com marcação "duração estimada", edição direta de preço (máscara R$, vírgula) e duração (passos de 30 min) com "Salvar" por linha, edição da observação de cada categoria; verificar que alterar Manicure para R$ 25,00 aparece no público sem recarregar o servidor
- [x] 6.6 Formulário completo de serviço (nome, categoria e subcategoria novas ou existentes, duração, preço, profissional, ativo) e cadastro de profissional; verificar a criação de "Spa dos pés" (1 h, R$ 45,00) aparecendo no público e no agendamento

## 7. PWA

- [x] 7.1 Gerar `public/brand/icon-192.png` e `icon-maskable.png` (512, margem de segurança, fundo creme) no `npm run logo`; verificar dimensões
- [x] 7.2 Criar `app/manifest.ts` (nome, nome curto, standalone, cores, pt-BR, ícones); verificar `GET /manifest.webmanifest`
- [x] 7.3 Criar `public/sw.js` (cache-first de estáticos, navegação network-first com fallback `/offline`, `/api/*` sempre na rede), página `app/offline/page.tsx`, registro só em produção e cabeçalhos de `sw.js` no `next.config.ts`; verificar com `next build && next start` que o service worker registra e que `/offline` aparece sem rede

## 8. Verificação e documentação

- [x] 8.1 Rodar `npm run lint`, `npm test` e `npm run build` sem erros (inclui o prerender com `cacheComponents`)
- [x] 8.2 Auditoria de acessibilidade em 360 px e com zoom de 200%: medir o contraste dos pares de cor usados (registrar os valores), alvos de toque ≥ 48 px, sem rolagem horizontal, navegação por teclado com foco visível
- [x] 8.3 Percorrer os cenários das 5 specs ponta a ponta (cliente pede → admin vê aviso → confirma → horário some → cliente vê "Confirmado") e registrar o resultado
- [x] 8.4 Atualizar `README.md`: como rodar, `ADMIN_PASSWORD`, `npm run logo`, limitação dos dados em memória, durações ESTIMATIVA a revisar pelo admin, origem dos preços (tabelas em `docs/referencias/`), contratos da API, PWA e eventos para a integração futura de mensageria e WhatsApp
