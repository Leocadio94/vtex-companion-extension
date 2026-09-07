# URL da aba: workspace e flags

Duas coisas que se resolvem reescrevendo a URL e navegando — e é por isso que
moram juntas em `lib/url/`, com a interface numa seção só.

## Workspace: duas formas, e qual vale

A VTEX aceita dizer o workspace de dois jeitos, e qual deles funciona depende do
host:

| Onde | Forma |
| ---- | ----- |
| `{account}.myvtex.com` | subdomínio: `{workspace}--{account}.myvtex.com` |
| domínio próprio da loja | query: `?workspace=dev` |

`switchWorkspace` escolhe pelo host em vez de tentar os dois. No host da
plataforma ele troca o subdomínio **e apaga a query `workspace`**: com as duas
presentes, qual vence depende do serviço que responde, e um empate silencioso é
pior que uma URL feia.

`master` não é um workspace como os outros — é a ausência de prefixo. Voltar para
ele tira o subdomínio, ou tira a query, conforme o caso.

Nome inválido devolve `null` em vez de navegar: `dev workspace` e `dev--acme`
gerariam um host que não existe, e o erro apareceria como página quebrada em vez
de mensagem.

Os recentes ficam em `sync:recentWorkspaces` — preferência, não estado de sessão:
quem usa dois workspaces volta a eles amanhã.

## Flags

`URL_FLAGS` descreve o que a interface oferece; `lib/url/flags.ts` só liga,
troca e desliga. As de liga-desliga (`__siteEditor`, `__disableSSR`,
`__disableRuntimeSSR`) gravam `true`; as de valor (`__bindingAddress`, `sc`) vão
por campo de texto.

A regra que não pode ser quebrada: **o resto da query fica como estava**. A URL
de uma loja carrega termo de busca, paginação, `map` e utm, e perder isso ao
ligar uma flag apagaria justamente o estado que se queria inspecionar. Campo
vazio remove a flag, e a interrogação some junto com o último parâmetro.

`clearFlags` tira só as flags conhecidas — inclusive `workspace`, que tem
controle próprio na interface mas continua sendo uma flag para efeito de limpeza.

## Por que navegar, e não pedir para o usuário

`browser.tabs.update` não pede permissão de host: a extensão já pode navegar a
aba que o usuário abriu. Nada aqui lê a página — a decisão inteira é sobre a URL,
que a extensão já tem.
