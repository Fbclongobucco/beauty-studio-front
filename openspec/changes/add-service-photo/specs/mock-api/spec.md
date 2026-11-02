## ADDED Requirements

### Requirement: Foto do serviço na API
A API SHALL expor a foto do serviço com o contrato abaixo, que o backend definitivo MUST seguir.

Campo `photoUrl` (string com URL absoluta ou relativa à origem da API, ou `null`):
- em cada serviço de `GET /api/services`;
- em cada serviço de `GET /api/admin/services`, `POST /api/admin/services` e `PATCH /api/admin/services/{id}`.

A URL MUST mudar quando a foto é trocada, para que caches não mostrem a foto antiga. `PATCH /api/admin/services/{id}` MUST ignorar `photoUrl` no corpo; a foto só muda pelos endpoints abaixo.

Endpoints, só com sessão admin e com o mesmo escopo de `PATCH /api/admin/services/{id}` (serviço de outra profissional: 404 `NOT_FOUND`):
- `PUT /api/admin/services/{id}/photo`: corpo `multipart/form-data` com o arquivo no campo `photo`. Substitui a foto anterior, se houver. Responde 200 com o serviço atualizado.
- `DELETE /api/admin/services/{id}/photo`: remove a foto. Responde 200 com o serviço e `photoUrl: null`. Serviço sem foto também responde 200.

Validação do arquivo: tipo JPEG, PNG ou WebP, conferido pelo conteúdo do arquivo e não só pelo nome ou cabeçalho; tamanho máximo 5 MB. Falha responde 400 `VALIDATION_ERROR` com `fields.photo` em pt-BR. Campo `photo` ausente também responde 400 `VALIDATION_ERROR` com `fields.photo`.

Na API de teste, a imagem SHALL ficar em memória, junto com os demais dados, e SHALL ser servida por GET público com o `Content-Type` do formato. A foto MUST se perder no reinício do servidor, como os demais dados.

#### Scenario: Envio válido
- **WHEN** a sessão da Lorrayne envia `PUT /api/admin/services/box-braids/photo` com um JPEG de 800 KB no campo `photo`
- **THEN** a resposta é 200 com o serviço e `photoUrl` preenchido, e `GET /api/services` traz a mesma `photoUrl` em "Box braids"

#### Scenario: Imagem servida
- **WHEN** um cliente HTTP faz GET na `photoUrl` retornada pela API de teste
- **THEN** a resposta é 200 com os bytes enviados e `Content-Type: image/jpeg`

#### Scenario: Troca muda a URL
- **WHEN** a foto de "Manicure" é substituída por outra
- **THEN** o novo `photoUrl` é diferente do anterior

#### Scenario: Arquivo grande demais
- **WHEN** o `PUT` envia uma imagem de 6 MB
- **THEN** a resposta é 400 `VALIDATION_ERROR` com `fields.photo` "A foto deve ter no máximo 5 MB."

#### Scenario: Tipo inválido com nome de imagem
- **WHEN** o `PUT` envia um PDF renomeado para `foto.jpg`
- **THEN** a resposta é 400 `VALIDATION_ERROR` com `fields.photo` "Envie uma foto em JPEG, PNG ou WebP."

#### Scenario: Serviço de outra profissional
- **WHEN** a sessão da Michele envia `PUT /api/admin/services/manicure/photo`
- **THEN** a resposta é 404 `NOT_FOUND` e a foto de "Manicure" não muda

#### Scenario: Sem sessão
- **WHEN** um cliente HTTP chama `PUT` ou `DELETE /api/admin/services/{id}/photo` sem sessão
- **THEN** a resposta é 401

#### Scenario: Remoção
- **WHEN** o master envia `DELETE /api/admin/services/manicure/photo`
- **THEN** a resposta é 200 com `photoUrl: null` e a URL antiga deixa de servir a imagem

#### Scenario: Reinício do servidor
- **WHEN** o servidor de teste é reiniciado
- **THEN** todos os serviços voltam com `photoUrl: null`
