# Segmento (`vtex_segment`)

O cookie que decide o que a loja mostra: sales channel, moeda, cultura, região e
tabela de preço. Trocar isso pelo DevTools é abrir a aba de aplicação, achar o
cookie, decodificar o base64 na mão, editar, reencodar e colar de volta. A aba
**Loja** faz as quatro etapas do meio.

## O formato

Base64 de um JSON plano. Três detalhes que quebram uma implementação ingênua, e
que por isso têm teste em `lib/segment/segment.test.ts`:

- **Percent-encoding.** O valor costuma chegar com `%3D` no lugar do `=` do
  padding, dependendo de quem gravou. `decodeSegment` desfaz antes de decodificar.
- **Base64url sem padding.** Algumas gravações usam `-`/`_` e cortam o `=`.
- **UTF-8.** `currencySymbol` é `R$`. `atob`/`btoa` só falam latin-1, então o
  ciclo passa por `TextEncoder`/`TextDecoder`; sem isso a moeda volta corrompida
  da primeira ida e volta, e o valor corrompido é gravado como se fosse válido.

Campo vazio vira `null`, nunca `""`: é o que a plataforma grava quando não há
região ou tabela de preço, e a loja trata string vazia como valor presente.

Chave desconhecida é preservada. A VTEX acrescenta campo sem avisar, e um editor
que só conhece cinco chaves apagaria as outras ao gravar.

## Por que gravar o cookie direto

A alternativa era `POST /api/sessions` de dentro da aba, pela Session Manager,
que é o caminho oficial: a loja regeraria o `vtex_segment` a partir da sessão, e
o valor sobreviveria à navegação.

Ficou de fora porque depende da loja: a Session Manager só grava os campos que a
conta declara como públicos, e a rota precisa estar exposta naquela origem. O que
a extensão pode prometer sem saber a configuração da conta é o cookie — ela edita
o que está lá, com os campos que estão lá.

O preço de gravar direto está dito na interface: a Session Manager pode
reescrever o cookie na navegação seguinte. Quando isso acontece, o valor volta ao
anterior — não é falha da escrita.

## `httpOnly` não

`lib/auth/cookie.ts` grava a credencial com `httpOnly: true`, espelhando o cookie
real. O `vtex_segment` é o contrário: o JavaScript da vitrine **lê** esse cookie
para montar preço e catálogo. Gravá-lo httpOnly deixa a loja cega para o próprio
segmento — a página passa a se comportar como se não houvesse segmento nenhum.

É por isso que a escrita mora em `lib/segment/write.ts` e não ganhou um parâmetro
em `writeAuthCookie`: são dois cookies com regras opostas, e uma função com um
booleano `httpOnly` seria um convite a errar o default.
