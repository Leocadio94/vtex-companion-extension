# Publicação

Textos e justificativas prontos para colar nos formulários das duas lojas, e o
que os revisores costumam pedir.

## Metadados

| Campo                   | Valor                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Nome                    | VTEX Companion                                                                                                      |
| Descrição curta         | Identifica a tecnologia VTEX do site, abre o preview do FastStore no localhost e chama as APIs com a sessão da aba. |
| Categoria               | Ferramentas para desenvolvedores                                                                                    |
| Idioma principal        | Português (Brasil)                                                                                                  |
| Política de privacidade | <https://leocadio.dev/vtex-companion/privacy/> (EN: `/en/vtex-companion/privacy/`)                                  |
| Site / homepage         | <https://leocadio.dev/vtex-companion/> (EN: `/en/vtex-companion/`)                                                  |
| Código-fonte            | <https://github.com/Leocadio94/vtex-companion-extension>                                                            |
| Suporte                 | <https://github.com/Leocadio94/vtex-companion-extension/issues>                                                     |

O `homepage_url` do manifesto aponta para a página de apresentação, não para o
repositório: é o link que o gerenciador de extensões mostra ao usuário, e quem
chega ali pelo aviso de permissão quer saber o que a extensão faz, não ler
código. O repositório fica linkado na própria página.

## Descrição longa

O campo **Descrição** da Chrome Web Store é texto puro: não renderiza Markdown,
mas preserva as quebras de linha. O texto abaixo é o que vai colado, sem
alteração, nas duas lojas — na AMO ele ocupa o campo _Description_, e a primeira
frase serve de _Summary_.

```text
VTEX Companion lê a stack, o catálogo e o SEO da loja VTEX que você já tem aberta, chama as APIs dessa loja com a sessão da própria aba e abre o preview do CMS do FastStore no seu servidor local.

É uma ferramenta de diagnóstico para quem desenvolve em VTEX. Não há servidor: a extensão lê a aba sob demanda e descarta quando o painel fecha. Nada é coletado, nada é transmitido.

DETECÇÃO DA STACK
• É VTEX? Com que confiança e por quais sinais
• Tecnologia: VTEX IO (Store Framework), FastStore, CMS Legacy Portal ou headless
• Account, workspace e binding
• Admin x loja final, e se a URL está num workspace de desenvolvimento
• Tipo de página: home, PDP, listagem, busca, checkout, order placed, login

CATÁLOGO DA PÁGINA
• PDP: produto, referência, marca, categoria e a lista de SKUs com EAN, refId, seller, disponibilidade e preço — mais atalho para o admin
• Listagem e busca: categoria, caminho, termo, map, ordenação e página

SEO DA PÁGINA
• Indexação (robots, googlebot), title, description, canonical, lang
• Open Graph, Twitter, hreflang, JSON-LD, headings e imagens sem alt
• Regras por tipo de página: PDP sem Product, listagem sem ItemList

SCRIPTS DE TERCEIROS
• Vendors conhecidos com o id da conta quando existe: GTM, GA4, Google Ads, Meta, TikTok, Clarity, Hotjar, Criteo, RD Station, Linx e outros
• Origens de terceiros não catalogadas, agrupadas por volume de requisições

FETCH RUNNER
• Chame as APIs da loja de dentro da própria aba, com a sessão que ela já tem
• Presets de Sessão, Checkout, Catálogo, Intelligent Search, OMS e Master Data
• Confirmação explícita antes de qualquer método que altera dados
• Resposta formatada com realce ou o corpo cru, histórico da sessão e cópia como JSON ou CSV
• Disponível no popup e num painel VTEX Companion dentro do DevTools

SESSÃO
• Os cookies de sessão presentes na origem, com o escopo de cada um
• Clonar a sessão de {account}.myvtex.com para o domínio da loja, sem o token passar pela área de transferência
• Entrar numa origem colando um token, e limpar todos os cookies de sessão de uma vez
• O token nunca é gravado pela extensão nem sai da máquina, e os controles só aparecem em domínio reconhecido como VTEX

PREVIEW DO FASTSTORE NO LOCALHOST
O botão Pré-visualização do CMS do FastStore — o Headless CMS (legacy) e o Storefront > Content — abre a loja publicada. A extensão injeta um botão Localhost ao lado dele que abre a mesma URL no seu dev server, com a query inteira preservada, nas duas versões do CMS e sem depender do cmsDevMode. Também há redirecionamento automático da aba de preview, a última URL capturada com copiar/abrir, e o liga/desliga do cmsDevMode com status por frame.

Lojas em VTEX IO e no portal legacy pré-visualizam por workspace e não usam esse fluxo — a aba Preview diz isso em vez de oferecer controles inertes.

PRIVACIDADE
Não há servidor e nenhum dado é coletado, armazenado remotamente ou transmitido. Não existe content script global: a leitura da página é injetada sob demanda quando você abre o painel, e por isso a instalação não pede "ler dados em todos os sites". O acesso fixo é só a *.myvtex.com e localhost; o domínio da loja é opcional e concedido por você, site a site.
Política de privacidade: https://leocadio.dev/vtex-companion/privacy/

Projeto independente e de código aberto. Não é um produto oficial da VTEX e não usa a identidade visual da VTEX.
Código-fonte: https://github.com/Leocadio94/vtex-companion-extension
```

## Propósito único (Chrome Web Store)

> Ferramenta de diagnóstico para desenvolvedores que trabalham com lojas VTEX:
> identifica qual tecnologia VTEX a página usa, mostra dados de SEO, catálogo e
> scripts de terceiros daquela página, permite chamar as APIs da própria loja
> com a sessão da aba, e abre o preview do CMS do FastStore no servidor de
> desenvolvimento local.

## Justificativa de cada permissão

Cole cada uma no campo correspondente do formulário da Chrome Web Store.

**`activeTab`** — Ler a página que o usuário está vendo no momento em que ele
abre o painel. É o que permite identificar a tecnologia, o tipo de página e as
tags de SEO sem pedir acesso permanente a todos os sites.

**`scripting`** — Executar a leitura da página e as requisições dentro da
própria aba. As requisições precisam sair da origem da loja para usar a sessão
que aquela aba já tem.

**`cookies`** — Informar se existe sessão de loja ou de admin no domínio, e
gravar um cookie de sessão quando o usuário pede explicitamente. Nenhum valor de
cookie é armazenado pela extensão.

**`tabs`** — Saber a URL da aba ativa e abrir o preview local numa aba nova.

**`webNavigation`** — Detectar quando o CMS do FastStore abre uma aba de preview,
para redirecioná-la ao servidor de desenvolvimento local quando o usuário liga
essa opção.

**`storage`** — Guardar preferências do usuário: porta do servidor local,
estado dos toggles, aba selecionada e o histórico de requisições da sessão.

**Host `*://*.myvtex.com/*`** — O admin da VTEX. Necessário para injetar o botão
de preview local e para redirecionar a aba de preview sem exigir um clique
prévio do usuário.

**Host `http://localhost/*`** — Abrir o preview no servidor de desenvolvimento
que roda na máquina do usuário.

**Hosts opcionais `*://*/*`** — Lojas VTEX rodam em domínio próprio, que não é
conhecido de antemão. O acesso é opcional e concedido pelo usuário, site a site,
por um clique no painel.

## Uso de dados (Chrome Web Store)

Marcar apenas o que é verdade:

- Não coletamos nem transmitimos dados do usuário
- Não vendemos dados a terceiros
- Não usamos dados para finalidade alheia à função principal
- Não usamos dados para avaliação de crédito ou empréstimo

## Notas para o revisor da AMO

A AMO exige o código-fonte quando o pacote é minificado, e o build do WXT é.
`pnpm zip:firefox` gera o `.zip` da extensão **e** o `.zip` de fontes; envie os
dois.

Instruções de build para colar no campo de notas:

```
Ambiente: Node 24, pnpm 11
Passos:
  pnpm install
  pnpm build:firefox
Saída: .output/firefox-mv3/ — deve corresponder ao pacote enviado.
Sem código remoto: nada é baixado ou avaliado em tempo de execução.
```

## Antes de enviar

- [x] `pnpm test`, `pnpm compile` e `pnpm dlx web-ext lint --source-dir .output/firefox-mv3` sem erros
- [x] Testar num perfil limpo do navegador, sem outras extensões
- [x] Conferir que a versão em `package.json` subiu
- [x] Conferir que <https://leocadio.dev/vtex-companion/privacy/> responde 200 e
      apontar o formulário para ela (o texto é mantido no repo do site, não aqui)
- [x] Conferir que <https://leocadio.dev/vtex-companion/> responde 200 — é o
      `homepage_url` do manifesto, e um link quebrado ali aparece no navegador
      de todo mundo que instalar
- [x] Capturas de tela em `brand/screenshots/` — **exatamente** 1280×800 ou
      640×400; a Chrome Web Store recusa 1282×800, e a captura de janela do
      Windows costuma sair alguns pixels maior
- [x] Ícone da listagem: `brand/icon-128.png` — a Chrome Web Store exige
      **128×128** e recusa outro tamanho; `brand/icon-512.png` só serve à AMO,
      que pede 96×96 ou maior. Os dois saem de `brand/icon.svg`:
      `rsvg-convert -w 128 -h 128 brand/icon.svg -o brand/icon-128.png`

## Passo a passo do envio

A conta da Chrome Web Store é a que trava primeiro: são US$ 5 e uma verificação
de identidade que pode levar dias. Abrir a conta antes de tudo, e enviar às duas
lojas no mesmo dia — a AMO responde mais rápido e o que ela apontar quase sempre
também vale para a Chrome.

### Antes das duas

```bash
pnpm test && pnpm compile
pnpm zip           # .output/vtex-companion-extension-<versão>-chrome.zip
pnpm zip:firefox   # o mesmo, sufixos -firefox.zip e -sources.zip
pnpm dlx web-ext lint --source-dir .output/firefox-mv3
```

Nenhuma das duas lojas aceita reenviar um número de versão já usado. Se um envio
for rejeitado, suba a versão em `package.json` antes de tentar de novo.

### Chrome Web Store

1. Criar a conta em <https://chrome.google.com/webstore/devconsole> — taxa única
   de US$ 5, e-mail de contato verificado e verificação de identidade.
2. Em **Account settings**, declarar a condição de _trader_ ou _non-trader_. É
   exigência da UE e bloqueia a publicação enquanto estiver em branco; quem
   publica sem fim comercial marca _non-trader_.
3. **Add new item** → subir `vtex-companion-extension-<versão>-chrome.zip`.
4. **Store listing**: descrição curta (o campo corta em 132 caracteres),
   descrição longa, categoria _Developer Tools_, idioma Português (Brasil),
   ícone `brand/icon-128.png`, as cinco capturas de `brand/screenshots/` na
   ordem numerada, e os campos de site e suporte da tabela de metadados.
   Em **Campos extras**, no fim da página: _URL oficial_ é o domínio verificado
   (`leocadio.dev`), _URL da página inicial_ é a landing e **_URL do suporte_ é o
   issues do GitHub, não a landing** — é o link que o usuário clica quando algo
   quebra. _Conteúdo adulto_ fica desligado.
5. **Prática de privacidade** — aba separada da listagem, e é só lá que aparece o
   campo da política. Propósito único, a justificativa de cada permissão e de
   host (os textos deste arquivo), a URL da política e as declarações de uso de
   dados. Há também um campo de política em **Configurações da conta**, a nível
   de conta: aponta para a mesma URL.
6. **Distribution**: público, todas as regiões.
7. **Submit for review**. A primeira submissão de uma conta nova costuma demorar
   mais que as seguintes.

### AMO (Firefox)

1. Criar a conta em <https://addons.mozilla.org/developers/> — gratuita, exige
   uma conta Mozilla e um nome de exibição.
2. **Submit a New Add-on** → _On this site_ (listada) → subir
   `vtex-companion-extension-<versão>-firefox.zip`. A validação roda sozinha e
   repete o que o `web-ext lint` já mostrou.
3. Responder **sim** à pergunta sobre código minificado ou compilado, subir
   `vtex-companion-extension-<versão>-sources.zip` e colar as instruções de
   build da seção anterior.
4. Listagem: nome, resumo, descrição, categoria, licença MIT, URL da política,
   site, suporte e capturas. A AMO não exige dimensão fixa nas capturas — as
   mesmas do envio da Chrome servem.
5. Confirmar a declaração de coleta de dados como _nenhuma_, igual ao
   `data_collection_permissions` do manifesto.
6. Enviar. A extensão é assinada e publicada em minutos; a revisão humana pode
   vir depois e pedir esclarecimento pelo painel.

### Depois de publicar

- Guardar as duas URLs de listagem e colocá-las na página de apresentação e no
  README.
- Marcar a tag da versão no repositório, para que o `sources.zip` enviado tenha
  um commit correspondente.

## Capturas

Ficam em `brand/screenshots/`, junto do ícone da listagem, e são geradas por
`pnpm screenshots`: as de número 1, 4 e 5 saem prontas, e as 2 e 3 entram por
`brand/screenshots/manual/` — o painel do DevTools e o admin autenticado não
são automatizáveis. **O número do arquivo é a ordem de envio**, e a ordem
importa: a Chrome Web Store exibe na sequência
enviada, e a primeira é a que quase todo mundo vê.

1. Aba Página numa PDP — produto, com a lista de SKUs aberta
2. Painel do DevTools — requisição e resposta formatada lado a lado
3. Admin do CMS — botão Localhost e o Localhost URL no painel de dev mode
4. Aba Página — achados de SEO e scripts de terceiros
5. Aba Loja — tecnologia, account, workspace e o bloco de sessão

O critério da ordem: começa pelo que qualquer pessoa que trabalha com VTEX
reconhece de imediato, depois a ferramenta com mais espaço de tela, depois o
recurso que nenhuma outra extensão tem. A sessão fica por último — é o recurso
mais sensível e o menos indicado para servir de cartão de visita.

Duas armadilhas que já apareceram:

- **Estado de erro na vitrine.** Um painel mostrando "Catálogo não respondeu:
  HTTP 404" documenta a falha, não o recurso. Escolha uma loja onde a chamada
  responde — na PDP, o que vende a aba é a lista de SKUs.
- **Seção cortada pela borda.** O popup rola; enquadre com a seção inteira
  visível, senão a captura sugere interface truncada.

Antes de enviar, olhe cada captura procurando dado que não deveria estar lá:
account de cliente, e-mail, id de pedido, token. Lojas de demonstração públicas
(`storetheme.vtex.com`, `starter.vtex.app`) evitam o problema na origem.

## Imagens promocionais

Nenhuma das duas é obrigatória para publicar, e a listagem fica completa sem
elas.

- **Bloco promocional pequeno (440×280).** É o cartão que a Chrome Web Store usa
  quando exibe a extensão fora da própria página — coleções, páginas de
  categoria e o material que a equipe editorial monta. Sem ele, a extensão não
  entra em nenhuma dessas superfícies, nem é considerada para destaque. Vale
  gerar, e `pnpm promo` gera: `brand/promo-440x280.png`, o ícone sobre o mesmo
  fundo escuro das capturas, com o nome e uma linha de resumo.
- **Bloco promocional de letreiro (1400×560).** Só aparece no carrossel de
  destaque da home da loja, que é curadoria manual do Google. Uma extensão nova,
  de nicho e sem instalações, não chega lá. Não gerar agora.

## Marca

O ícone é uma lupa desenhada para este projeto. A extensão não usa o logo nem a
identidade visual da VTEX, e não é um produto oficial da VTEX — as duas lojas
rejeitam extensões que se apresentam como oficiais de uma marca de terceiro.
