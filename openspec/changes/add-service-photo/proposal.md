## Why

O catálogo mostra só nome, duração e preço. Para unhas e tranças, a cliente escolhe pelo resultado visual, e hoje ela precisa perguntar ou procurar fotos fora do site. O backend definitivo está sendo implementado agora; o contrato da foto precisa ser fixado no front e na API de teste para os dois lados seguirem o mesmo desenho.

## What Changes

- Cada serviço passa a ter **uma foto opcional** (`photoUrl`, nulo quando não houver).
- O painel admin ganha, no formulário do serviço, a opção de enviar, trocar e remover a foto, com pré-visualização. Na tabela de serviços (≥ 1024 px) aparece uma miniatura.
- A permissão segue a regra do serviço: master em qualquer serviço; profissional só nos próprios (serviço alheio responde 404).
- A cliente vê a foto na lista pública de serviços (com opção de ampliar) e na escolha do serviço no agendamento. Serviço sem foto mantém o layout atual.
- Novos endpoints na API: `PUT /api/admin/services/{id}/photo` (multipart, campo `photo`) e `DELETE /api/admin/services/{id}/photo`. `GET /api/services` e `GET /api/admin/services` passam a trazer `photoUrl`. Mudança aditiva, sem quebra de contrato.
- A API de teste em memória implementa o mesmo contrato e serve as imagens guardadas em memória. Fotos somem ao reiniciar o servidor, como o restante dos dados.
- Formatos aceitos: JPEG, PNG e WebP, até 5 MB por arquivo. O front reduz a imagem antes do envio.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `service-catalog`: novo requisito de cadastro da foto do serviço pelo admin e de exibição da foto para a cliente na lista pública e no agendamento.
- `mock-api`: novo requisito com os endpoints de envio e remoção da foto, validação do arquivo, campo `photoUrl` nas respostas de serviços e armazenamento da imagem em memória.

## Impact

- Tipos: `Service` e `PublicService` em `lib/domain/types.ts` ganham `photoUrl`.
- API de teste: novas rotas em `app/api/admin/services/[id]/photo/` e rota pública para servir a imagem; `lib/server/store.ts`, `lib/server/repository.ts`, `app/api/services/route.ts`; teste de cobertura de rotas em `lib/server/admin-api.test.ts`.
- Cliente HTTP: `lib/api-client.ts` passa a enviar `FormData` (hoje só envia JSON).
- Telas: `components/admin/ServiceForm.tsx`, `components/admin/ServicesAdmin.tsx`, `components/public/ServiceList.tsx`, `components/booking/StepService.tsx`.
- Backend definitivo (`beauty-studio-backend`): precisa implementar os mesmos endpoints, campos e erros descritos nas specs.
- README: contrato da foto e limitação de memória.
- Sem nova dependência.
