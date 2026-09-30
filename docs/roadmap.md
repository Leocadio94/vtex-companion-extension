# Roadmap

Ideias levantadas e ainda não feitas. Não é compromisso de entrega nem ordem de
execução — é o lugar onde uma ideia fica registrada com o motivo, para não
precisar ser redescoberta. O que já saiu vive no histórico do git.

Cada item traz o tamanho estimado: **P** cabe numa sessão, **M** é uma função
pura com testes mais a interface em volta, **G** precisa de desenho antes.

## Acabamento da interface

O que sobrou do levantamento de layout depois da rodada 1.1.0.

- **Tema explícito e página de opções** (M) — só existe `prefers-color-scheme`.
  Falta escolher claro/escuro/sistema, e não há onde morar a porta do dev
  server, a aba inicial, os presets do usuário e a gestão das origens já
  concedidas.
- **Atalhos de teclado** (P) — comando para abrir o popup, `1`–`4` para trocar
  de aba, `/` para focar a URL do runner. Público de desenvolvedor, custo baixo.
- **Terminologia do "Abrir"** (P) — o rótulo significa três coisas (workspace,
  preview, admin). O critique de 29/09/2026 sugeriu "Abrir no admin" e
  "Abrir preview" como desambiguação.

## Acabamento da interface — rodada 1.3.0

Feito no pente-fino de acabamento com o critique e o audit do impeccable
(`.impeccable/critique/2026-09-29-*.md`, score 28/40 e 12/20):

- Tabela de SKUs e fim do `.frames` genérico (aqui desta lista, entregue na
  rodada).
- `aria-live`/`role="status"` nos resultados (banner de risco, resposta do
  runner, status de sessão e segmento), `role="tablist"` na nav e
  `aria-pressed` no segmentado Formado/Raw.
- Contraste AA no tema claro: `--accent-strong` `#e50e59` para fundo de
  botão/badge e `--accent-text` para accent como texto (nav ativa, flag
  "copiado"). O rosa oficial `#f71963` continua na marca e nos detalhes.
- Alvos de toque: 44px em `pointer: coarse` (chips, histórico, segmentado,
  linha copiável) e 24px fora do touch, mais indicador estático de "copiar"
  no touch, onde não há hover.
- Confirmação em dois passos no `Limpar sessão`, no padrão do runner.
- Labels acessíveis nos campos do runner e do token, `aria-label` no replay.
- Seção Tags encurtada: Title/Description truncados com expansão, contadores
  atrás de `<details>`.
- `useMemo` no pretty JSON e `memo` no JsonView (re-render a cada tecla).
- Paletas `.pill-*` e `.json-*` em tokens; `.tone-error` com borda de 1px nos
  quatro lados (o detector do impeccable marcava o border-left como tell de
  callout de IA).
- "Gravar JSON" unificado com "Aplicar" ("Aplicar JSON").

## Ferramentas novas

Em ordem de valor por esforço, na minha leitura.

- **Inspector de app e handle** (G) — no IO as classes seguem
  `vtex-{app}-{major}-x-{handle}`: clicar num elemento e saber qual app o
  renderiza. No FastStore, o equivalente com `data-fs-*` e as sections do
  `__NEXT_DATA__`. É o maior diferencial da lista e o que precisa de mais
  desenho, porque envolve seleção de elemento na página.
- **Runner: preencher o que a detecção já sabe** (M) — `{slug}`, `{productId}`,
  `{skuId}` e `{entidade}` são editados à mão hoje. Junto: presets salvos pelo
  usuário em `local:` — nunca `sync:`, que a política de privacidade não cobre —
  e "copiar como cURL".
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

## Pendências da listagem

Mudança de texto entra aqui e viaja com a próxima versão: alterar a listagem
publicada sozinha custa uma revisão.

- **Frase de não associação na descrição** (P) — a última frase da descrição
  longa dizia que a extensão "não usa a identidade visual da VTEX", o que é falso:
  o ícone é no rosa da VTEX. O texto novo, em `docs/publicacao.md`, afirma só a
  não associação. Colar nas duas lojas junto da próxima versão enviada depois da
  1.2.1, que já está em revisão.

## Dívidas encontradas pelo caminho

Coisas que apareceram enquanto se mexia noutra parte, e que ninguém pediu.

- **DevTools sem permissão de host fica sem presets** — o painel não recebe o
  `activeTab` que o popup ganha no clique, então a detecção não roda e
  `isVtex` sai falso. O aviso para conceder acesso aparece logo acima, mas a
  sequência é estranha: a ferramenta parece menor do que é até o clique.
- **Cookie no domínio pai sobrevive ao "Limpar sessão"** — `clearSession` relê e
- **Duas capturas da listagem continuam manuais** — `pnpm screenshots` já gera a
  1, a 4 e a 5. A 2 (painel do DevTools) e a 3 (admin autenticado) entram por
  `brand/screenshots/manual/`, porque nenhuma das duas é alcançável sem uma
  sessão real. Envelhecem a cada mudança de interface e ninguém lembra delas.
