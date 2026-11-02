## Context

- O front acessa dados só por HTTP (`lib/api-client.ts`), e a API de teste em `app/api` guarda tudo em memória (`lib/server/store.ts`, singleton em `globalThis`). O backend definitivo (`beauty-studio-backend`) ainda não tem código; ele vai implementar o contrato descrito em `specs/mock-api/spec.md`.
- O cliente HTTP hoje só envia JSON (`json` → `JSON.stringify` + `content-type: application/json`).
- O formulário de serviço (`components/admin/ServiceForm.tsx`) é o mesmo no celular (cards) e no computador (painel lateral da tabela) e cria a categoria nova antes do serviço, em chamadas sequenciais.
- O `proxy.ts` só cobre `/admin/*`; as rotas `/api/*` não passam por ele, então o limite de corpo do proxy (`proxyClientMaxBodySize`) não afeta o upload. Route Handlers leem multipart com `request.formData()` (doc `03-file-conventions/route.md`).
- O service worker nunca cacheia `/api/*` (`public/sw.js`).
- Requisitos: ver `specs/service-catalog/spec.md` e `specs/mock-api/spec.md`.

## Goals / Non-Goals

**Goals:**
- Contrato de foto estável, fácil de reproduzir no backend definitivo.
- Envio leve a partir de celular, sem depender de rede boa para fotos de 5–10 MB tiradas pela câmera.

**Non-Goals:**
- Galeria com várias fotos por serviço.
- Recorte ou edição da imagem no painel.
- Persistência das fotos na API de teste além do processo.
- Otimização de imagem pelo servidor (`next/image`, CDN, variações de tamanho).

## Decisions

### 1. Endpoint dedicado `PUT/DELETE /api/admin/services/{id}/photo`, multipart
O arquivo vai em `multipart/form-data`, campo `photo`, separado do `PATCH` JSON do serviço.
- Por quê: mantém o `PATCH` e a validação atual (`validateServiceInput`) intactos; `PUT` expressa "substitui a única foto"; o backend definitivo implementa com qualquer framework sem acoplar upload ao JSON.
- Alternativa descartada: base64 dentro do JSON do `PATCH` (corpo ~33% maior, validação misturada). URL pré-assinada foi descartada pelo usuário nesta fase.

### 2. `photoUrl` opaco e versionado
A API devolve a URL pronta; o front só a usa em `<img src>`. Na API de teste, cada envio gera um id novo (`crypto.randomUUID()`) e a URL é `/api/service-photos/{photoId}`. Trocar a foto gera outro id; a anterior é descartada da memória e passa a responder 404.
- Por quê: o backend definitivo pode devolver URL de storage/CDN sem mudar o front; URL nova a cada troca evita cache com foto antiga, então a rota de imagem pode responder com `Cache-Control: public, max-age=31536000, immutable`.
- Com `NEXT_PUBLIC_API_BASE_URL` preenchido e URL relativa, o front prefixa a base (helper `photoSrc` em `lib/api-client.ts`), igual às demais chamadas.

### 3. Armazenamento em memória
`Store` ganha `photos: Map<string, { bytes: Uint8Array; contentType: string }>`, indexado pelo `photoId`. `Service` recebe `photoUrl: string | null` (seed com `null`); `PublicService` também. O `Repository` ganha `setServicePhoto(id, bytes, contentType)`, `removeServicePhoto(id)` e `getPhoto(photoId)`; trocar ou remover apaga a entrada anterior do mapa.
- A rota pública `GET /api/service-photos/[photoId]` fica fora de `/api/admin`, então não entra no teste de cobertura de rotas admin; as rotas `services/[id]/photo` entram em `ROUTES` de `lib/server/admin-api.test.ts`.
- `PATCH` ignora `photoUrl`: `validateServiceInput` não conhece o campo, então nada muda nele.

### 4. Validação por assinatura do arquivo
Função pura `detectImageType(bytes)` em `lib/domain/` (com teste): JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`, WebP `RIFF....WEBP`. O `Content-Type` salvo vem da detecção, não do cliente. Limite de 5 MB checado no `File.size` antes de ler os bytes.
- Por quê: o spec exige recusar PDF renomeado; o header `X-Content-Type-Options: nosniff` já configurado em `next.config.ts` reforça que o navegador respeite o tipo servido.
- Mensagens: "Envie uma foto em JPEG, PNG ou WebP." e "A foto deve ter no máximo 5 MB.". Campo ausente: "Escolha uma foto.".

### 5. Redução no navegador antes do envio
No admin, a imagem escolhida é desenhada em `<canvas>` com lado maior de até 1600 px e exportada em JPEG qualidade 0,85 (helper em `lib/client/`). Se o navegador não conseguir decodificar o arquivo (ex.: HEIC em alguns aparelhos), o formulário mostra a mensagem de formato inválido sem enviar.
- Por quê: fotos de câmera passam de 5 MB com frequência; reduzir no cliente evita rejeição e acelera o envio em rede móvel. Sem dependência nova.
- Alternativa descartada: só validar e recusar acima de 5 MB (piora a experiência das profissionais).
- O servidor continua validando tipo e tamanho; o backend definitivo não pode confiar na redução do front.

### 6. Fluxo no formulário: foto gravada depois do serviço
Estado local da foto: `keep | { file, previewUrl } | remove`. No "Salvar": cria/atualiza o serviço (fluxo atual) e, em seguida, chama `PUT` ou `DELETE` da foto, se houve mudança. Se a segunda chamada falhar, o serviço já está salvo: o formulário mostra "Serviço salvo, mas a foto não foi enviada. Tente de novo." e o próximo "Salvar" reenvia só a foto (o serviço criado passa a ser tratado como edição). "Cancelar" descarta o estado e revoga o `previewUrl`.
- Alternativa descartada: enviar a foto no ato da escolha (alteraria o serviço antes do "Salvar", contra o spec de cancelar).

### 7. `api-client` aceita `FormData`
`request` ganha suporte a `body: FormData` sem definir `content-type` (o navegador gera o boundary). Novos métodos `api.admin.setServicePhoto(id, blob)` e `api.admin.removeServicePhoto(id)`.

### 8. Exibição
- Miniatura quadrada, 64 px no celular, `object-cover`, cantos arredondados, `loading="lazy"`, `alt` = nome do serviço; `onError` oculta a imagem.
- Lista pública: a miniatura é um botão "Ver foto de {serviço}" que abre um `<dialog>` com a foto ampliada e botão "Fechar" (alvo mínimo de 48 px, coerente com o público idoso).
- Agendamento (`StepService`): miniatura dentro do botão do serviço, sem ampliação, para não competir com a seleção.
- Tabela do admin: coluna "Foto" com miniatura de 40 px.
- `<img>` simples, não `next/image`: a origem das fotos do backend definitivo ainda não é conhecida, e `remotePatterns` exigiria configurar domínio.

## Risks / Trade-offs

- [Memória do processo cresce com fotos na API de teste] → redução no cliente mantém cada foto em centenas de KB; fotos trocadas são descartadas; limite de 5 MB no servidor.
- [Backend definitivo divergir do contrato] → contrato completo em `specs/mock-api/spec.md`, incluindo códigos de erro e mensagens; teste de rota cobrindo cada cenário serve de referência.
- [Falha parcial: serviço salvo sem foto] → mensagem explícita e reenvio só da foto (Decisão 6).
- [HEIC/iPhone não decodificado em alguns navegadores] → mensagem de formato; a câmera do iOS entrega JPEG quando o `<input accept>` limita os tipos.
- [Perda de qualidade pela reexportação em JPEG] → 1600 px e qualidade 0,85 bastam para miniatura e ampliação em celular; PNG com transparência perde o fundo transparente, aceitável para fotos de serviço.

## Migration Plan

Mudança aditiva: clientes antigos ignoram `photoUrl`. Sem migração de dados (memória). Rollback: reverter o commit; o backend definitivo pode publicar os endpoints antes ou depois do front, já que serviço sem foto mantém o layout atual.

## Open Questions

- Tamanho máximo e formatos (5 MB; JPEG, PNG, WebP) foram adotados como padrão de mercado nesta proposta. Confirmar com o backend definitivo; mudar o número altera só a constante e a mensagem.
