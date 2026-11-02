## 1. Domínio e contrato

- [ ] 1.1 `lib/domain/availability.ts`: `daySlots` com `free` e `taken` (D1); `availableSlots` delega para ele
- [ ] 1.2 `availability.test.ts`:
  - confirmado vira ocupado;
  - serviço de 1 h ocupa o início anterior;
  - pendente não ocupa;
  - horário passado fica fora das duas listas;
  - dia fechado vem vazio.
- [ ] 1.3 `lib/domain/types.ts`: `AvailabilityResponse.taken: string[]`

## 2. API de teste

- [ ] 2.1 `app/api/availability/route.ts`: responder `taken`
- [ ] 2.2 Teste da API de teste: confirmado em `taken` e fora de `slots`

## 3. Passo de horário

- [ ] 3.1 `StepTime`:
  - grade com `slots` e `taken ?? []` ordenados (D3, D4);
  - ocupado como botão desabilitado, cinza e com "ocupado" (D2);
  - aviso "Todos os horários deste dia já estão ocupados." com "Escolher outro dia" quando `slots` está vazio e `taken` não;
  - "Sem horários livres neste dia." quando as duas listas estão vazias.

## 4. Verificação

- [ ] 4.1 `npm test` e `npm run lint`
- [ ] 4.2 No navegador, com a API de teste: confirmar um pedido no painel e ver o horário cinza e não clicável na grade da cliente, inclusive pelo teclado
- [ ] 4.3 Com o backend definitivo, depois da mudança correspondente: repetir 4.2
