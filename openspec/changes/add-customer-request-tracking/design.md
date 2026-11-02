## Context

O front chama a API pelo `lib/api-client.ts` com `credentials: "include"`, então cookies gravados pela API (a de teste na mesma origem, ou o gateway em `localhost:8080`) voltam nas próximas chamadas. A página inicial é um componente de servidor que já renderiza o `ServiceList` (cliente) com `useApi`. A API de teste já assina o `admin_session` (HMAC, `lib/server/auth.ts`).

## Goals / Non-Goals

**Goals:**
- Mesmo contrato nos dois modos.
- Nenhum atraso perceptível na página inicial: o cartão carrega em paralelo ao catálogo.

**Non-Goals:**
- Redirecionamento automático para o pedido.
- Lista histórica de pedidos antigos.
- Login de cliente.

## Decisions

### D1. Cookie gravado pelo servidor, lido só pelo servidor
O front não lê nem grava `my_requests`. O Safari limita a 7 dias cookies gravados por JavaScript, e `HttpOnly` evita que um script da página leia a lista. O front só chama `/mine`.

### D2. Componente cliente na página inicial
`MyRequests` usa `useApi("my-requests", api.myRequests)` e renderiza `null` enquanto carrega, com lista vazia ou com erro. Assim a página não pisca um esqueleto para quem nunca pediu nada.

Alternativa descartada: ler o cookie no servidor do Next e chamar o backend no render. Isso exigiria repassar o cookie do navegador e acoplaria o render ao backend.

### D3. Assinatura na API de teste
O helper reaproveita o HMAC do `admin_session`, com prefixo de propósito `my-requests`, para o token de um não valer como o outro. O segredo é o mesmo da sessão de teste.

### D4. "Não é meu pedido" otimista
O pedido sai do cartão na hora. Se o DELETE falhar, volta, com a mensagem "Não foi possível esconder o pedido. Tente de novo." no próprio cartão.

## Risks / Trade-offs

- **Backend definitivo sem a mudança correspondente:** `/mine` responde 404, e o cartão não aparece (D2). Não há quebra.
- **Aparelho compartilhado:** mostra primeiro nome, serviço e horário, os mesmos dados que o link já mostra. Mitigação: "Não é meu pedido".
