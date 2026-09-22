# `pnpm dev` abrindo o navegador do Windows

O projeto é desenvolvido no WSL, com Chrome e Firefox instalados no Windows. O
WXT não abre navegador nenhum quando detecta WSL: o runner dele só imprime
`Cannot open browser when using WSL` e manda carregar a build à mão, qualquer
que seja o `webExt` da configuração. `modules/windows-browser` troca esse runner
por um que abre o navegador do Windows.

## O que acontece no `pnpm dev`

1. O WXT sobe o dev server na 3010 e faz a primeira build em
   `.output/chrome-mv3-dev` (ou `firefox-mv3-dev`).
2. O módulo roda `cmd.exe /c npx -y web-ext@<versão> run` **do lado Windows**,
   apontando para a build pelo caminho UNC (`\\wsl.localhost\Arch\...`). A
   versão é a do `web-ext` no lockfile, a mesma do lint no CI; a primeira
   execução baixa o pacote para o cache do npm do Windows.
3. O `web-ext` abre o Chrome ou o Firefox num perfil próprio e instala a
   extensão. Quem recarrega a extensão a cada mudança continua sendo o WXT: a
   build de dev fala com `ws://localhost:3010`, que o `localhostForwarding` do
   WSL entrega. Por isso o `web-ext` roda com `--no-reload`.
4. `o + enter` no terminal fecha e reabre o navegador. Ctrl+C fecha o navegador
   junto com o dev server.

## Perfis

Cada navegador tem um perfil persistente, separado do perfil do dia a dia:

- `%LOCALAPPDATA%\vtex-companion-dev-chrome`
- `%LOCALAPPDATA%\vtex-companion-dev-firefox`

O login no admin da VTEX e nas lojas de teste é feito uma vez e fica. Não dá
para usar o perfil principal: o Chrome recusa depuração remota no diretório de
dados padrão, e com o Chrome principal já aberto o lançamento seria entregue à
instância existente, que ignora a extensão.

Apagar a pasta zera o perfil.

## Por que assim

**`--load-extension` morreu.** O Chrome de marca desligou a flag na 137. A
receita da documentação do WXT (`--disable-features=DisableLoadExtensionCommandLineSwitch`)
foi testada no Chrome 153 e não funciona mais, nem com a build copiada para o
`C:`. O único caminho é o que o `web-ext` já usa: `--remote-debugging-pipe` com
`--enable-unsafe-extension-debugging` e o comando CDP `Extensions.loadUnpacked`.

**O pipe não atravessa a interop.** O `web-ext` fala com o Chrome pelos
descritores 3 e 4, e a interop do WSL só repassa stdin, stdout e stderr a um
processo do Windows. Rodar o `web-ext` no WSL apontando para o `chrome.exe`
não funciona; rodar o `web-ext` no Windows funciona. É o mesmo arranjo do
`chrome-devtools-mcp`, configurado com `cmd.exe /c npx`.

**Ctrl+C também não atravessa.** Matar o lado WSL da interop deixa `cmd.exe`,
o `node` do `web-ext` e o navegador vivos no Windows, e o perfil preso: o
próximo `pnpm dev` bateria nele. O módulo trata SIGINT, SIGTERM e SIGHUP, e
fecha pelo PowerShell todo processo cuja linha de comando cita o perfil: pede
para a janela fechar, como um clique no X, e força só o que não sair em 5
segundos. O mesmo fechamento roda antes de abrir, para limpar a sobra de uma
sessão que morreu sem sinal.

**WSLg ficou de fora.** Um Chromium do Linux pela WSLg abriria sem nada disso,
mas seria um navegador a mais para manter, fora do Chrome e do Firefox em que a
extensão é usada de verdade.

## Voltar ao carregamento manual

Um `web-ext.config.ts` na raiz, que o `.gitignore` já exclui, sobrescreve o
`webExt` do `wxt.config.ts`:

```ts
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({ disabled: true });
```

Com ele, o `pnpm dev` só compila e observa, e a extensão é carregada à mão pelo
caminho `\\wsl.localhost\...\.output\chrome-mv3-dev`.

## Quando não abre

- **`web-ext saiu com código N`** no terminal traz a saída do `web-ext`. O caso
  comum é o perfil ainda aberto por uma janela que sobrou: feche-a, ou aperte
  `o + enter`, que fecha antes de abrir.
- **Nada acontece e não há aviso**: conferir se o `node` do Windows responde,
  com `cmd.exe /c node --version`.
- **Fora do WSL** o módulo não faz nada, e o WXT volta ao comportamento
  padrão dele: abre o navegador com o `web-ext` local.
