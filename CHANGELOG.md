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
