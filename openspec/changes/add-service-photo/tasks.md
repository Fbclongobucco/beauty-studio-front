## 1. Domínio e tipos

- [x] 1.1 Adicionar `photoUrl: string | null` a `Service` e `PublicService` em `lib/domain/types.ts` e `photoUrl: null` aos serviços de `lib/server/seed.ts`; verificar com `npx tsc --noEmit` sem erros
- [x] 1.2 Criar `detectImageType(bytes)` em `lib/domain/` (JPEG, PNG, WebP por assinatura; `null` para o resto) e as constantes de limite (5 MB) e mensagens; verificar com teste Vitest cobrindo os três formatos, PDF renomeado e arquivo vazio

## 2. API de teste

- [x] 2.1 Incluir `photos: Map` no `Store` e `setServicePhoto`, `removeServicePhoto` e `getPhoto` no `Repository`, gerando `photoUrl` `/api/service-photos/{uuid}` e apagando a foto anterior na troca/remoção; verificar com teste em `lib/server/repository.test.ts` (troca muda a URL, remoção zera e apaga do mapa, `resetStore` volta a `null`)
- [x] 2.2 Criar `app/api/admin/services/[id]/photo/route.ts` com `PUT` (multipart, campo `photo`, validação de tamanho e tipo, escopo igual ao `PATCH`) e `DELETE`; verificar com testes em `lib/server/admin-api.test.ts` para os cenários do spec mock-api (envio válido, 6 MB, PDF renomeado, campo ausente, serviço alheio 404, sem sessão 401, remoção) e com a rota incluída em `ROUTES`
- [x] 2.3 Criar `app/api/service-photos/[photoId]/route.ts` (GET público com `Content-Type` detectado, `Cache-Control` imutável, 404 se ausente); verificar com teste que os bytes e o tipo voltam iguais ao enviado e que URL removida responde 404
- [x] 2.4 Incluir `photoUrl` em `GET /api/services` (`app/api/services/route.ts`) e garantir que `PATCH /api/admin/services/{id}` ignora `photoUrl` no corpo; verificar com teste de API

## 3. Cliente HTTP e utilitários do navegador

- [x] 3.1 Fazer `request` em `lib/api-client.ts` aceitar `FormData` sem `content-type` fixo, adicionar `api.admin.setServicePhoto(id, blob)`, `api.admin.removeServicePhoto(id)` e o helper `photoSrc(url)` que prefixa `NEXT_PUBLIC_API_BASE_URL` em URL relativa; verificar com `npm run lint` e `npx tsc --noEmit`
- [x] 3.2 Criar helper em `lib/client/` que reduz a imagem para lado maior de 1600 px e exporta JPEG 0,85 via `<canvas>`, rejeitando arquivo não decodificável; verificar manualmente no navegador com uma foto de câmera acima de 5 MB (blob resultante abaixo de 5 MB)

## 4. Painel admin

- [x] 4.1 Adicionar ao `ServiceForm` o campo de foto (`<input type="file" accept="image/jpeg,image/png,image/webp">`), pré-visualização, "Trocar foto" e "Remover foto", com estado `keep | novo | remove` e revogação do `previewUrl` ao cancelar/desmontar; verificar no navegador que "Cancelar" não altera a foto
- [x] 4.2 Gravar a foto após salvar o serviço (criar e editar), com mensagem "Serviço salvo, mas a foto não foi enviada. Tente de novo." e reenvio só da foto no próximo "Salvar"; verificar no navegador simulando falha (rede offline no DevTools após salvar os dados)
- [x] 4.3 Adicionar a coluna "Foto" com miniatura de 40 px na tabela de `ServicesAdmin` (≥ 1024 px) e atualizar a linha após salvar sem recarregar; verificar a 1280 px e o layout de celular inalterado a 390 px

## 5. Exibição para a cliente

- [x] 5.1 Mostrar miniatura de 64 px em `components/public/ServiceList.tsx`, com botão "Ver foto de {serviço}" que abre `<dialog>` ampliado com "Fechar", `alt` com o nome e `onError` ocultando a imagem; verificar a 390 px com serviço com foto, sem foto e com URL quebrada
- [x] 5.2 Mostrar a miniatura dentro do botão do serviço em `components/booking/StepService.tsx`, sem ampliação; verificar que um toque continua selecionando o serviço e que serviço sem foto mantém o layout

## 6. Documentação e verificação final

- [x] 6.1 Documentar no README o contrato da foto (endpoints, campo `photo`, limites, `photoUrl`) e que as fotos da API de teste somem ao reiniciar; verificar leitura da seção
- [x] 6.2 Rodar `npm test`, `npm run lint` e `npm run build` sem falhas e percorrer o fluxo completo (profissional envia foto → aparece na lista pública e no agendamento → master troca → profissional remove)
