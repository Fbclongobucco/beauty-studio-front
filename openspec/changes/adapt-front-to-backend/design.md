## Context

O painel carrega a sessão uma vez em `AdminShell` (`api.admin.me()`) e a distribui pelo `AdminCtx`. A mudança precisa deixar o número atualizado em todas as telas sem recarregar a página, e precisa funcionar nos dois modos: API de teste (`app/api`, em memória) e backend definitivo (`NEXT_PUBLIC_API_BASE_URL`).

Peças existentes que serão reaproveitadas:
- validação de telefone: `parsePhoneBR`, `PHONE_MESSAGE`;
- máscara: `maskPhoneInput`;
- formatação: `formatPhone`.

## Goals / Non-Goals

**Goals:**
- Mesmo contrato de `PATCH /api/admin/me` e `whatsappPhone` nos dois modos, para o front não ter caminho especial por backend.
- Atualizar o número sem recarregar: o aviso some na hora em todas as telas.

**Non-Goals:**
- Envio de mensagens na API de teste.
- Edição do número pelo master.
- `PATCH /api/admin/professionals/{id}`.
- Mudança visual além dos blocos e avisos descritos.

## Decisions

### D1. Sessão atualizável no contexto do painel
`AdminCtx` passa a expor `setSession(s: AdminSession)`. O bloco "Meu WhatsApp" chama `api.admin.updateMe` e grava no contexto a sessão que a API devolve. O aviso de número vazio e o próprio bloco leem `session.whatsappPhone` do contexto.

Alternativa descartada: recarregar `me()` depois de salvar. Seria uma chamada a mais, e o aviso piscaria entre as duas respostas.

### D2. Onde fica "Meu WhatsApp"
O bloco fica no topo da página Serviços, que é onde a profissional já mantém os próprios dados, com a âncora `#meu-whatsapp`. O aviso de número vazio fica no `AdminShell`, abaixo do cabeçalho, nos layouts de celular e de computador, e aponta para `/admin/servicos#meu-whatsapp`.

Alternativa descartada: uma página nova "Minha conta". Seria mais um item de menu só para um campo.

### D3. Validação no cliente igual à do servidor
O bloco valida com `parsePhoneBR` antes de enviar e mostra `PHONE_MESSAGE` ao lado do campo. O erro `fields.whatsappPhone` da API também aparece ali, porque o servidor continua sendo a autoridade. Texto vazio no campo não é tratado como remoção ao "Salvar": a remoção tem botão próprio, para evitar apagar o número sem querer.

### D4. API de teste
- `Professional` no store ganha `whatsappPhone: string | null`, com o seed em `null`.
- `repo.updateProfessionalWhatsapp(id, phone | null)` grava o número.
- A sessão (`sessionFor`) lê o número da profissional.
- `PATCH /api/admin/me` responde:
  - 403 para o master;
  - 400 `VALIDATION_ERROR` com `PHONE_MESSAGE` para número inválido;
  - 200 com a sessão atualizada.
- Os presenters públicos continuam mapeando a profissional para `{ id, name }`, então o número não vaza no catálogo.
- Os eventos do log não mudam.

### D5. Faixa de modo de teste
Removida do `AdminShell` nos dois layouts, a pedido do salão (já aplicado). Não é preciso `USING_TEST_API`.

### D6. Mensagens dos códigos novos
O mapa `FRIENDLY` de `api-client.ts` ganha:
- `TOO_MANY_ATTEMPTS`: "Muitas tentativas de login. Aguarde alguns minutos e tente de novo.";
- `SERVICE_UNAVAILABLE`: "Serviço temporariamente indisponível. Tente de novo em instantes.".

A mensagem do corpo da API continua tendo prioridade, como já acontece. `LoginForm` e as ações do painel já mostram `err.message`, então não precisam de código novo.

### D7. Rótulo do login `"db"`
`LoginStatus` em `ServicesAdmin.tsx` trata `"db"` como "Login ativo (criado no painel)" e mantém o formulário de troca de senha, igual a `"memory"`, só que sem o aviso de reinício.

## Risks / Trade-offs

- **Conflito com `add-service-photo`:** essa mudança ainda não foi commitada e mexe nos mesmos arquivos. Mitigação: commitá-la ou arquivá-la antes de aplicar esta (primeira tarefa).
- **Cookie entre portas no desenvolvimento:** front em `localhost:3000` e gateway em `localhost:8080` são o mesmo site para cookies, e o login funciona. Em produção, front e API precisam estar no mesmo site. Isso já está documentado no README do backend e não muda aqui.
- **Sessão em cache após trocar o número em outra aba:** a outra aba só vê o número novo ao recarregar. Aceito: é um campo raramente alterado.
