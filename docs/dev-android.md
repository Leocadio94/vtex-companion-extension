# Extensão de dev no Firefox para Android

O popup é o produto inteiro no aparelho — o Firefox para Android não tem
DevTools, então o painel não existe lá — e o layout dele só se prova na tela:
foi num aparelho que a 1.2.1 achou que os 400×600 cortavam o conteúdo numa tela
de 360 CSS px. Há dois caminhos para carregar a extensão de dev, e os dois
foram validados na 1.2.1.

O aparelho pende do **USB do Windows**: o WSL não enxerga o telefone, e nenhuma
das etapas de aparelho roda de cá. A build, sim, continua nascendo no WSL.

## No aparelho, uma vez

1. Firefox Android → `Configurações → Sobre o Firefox` → toque 5× no logo
   ("Debug menu enabled"). Volte: entra `Ferramentas de desenvolvedor` no menu
   de configurações.
2. Ative `Depuração remota via USB` (existe no Release; é o que o caminho USB
   usa).
3. No Windows: `winget install Google.PlatformTools`, e `adb devices` com o
   cabo conectado deve listar o aparelho. Aceite o prompt de depuração que o
   Firefox mostrar.

O passo 1 também é o que destrava `Instalar add-on de arquivo` nas
configurações — a saída do aparelho para o segundo caminho.

## Caminho USB: `web-ext run`

O caminho oficial, com auto-reload e console da extensão no terminal:

1. Build de cá e **cópia para o `C:`** — a mesma armadilha do Chrome registrada
   em `dev-windows.md`: a cópia é refeita a cada build, senão o aparelho roda
   código velho parecendo novo:

   ```bash
   pnpm build:firefox
   cp -r .output/firefox-mv3 /mnt/c/Users/gabriel/vtex-dev-android/
   ```

2. Do Windows, sobre a cópia:

   ```bat
   cd C:\Users\gabriel\vtex-dev-android
   npx web-ext run --source-dir . --target firefox-android ^
     --android-device <serial> --firefox-apk org.mozilla.firefox
   ```

   `--firefox-apk`: `org.mozilla.firefox` (Release), `org.mozilla.firefox_beta`
   (Beta) ou `org.mozilla.fenix` (Nightly).

O `web-ext` instala como **add-on temporário** — morre quando o Firefox fecha —
e recarrega sozinho quando o diretório observado muda. O ciclo é: rebuild no
WSL → `cp` para a cópia → o aparelho recarrega.

## Caminho sem cabo: instalar o zip por arquivo

Instalação **persistente** — sobrevive a fechar o navegador, que é o que o
add-on temporário não dá. Em troca, sem auto-reload: cada iteração é novo zip e
reinstalação, e o console da extensão só via `about:debugging` no desktop
conectado por USB.

1. `pnpm zip:firefox` → `.output/vtex-companion-extension-<versão>-firefox.zip`.
2. Mande o zip para o aparelho.
3. No Firefox: `Configurações → Instalar add-on de arquivo` → o zip é aceito
   direto pelo seletor.

A pegadinha é a assinatura: **o Release recusa extensão não-assinada**, e o
build local é não-assinado — a instalação por arquivo de build de dev funciona
no Nightly e no Beta, com `xpinstall.signatures.required = false` no
`about:config` (que só existe nessas duas versões). Assinar via AMO (channel
unlisted) é o caminho para o Release aceitar, e para distribuir build de teste
a outra pessoa — não para iterar: custa credenciais de API e uma ida à AMO por
build.

## Por que assim

**Não é a build de dev.** O `pnpm dev:firefox` fala com o dev server do WXT em
`ws://localhost:3010` — no aparelho, `localhost` é o próprio telefone. O que
vai para o aparelho é a build de produção (`build:firefox`), e o reload vem do
`web-ext` observando os arquivos, não do WXT. O preview no `localhost` também
não funciona lá por este mesmo motivo, e é esperado.

**Nada roda no WSL.** O `web-ext` fala com o aparelho por `adb`, e o telefone
está no USB do Windows. Rodar o `web-ext` de cá significaria `usbipd` para
exportar o USB para dentro do WSL — uma peça a mais no arranjo para economizar
um `cmd.exe`, que o `dev-windows.md` já paga de qualquer forma.

## Resumo dos dois caminhos

| | USB (`web-ext run`) | Zip por arquivo |
|---|---|---|
| Persistência | temporário (morre ao fechar) | sobrevive |
| Auto-reload a cada build | sim (via cópia no `C:`) | não — reinstalar |
| Console da extensão | no terminal | `about:debugging` no desktop |
| Aceita build não-assinada | sim | só Nightly/Beta com a flag |
| Requer | cabo + adb | só o arquivo no aparelho |
