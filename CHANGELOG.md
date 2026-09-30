# Changelog

Uma seção por versão publicada, escrita na branch do release junto com o bump —
antes do PR, não depois do merge. O texto do release no GitHub é este mesmo,
extraído daqui:

```bash
awk '/^## /{ n++ } n == 1' CHANGELOG.md | tail -n +2 > /tmp/notes.md
gh release create v<versão> --notes-file /tmp/notes.md .output/*.zip
```

Uma fonte por assunto: a nota mora no repositório, versionada com o código que
descreve, e a página de release cita. `docs/roadmap.md` guarda o que ainda não
existe, e `docs/release.md`, a ordem das etapas — nenhum dos dois é changelog.

## 1.3.0 — 2026-09-29

Rodada de acabamento guiada por duas avaliações: um critique de UX (28/40) e um
audit técnico (12/20), ambos registrados em `.impeccable/critique/`. O que os
dois apontaram concentra-se em três lugares: contraste do tema claro, alvos de
toque no Android, e a ação mais destrutiva do produto ter menos fricção que um
POST de teste. No meio do caminho, testar em `pernambucanas.com.br` (FastStore)
trouxe à tona duas falhas funcionais que a detecção e o catálogo carregavam
desde o início.

### Catálogo funcionando em lojas FastStore

Em FastStore, a API de catálogo não vive no domínio da loja — `pernambucanas.com.br`
responde 404 a `/api/catalog_system/...`, e o popup exibia "Catálogo não
respondeu: HTTP 404" em qualquer PDP. A API responde em `{account}.myvtex.com`,
que já é host permission obrigatória da extensão; de dentro da página não dá,
porque a API de lá não manda cabeçalho de CORS. A coleta passou a ter duas
etapas: tenta same-origin (o caminho do IO e das lojas que fazem proxy) e,
não achando o produto, repete pelo background no domínio de API da conta, que
tem a permissão e não sofre CORS. A conta vem da detecção, e o host é
reconstruído e validado no background — a mensagem poderia vir de qualquer um.

Junto, o path de PDP do FastStore carrega o SKU selecionado
(`/{linkText}-{skuId}/p`), e buscar pelo path inteiro devolve lista vazia. O
alvo do catálogo agora carrega o slug encurtado como candidato de reserva,
tentado só depois do original falhar.

Corrigido e verificado na Pernambucanas: produto, marca, categoria e os 5
SKUs com disponibilidade e preço aparecem na PDP.

### Detecção de página em navegação SPA do FastStore

Navegação client-side no Next.js não reescreve `window.__NEXT_DATA__`: ele é o
retrato da hidratação, e um home → PDP no cliente deixava `page: '/'` numa
PDP — o popup continuava dizendo home. Mesma armadilha que o `__RUNTIME__`
tem no IO, com a mesma saída: quando a URL contradiz o snapshot, a URL vence,
e a linha "Por quê" diz `__NEXT_DATA__.page=... (desatualizado)`. Verificado
em `pernambucanas.com.br`: home detecta home, PDP por navegação client-side
detecta PDP.

### Contraste AA no tema claro

O rosa oficial da VTEX (`#f71963`) com texto branco mede 3,98:1, abaixo do AA
de 4,5:1, e é a cor de todo botão primário, badge e segmento ativo. A cor fica
(não é só estética, é a marca, e a decisão de 27/09 registrou isso); o que
muda é onde cada variante entra: fundos que carregam texto passam a usar
`--accent-strong` (`#e50e59`, 4,63:1) e o accent como texto (aba ativa da
navegação, flag "copiado") usa `--accent-text` (`#c30e4e`). No escuro, o
rosa vivo com texto quase preto passava no contraste, mas o par incomodava o
olho — botões e badge passam a usar o mesmo par do claro (rosa mais escuro,
texto branco), e a página fica menos vibrante sem perder a marca.

No mesmo passe, badge do cabeçalho e pills de severidade perderam o formato
de pílula: cantos retos, como todo o resto do produto e como a landing usa.
Pílula colorida no topo é cara de template.

### "Limpar sessão" pede confirmação

Um clique apagava de uma vez a sessão de admin e a da loja, e era o único
destructivo sem confirmação: o fetch runner ensina que método que altera dado
pede confirmação em dois passos, e a limpeza contradizia o padrão que o
próprio app estabeleceu. Agora o primeiro clique morfa o botão para "Confirmar
limpeza (N)" com Cancelar ao lado, e o aviso diz quantos cookies vão embora.

### Alvos de toque e a affordance de cópia no Android

No Firefox para Android o popup é a interface inteira, e chips de workspace,
botões do histórico, segmentado e linha copiável mediam de 19 a 26px de altura.
Em `pointer: coarse` esses alvos sobem para 44px; fora do touch, para os 24px
do WCAG 2.5.8. E como no touch não existe hover, o indicador "copiar" agora é
estático no Android: a affordance que no desktop "só o cursor denuncia" não
podia depender de cursor no aparelho onde não há cursor.

### Acessibilidade

`role="status"` no banner de risco, no resultado das operações de sessão e
segmento e no status da resposta do runner; `role="tablist"`/`tab` com
`aria-selected` na navegação; `aria-pressed` no segmentado Formatado/Raw;
`aria-label` nos campos do runner (método, URL, cabeçalhos, corpo), no campo
de token e nos botões de replay do histórico, que antes diziam só "GET".

### Tabela de SKUs, e o fim do `.frames` genérico

A lista de SKUs da PDP virou tabela com colunas de ID, SKU, estoque e preço
(números alinhados à direita, EAN e refId como meta sob o nome), e a classe
`.frames` volta a estilizar só a lista de frames do admin. As outras listas
que herdavam a classe ganharam nomes próprios (`origin-list`, `tag-counters`,
`headers-editor`, `sku-table`). Na aba Página, Title e Description longos
truncam com expansão, e os contadores de tags ficam atrás de um `details`.

### Desempenho

Digitar no formulário do runner reprocessava o corpo da resposta a cada
tecla: a formatação JSON ficou em `useMemo` e o `JsonView` virou componente
memoizado.

### Textos

As strings da interface, o README e os textos de listagem passaram pelas
regras de voz do site (o mesmo padrão que a landing já seguiu): travessões
viram vírgula ou dois-pontos, negação encadeada vira afirmação, e a frase
"em vez de oferecer controles inertes" descreve o que a aba faz. A tagline do
bloco promocional acompanhou a da landing. Nenhum fato entrou ou saiu: os
textos de `docs/publicacao.md` seguem prontos para colar, e a política da AMO
foi ressincronizada com o texto canônico do site.

### Correções

- **Description com marcação HTML.** CMS de loja grava `<strong>` e `<br />`
  dentro da meta description (a Pernambucanas tem 1,4 kB de markup numa linha
  só), e o painel mostrava as tags crus — além de empurrar o popup para uma
  altura de seção impossível. A leitura tira a marcação e o painel trunca com
  expansão.
- **Resposta perdida na mensagem ao background.** O Chrome ignora Promise
  devolvida de listener de mensagem: o handler passou a usar `sendResponse`
  com `return true` (e a devolver Promise no Firefox, onde o 3º argumento não
  existe).
- Botões de replay do histórico tinham `aria-label` genérico; agora nomeiam
  método e URL da requisição.
- As capturas da listagem foram regeradas com o visual novo (`tank-top` hoje
  responde 404; a captura 1 mostra a tabela de SKUs em `classic-shoes`).

## 1.2.1 — 2026-09-23

Correção no popup para o Firefox para Android: a medida fixa de 400×600 de `main`
cortava o conteúdo à direita numa tela de 360 CSS px, porque lá o popup abre
como página inteira e não como janela de 400 px. No Android a medida agora é
`100vw`/`100dvh`, disparada por media query de ponteiro primário (`pointer:
coarse`) — não por teto em unidade de viewport, que foi a primeira tentativa
desta versão e converge para uma janelinha no desktop: a viewport inicial do
popup é menor que a final, porque o Chrome anima a abertura, e um teto em
`100vw`/`100dvh` realimenta o próprio tamanho. No desktop nada muda — o mouse é
o ponteiro primário, e o popup segue 400×600.

## 1.2.0 — 2026-09-09

Segunda versão publicada, e a primeira enviada às lojas por linha de comando. Três recursos novos na aba Loja, todos sobre o que a aba já é: o que a loja mostra, e como mudar isso sem abrir o DevTools.

### Segmento

O cookie `vtex_segment` decodificado e editável: **sales channel, culture info, moeda e region id** em campos próprios, e o JSON inteiro num `details` para `priceTables`, `campaigns`, `utm_*` e o que a plataforma acrescentar. Gravar recarrega a aba.

Trocar sales channel ou região custava abrir o DevTools, achar o cookie, decodificar o base64 na mão, editar e colar de volta. As quatro etapas do meio agora são um campo e um botão.

O valor volta como veio: campo esvaziado grava `null`, não `""`, que é o que a plataforma guarda; chave desconhecida sobrevive à edição; e o `R$` do `currencySymbol` não corrompe na ida e volta. A Session Manager pode reescrever o cookie na navegação seguinte — a interface diz isso, em vez de deixar você achar que a gravação falhou.

### Workspace e flags de URL

**Trocador de workspace** com os recentes e a volta ao `master`. As duas formas de dizer o workspace são diferentes e só uma funciona em cada host: subdomínio em `*.myvtex.com`, `?workspace=` no domínio próprio da loja. A extensão escolhe pelo host, e no host da plataforma apaga a query — com as duas presentes, quem vence depende do serviço que responde.

**Flags do render-runtime em um clique:** `__siteEditor`, `__disableSSR`, `__disableRuntimeSSR`, `__disablePixels`, `__bindingAddress` e `sc`. O resto da query fica como estava — termo de busca, paginação, `map` e utm sobrevivem, que é justamente o estado que se queria inspecionar. As flags de runtime só aparecem em loja VTEX IO, porque é quem as lê.

### Privacidade

Nenhuma preferência usa mais o `sync` do navegador. A porta do dev server e o redirecionamento de preview foram para o armazenamento local, com migração automática do valor antigo, e a lista de workspaces recentes nasce lá — nome de workspace costuma ser nome de cliente. A política publicada promete que nada do que é salvo sai da máquina; agora o código cumpre a promessa inteira.

### Android

O build do Firefox continua sendo oferecido no Firefox para Android, e agora a listagem diz o que não existe lá: o painel do DevTools, porque o navegador não tem DevTools no aparelho, e o preview no `localhost`, que pressupõe um dev server na mesma máquina. O resto funciona pelo popup.

### Correções

- **A aba não era relida depois de navegar.** `tabs.update` resolve quando o pedido é aceito, não quando a página carregou, então o workspace na tela continuava o antigo até reabrir o painel. O reload da sessão e o liga-desliga do `cmsDevMode` tinham a mesma corrida.

## 1.1.0 — 2026-09-02

Primeira versão depois da 1.0.0. Rodada de acabamento antes do envio às lojas, mais quatro correções que apareceram testando.

### Interface

- **Carga por aba.** A detecção pinta sozinha e cada sonda roda quando a aba dela abre. Antes, tudo corria em série — inclusive uma chamada de rede ao catálogo — e o painel ficava em "Lendo a página…" até a última responder.
- **Hierarquia de botão** com variantes secundária, fantasma e destrutiva, mais anel de foco, que não existia. `Limpar` deixou de parecer igual à ação que desfaz.
- **Estados com peso próprio:** falha de sonda não sai mais com a aparência de nota de rodapé.
- **Copiar em um clique** em account, workspace, binding, ids e canonical.
- **Cabeçalho com identidade** — `account · workspace · Loja|Admin` — e faixa de alerta quando há sessão de admin numa loja de produção.
- Popup em 400×600.

### DevTools

Colunas com rolagem independente: descer o histórico não arrasta mais o formulário para fora da tela. A resposta ocupa a altura da janela em vez de um `calc()` fixo. A aba passou a se chamar **VTEX Companion** — "VTEX" ao lado das abas nativas se apresentava como painel oficial.

### Correções

- **Limpar sessão não funcionava na loja.** Apagava só o cookie de admin; o que mantém o shopper logado é o sufixado pela account. Agora varre todos, relê e avisa quando algo sobrevive.
- **Presets do runner** empilhavam os títulos de grupo no topo da lista. Viraram `<optgroup>`.
- **O runner prometia demais fora da VTEX:** abria com `/api/sessions` preenchido e os presets listados em qualquer página.
- **A aba Preview não dizia de que CMS falava.** É o do FastStore; em lojas IO e no portal legacy a aba agora explica que a pré-visualização é por workspace.

### Ferramentas

`pnpm screenshots` gera as capturas da listagem com Playwright e sharp, no tamanho exigido, e escreve nos dois repositórios. `docs/release.md` registra a ordem do release e `docs/roadmap.md` o que ficou de fora.

## 1.0.0

Antecede este arquivo e não tem tag no repositório: a 1.1.0 foi a primeira
versão a chegar às lojas. O que existia até ali está no histórico do git.
