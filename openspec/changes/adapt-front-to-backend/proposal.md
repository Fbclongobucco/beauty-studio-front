## Why

O backend definitivo (`beauty-studio-backend`) já atende o front sem quebrar contrato, mas acrescentou dados e regras que a interface ainda não usa:
- o WhatsApp da profissional, que ela mesma cadastra para receber o aviso de pedido novo;
- logins criados pelo painel que agora persistem no banco;
- dois códigos de erro novos.

Sem estes ajustes:
- a profissional não tem onde informar o número, e os avisos de pedido novo ficam como "pulados";
- a tela de contas diz que logins "somem ao reiniciar", o que deixa de ser verdade;
- o painel mostra "Modo de teste: dados em memória" mesmo ligado ao backend real.

## What Changes

- **Tipos e cliente da API:**
  - `AdminSession` e `Professional` ganham `whatsappPhone: string | null` (E.164);
  - `AdminAccount.login` aceita `"db"`;
  - `ApiErrorCode` ganha `TOO_MANY_ATTEMPTS` (429) e `SERVICE_UNAVAILABLE` (503), com mensagens amigáveis;
  - novo `api.admin.updateMe({ whatsappPhone })` → `PATCH /api/admin/me`, que devolve a sessão atualizada.
- **Painel da profissional:**
  - bloco "Meu WhatsApp", com máscara, validação e as ações salvar e remover;
  - aviso fixo enquanto o número estiver vazio: "Cadastre seu WhatsApp para receber os pedidos novos".
  - O master não tem esse bloco.
- **Painel do master:** em "Profissionais e logins", o WhatsApp de cada profissional aparece só para leitura, ou "WhatsApp não cadastrado".
- **Tela de contas:**
  - login `"db"` mostra "Login ativo (criado no painel)", sem o aviso de que some ao reiniciar;
  - `"memory"` mantém o aviso, porque continua valendo para a API de teste.
- **Faixa de modo de teste:** removida do painel nos dois modos, a pedido do salão. O aviso de que a API de teste perde os dados ao reiniciar fica só na documentação. Já aplicado no código.
- **Agendamento:** os passos de nome e WhatsApp e de revisão avisam que as atualizações do pedido chegam no WhatsApp informado.
- **Tela do pedido:** sai o botão "Copiar ou compartilhar o link" e o pedido para guardar o link. O link do pedido já chega à cliente nas mensagens de WhatsApp.
- **API de teste (`app/api`):** passa a implementar o mesmo contrato:
  - `PATCH /api/admin/me`;
  - `whatsappPhone` em `GET /api/admin/me` e `GET /api/admin/professionals`;
  - nenhuma mensagem real é enviada.
- Nada é removido nem renomeado. Não há mudança incompatível.

## Capabilities

### New Capabilities
- `professional-whatsapp`: a profissional cadastra o próprio WhatsApp no painel, o master vê o número só para leitura, e há um aviso enquanto o número estiver vazio.

### Modified Capabilities
- `admin-access`:
  - a sessão informa `whatsappPhone`;
  - logins criados pelo master persistem no backend definitivo (`"db"`) e ficam em memória só na API de teste;
  - novo limite de tentativas de login (`TOO_MANY_ATTEMPTS`).
- `appointment-booking`: a cliente é avisada de que as atualizações do pedido chegam no WhatsApp informado, e a tela do pedido deixa de ter o botão de copiar link.
- `mock-api`:
  - `PATCH /api/admin/me` e `whatsappPhone` nas respostas do painel;
  - faixa de modo de teste removida do painel;
  - o front trata `SERVICE_UNAVAILABLE`.

## Impact

- **Código:**
  - `lib/domain/types.ts`, `lib/api-client.ts`;
  - `components/admin/AdminShell.tsx`, `components/admin/ServicesAdmin.tsx`, `components/admin/LoginForm.tsx`;
  - um novo componente `components/admin/MyWhatsApp.tsx`;
  - `components/booking/StepCustomer.tsx`, `components/booking/StepReview.tsx`.
- **API de teste:** `app/api/admin/me/route.ts`, `app/api/admin/professionals/route.ts`, `lib/server/*` (repositório e sessão) e os testes correspondentes.
- **Dependência:** contratos do `beauty-studio-backend`, conforme a seção "Ajustes pendentes no front" do README dele. Não há biblioteca nova.
- **Conflito de arquivos:** a mudança `add-service-photo` está concluída mas ainda não foi commitada nem arquivada, e mexe em `types.ts`, `api-client.ts` e `ServicesAdmin.tsx`. Convém commitá-la ou arquivá-la antes de aplicar esta.
- **Fora do escopo:** `PATCH /api/admin/professionals/{id}` (nome e ativo) do backend fica para outra mudança.
