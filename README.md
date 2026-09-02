# VTEX Companion

Extensão de navegador (Chrome e Firefox) que identifica a tecnologia VTEX por
trás da página aberta e destrava o preview do FastStore no `localhost`.

Um único código-fonte gera os dois builds. O Firefox sai em MV3 com
`background.scripts`; o Chrome, em MV3 com `service_worker`.

Página de apresentação: <https://leocadio.dev/vtex-companion/> · Política de
privacidade: <https://leocadio.dev/vtex-companion/privacy/>

## Escopo desta versão

**Detecção**

- É VTEX? Com que confiança e por quais sinais
- Tecnologia: IO (Store Framework), FastStore, CMS Legacy Portal ou headless
- Account, workspace, binding
- Admin VTEX x loja final, e se a URL está num workspace de desenvolvimento
- Tipo de página: home, PDP, PLP, busca, checkout, order placed, login, custom
- Login do shopper na loja e presença de sessão de admin

**Catálogo da página**

- PDP: produto, referência, marca, categoria e a lista de SKUs com EAN,
  refId, seller, disponibilidade e preço — mais atalho para o admin
- Listagem e busca: categoria, caminho, termo, `map`, ordenação e página

**Scripts de terceiros**

- Vendors conhecidos com o id da conta quando existe: GTM, GA4, Google Ads,
  Meta, TikTok, Clarity, Hotjar, Criteo, RD Station, Linx, e outros
- Origens de terceiros não catalogadas, agrupadas por volume de requisições

**Sessão**

- Os cookies de sessão presentes na origem, com o escopo de cada um: o
  `VtexIdclientAutCookie` é a sessão de admin, e o sufixado pela account é o
  login do shopper na loja — no domínio do admin, os dois são do admin
- Clonar a sessão de `{account}.myvtex.com` para o domínio da loja, sem o
  token passar pela área de transferência
- Limpar a sessão apaga todos eles de uma vez, e confere o resultado relendo
  os cookies
- Entrar numa origem colando um token, para o caso em que não há admin a clonar

O token nunca é gravado pela extensão nem sai da máquina, e os controles só
aparecem em domínio reconhecido como VTEX.

**Fetch runner**

- Todos os métodos, com o cookie da sessão da aba atual
- Presets de Sessão, Checkout, Catálogo, Intelligent Search, OMS, Master Data
- Confirmação explícita antes de qualquer método que altera dados
- Histórico da sessão e cópia da resposta como JSON ou CSV
- Resposta em duas leituras: formatada com realce, ou o corpo cru
- Disponível no popup e num painel **VTEX Companion** dentro do DevTools

**SEO da página**

- Indexação (`robots`, `googlebot`), title, description, canonical, lang
- Open Graph, Twitter, hreflang, JSON-LD, headings e imagens sem alt
- Regras por tipo de página: PDP sem `Product`, listagem sem `ItemList`

**Preview no localhost — CMS do FastStore**

O recurso é do CMS do FastStore, nas duas versões: o Headless CMS (legacy) e o
Storefront > Content. VTEX IO e o portal legacy têm pré-visualização própria,
por workspace, e não passam por aqui — a aba Preview diz isso quando a loja
aberta é de uma dessas plataformas, em vez de oferecer controles inertes.

São quatro caminhos, nenhum deles dependente de `cmsDevMode`:

1. Redirecionamento automático da aba de preview (toggle no popup)
2. Botão **Localhost** injetado ao lado de "Pré-visualização" no admin
3. Última URL de preview capturada, com copiar/abrir no popup
4. Liga/desliga do `cmsDevMode`, com status por frame

Com o `cmsDevMode` ligado, o painel Development Mode também ganha um
**Localhost URL** clicável ao lado do "API URL" do próprio CMS — o
comportamento do userscript que originou o projeto.

Não é um produto oficial da VTEX. O ícone é original; a extensão não usa a
identidade visual da VTEX.

## Como rodar

```bash
pnpm install
pnpm dev              # Chrome
pnpm dev:firefox      # Firefox
pnpm test             # testes das funções puras
pnpm compile          # typecheck
pnpm build            # build de produção (Chrome)
pnpm build:firefox    # build de produção (Firefox)
```

Lint da AMO antes de publicar:

```bash
pnpm build:firefox && pnpm dlx web-ext lint --source-dir .output/firefox-mv3
```

## Como o preview funciona

O botão **Pré-visualização** do CMS do FastStore abre uma aba para a Preview URL
configurada na loja. O formato muda entre as duas versões do CMS:

| CMS | URL que o botão abre |
| --- | --- |
| Headless CMS (legacy) | `https://{host}/?contentType=…&documentId=…&versionId=…` |
| CMS (Storefront > Content) | `https://{account}.vtex.app/api/preview?…` |

`lib/preview/rewrite.ts` troca só o origin e preserva a query inteira, forçando
`/api/preview` quando o path vem na raiz. É por isso que o recurso funciona nas
duas versões sem conhecer os parâmetros do CMS novo, que não são documentados.

O botão injetado no admin **não lê a URL do DOM**. Ele arma um redirecionamento
de uso único no background e clica no botão original — a URL real passa pelo
`webNavigation` e é reescrita lá. É o que dispensa o `cmsDevMode`.

## Permissões

| Permissão | Para quê |
| --- | --- |
| `*://*.myvtex.com/*` | admin: content script e redirecionamento sem clique |
| `http://localhost/*` | abrir o dev server |
| `*://*/*` (opcional) | ler cookies e sessão da loja, concedida por site no popup |
| `activeTab` | leitura pontual da página quando o popup é aberto |

Não há content script em `<all_urls>`: a leitura dos globais da página é
injetada sob demanda pelo popup, com `scripting.executeScript`. Isso evita o
aviso de "ler dados em todos os sites" na instalação.

## Estrutura

```
entrypoints/
  background.ts            roteador de mensagens e redirecionamento do preview
  cms-admin.content.ts     botão Localhost no admin (roda em todos os frames)
  popup/                   painel React
  devtools/                registra o painel no DevTools
  devtools-panel/          o runner com a janela inteira
ui/                        componentes e estado usados pelos dois painéis
lib/
  auth/                    escrita e clonagem do cookie de sessão
  catalog/                 alvo da busca + leitura do catálogo pela página
  detect/                  funções puras de detecção + contrato de tipos
  pixels/                  catálogo de vendors + classificação dos recursos
  runner/                  montagem, presets, execução e histórico do fetch
  seo/                     leitura das tags da página + regras de SEO
  preview/                 reescrita de URL, seletores do admin, cmsDevMode
  browser/                 cookies e leitura de globais da página
  vtex/session.ts          probe da Session Manager
  collect.ts               orquestra as três camadas para a aba ativa
```

`lib/detect/*` e `lib/preview/rewrite.ts` não tocam em `browser.*` nem no DOM —
são funções puras sobre um objeto de sinais, e é o que os testes cobrem.

## Notas sobre iframes

No admin, o CMS do FastStore roda dentro de um iframe. `cms-admin.content.ts`
usa `all_frames: true`, e o `cmsDevMode` é lido e escrito com
`allFrames: true` porque `localStorage` pertence ao origin do frame — o do
iframe, não o do topo. Frames com sandbox sem `allow-same-origin` são
reportados como indisponíveis em vez de derrubar a leitura.

## Publicação

Textos de listagem, justificativa de cada permissão e checklist de envio em
[`docs/publicacao.md`](./docs/publicacao.md). Política de privacidade em
[`PRIVACY.md`](./PRIVACY.md), que aponta para a versão publicada.

A página de apresentação e a política moram no repositório do site
(`portfolio-astro`), não aqui — o texto tem um dono só.

## Licença

MIT — veja [`LICENSE`](./LICENSE).
