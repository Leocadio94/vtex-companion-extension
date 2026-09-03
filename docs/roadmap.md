# Roadmap

Ideias levantadas e ainda não feitas. Não é compromisso de entrega nem ordem de
execução — é o lugar onde uma ideia fica registrada com o motivo, para não
precisar ser redescoberta. O que já saiu vive no histórico do git.

Cada item traz o tamanho estimado: **P** cabe numa sessão, **M** é uma função
pura com testes mais a interface em volta, **G** precisa de desenho antes.

## Acabamento da interface

O que sobrou do levantamento de layout depois da rodada 1.1.0.

- **Tabela de SKUs, e o fim do `.frames` genérico** (P) — a classe `.frames`
  hoje estiliza quatro listas diferentes: frames do admin, SKUs, vendors e
  origens de terceiros. O nome mente sobre três delas. Junto, a lista de SKUs
  não é escaneável: id, nome, estoque e preço deviam ser colunas, não uma frase
  por linha.
- **Tema explícito e página de opções** (M) — só existe `prefers-color-scheme`.
  Falta escolher claro/escuro/sistema, e não há onde morar a porta do dev
  server, a aba inicial, os presets do usuário e a gestão das origens já
  concedidas.
- **`aria-live` nos status** (P) — "Copiado", o resultado da escrita do cookie e
  o fim de uma requisição mudam a tela sem anunciar nada.
- **Atalhos de teclado** (P) — comando para abrir o popup, `1`–`4` para trocar
  de aba, `/` para focar a URL do runner. Público de desenvolvedor, custo baixo.

## Ferramentas novas

Em ordem de valor por esforço, na minha leitura.

- **Decodificar e editar o `vtex_segment`** (M) — o cookie é base64 de um JSON
  com `channel`, `cultureInfo`, `currencyCode`, `regionId`, `priceTables` e
  `campaigns`. Ler é uma função pura com teste; escrever de volta troca sales
  channel e região sem abrir o DevTools. É o atrito mais frequente do dia a dia.
- **Flags de URL em um clique** (M) — `workspace=`, `__siteEditor=true`,
  `__disableSSR`, `__disableRuntimeSSR`, `__bindingAddress`, `sc=`. Mesmo
  formato de `rewritePreviewUrl`: função pura sobre a URL, com testes.
- **Trocador de workspace** (M) — abrir o mesmo path em outro workspace, com
  lista dos recentes. Depende da mesma função de URL do item acima.
- **Inspector de app e handle** (G) — no IO as classes seguem
  `vtex-{app}-{major}-x-{handle}`: clicar num elemento e saber qual app o
  renderiza. No FastStore, o equivalente com `data-fs-*` e as sections do
  `__NEXT_DATA__`. É o maior diferencial da lista e o que precisa de mais
  desenho, porque envolve seleção de elemento na página.
- **Runner: preencher o que a detecção já sabe** (M) — `{slug}`, `{productId}`,
  `{skuId}` e `{entidade}` são editados à mão hoje. Junto: presets salvos pelo
  usuário em `sync:` e "copiar como cURL".
- **orderForm** (M) — itens, totais, `marketingData`, e limpar o carrinho com
  confirmação. O padrão de confirmação de método inseguro já existe no runner.
- **Copiar relatório da aba** (P) — detecção, template, catálogo, SEO e scripts
  em markdown, para colar num chamado. Função pura sobre o estado, fácil de
  testar.
- **Atalhos de admin por template** (P) — hoje só produto. Faltam categoria,
  a rota no Site Editor ou no CMS, Apps e Workspaces.
- **Mais regras de SEO** (P) — canonical diferente da URL atual, `noindex` em
  domínio de produção, H1 duplicado, `og:image` ausente. `lib/seo/analyze.ts` já
  é função pura: é somar caso e teste.
- **i18n pt/en** (M) — a interface é só português e a listagem é mundial.
  Depende de decidir se o inglês vira o padrão da loja. Não é ajuste de console:
  a Chrome Web Store só oferece os idiomas de listagem que existem como
  `_locales/` no pacote, então traduzir custa uma versão nova e uma revisão nova.
  Interface e listagem têm de sair juntas — listagem em inglês sobre painel em
  português rende review ruim. Ver `docs/publicacao.md`.

## Dívidas encontradas pelo caminho

Coisas que apareceram enquanto se mexia noutra parte, e que ninguém pediu.

- **DevTools sem permissão de host fica sem presets** — o painel não recebe o
  `activeTab` que o popup ganha no clique, então a detecção não roda e
  `isVtex` sai falso. O aviso para conceder acesso aparece logo acima, mas a
  sequência é estranha: a ferramenta parece menor do que é até o clique.
- **Cookie no domínio pai sobrevive ao "Limpar sessão"** — `clearSession` relê e
  avisa quando sobra algo, o que é honesto, mas não resolve. Remover também no
  domínio pai exige decidir até onde subir, e subir demais desloga o usuário de
  onde ele não pediu.
- **As capturas da listagem envelhecem a cada mudança de interface** — cinco
  arquivos em `brand/screenshots/`, exigidos em 1280×800 exatos, refeitos à mão.
  Vale avaliar gerar por script, como a OG image do site já é gerada.
