## Context

O front chama a API pelo `lib/api-client.ts` com `credentials: "include"`, então cookies gravados pela API (a de teste na mesma origem, ou o gateway em `localhost:8080`) voltam nas próximas chamadas. A página inicial é um componente de servidor que já renderiza o `ServiceList` (cliente) com `useApi`. A API de teste já assina o `admin_session` (HMAC, `lib/server/auth.ts`).

## Goals / Non-Goals

**Goals:**
- Mesmo contrato nos dois modos.
- Nenhum atraso perceptível na página inicial: o cartão carrega em paralelo ao catálogo.

**Non-Goals:**
- Lista histórica de pedidos antigos.
- Login de cliente.

## Decisions

### D1. Cookie gravado pelo servidor, lido só pelo servidor
O front não lê nem grava `my_requests`. O Safari limita a 7 dias cookies gravados por JavaScript, e `HttpOnly` evita que um script da página leia a lista. O front só chama `/mine`.

### D2. Componente cliente na página inicial
`MyRequests` usa `useApi("my-requests", api.myRequests)` e renderiza `null` enquanto carrega, com lista vazia ou com erro. Assim a página não pisca um esqueleto para quem nunca pediu nada.

Alternativa descartada: ler o cookie no servidor do Next e chamar o backend no render. Isso exigiria repassar o cookie do navegador e acoplaria o render ao backend.

### D3. Assinatura na API de teste
HMAC-SHA256 com uma chave aleatória por processo, gerada na primeira chamada. A API de teste não tem segredo de servidor: a sessão assina com a senha de cada conta. Como os pedidos também ficam só em memória, reiniciar o servidor invalida os cookies e os pedidos juntos. O texto assinado leva o prefixo `my-requests:`.

### D5. Redirecionamento uma vez por visita
`MyRequests` chama `router.replace(/agendamento/{id})` com o primeiro pedido da lista, que é o de início mais próximo. O redirecionamento só acontece se a URL não tiver `inicio=1` e se `sessionStorage["lb-mine-redirected"]` ainda não estiver marcado. A marca é gravada antes de redirecionar e também quando a tela de um pedido é aberta: quem acabou de enviar o pedido, ou já o viu nesta aba, não é mandada de volta para ele ao tocar no logo. `replace` evita que o "voltar" do navegador volte para a página inicial e redirecione de novo.

Alternativa descartada: redirecionar no servidor (`proxy.ts`). O cookie tem caminho `/api/appointments` e não chega às páginas, e o servidor do Next teria de chamar o backend.

### D6. Saídas da tela do pedido
"Voltar para o início" leva a `/?inicio=1`.

## Risks / Trade-offs

- **Backend definitivo sem a mudança correspondente:** `/mine` responde 404, e o cartão não aparece (D2). Não há quebra.
- **Aparelho compartilhado:** quem divide o aparelho é levado ao pedido de outra pessoa, que mostra primeiro nome, serviço e horário, os mesmos dados que o link já mostra. O botão "Não é meu pedido" foi retirado a pedido do salão.
- **Página inicial pisca:** ela aparece por um instante antes do redirecionamento, enquanto a consulta responde. Aceito, para não atrasar quem não tem pedido.
