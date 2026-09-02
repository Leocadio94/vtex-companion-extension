# Roteiro de release

A ordem importa mais que a lista. Os passos abaixo existem porque cada um
depende do anterior — e porque dois deles, invertidos, produzem um envio que
não corresponde a nada publicado.

O envio às lojas em si não está aqui: mora em [`publicacao.md`](./publicacao.md),
com os textos, a justificativa de cada permissão e o checklist dos dois
formulários. Este arquivo diz **quando** rodar aquilo, e o que precisa estar
pronto antes.

## 0. Portão

Nada começa antes disto passar:

```bash
pnpm compile
pnpm test
pnpm build && pnpm build:firefox
pnpm dlx web-ext lint --source-dir .output/firefox-mv3
```

O lint da AMO tem que ficar em **zero erros**. Os dois avisos de
`UNSAFE_VAR_ASSIGNMENT` vêm do bundle minificado do React e não são acionáveis.

## 1. Na branch

Tudo o que segue acontece na branch do release, nunca na `main`.

**Roadmap** — tirar de [`roadmap.md`](./roadmap.md) o que saiu e registrar as
dívidas que a rodada criou. O que foi feito vive no histórico do git; o roadmap
guarda só o que ainda não existe.

**Documentação** — `README.md` descreve o escopo da versão, então muda sempre
que um recurso entra ou muda de comportamento. `CLAUDE.md` só muda quando muda
um invariante ou uma armadilha: ele não é changelog. `publicacao.md` muda quando
as permissões mudam — ver a regra abaixo.

**Site** — se o comportamento visível mudou, a landing precisa acompanhar. Ver
[o repositório irmão](#o-repositório-irmão).

**Capturas** — `pnpm screenshots`. Elas envelhecem a cada mudança de interface e
são exigidas em **1280×800 exatos**; a Chrome Web Store recusa 1282×800. O
painel sai no tema escuro por padrão, para combinar com as duas capturas
manuais; `--theme=light` ou `--theme=auto` mudam isso, e um número como
argumento refaz só aquela.

**Versão** — subir em `package.json`, que é de onde o WXT tira a do manifesto:

- **minor** quando muda o que o usuário vê: recurso novo, comportamento
  diferente, texto de interface reescrito;
- **patch** para correção que não muda o que a extensão faz.

Commits em prosa, explicando o porquê, sem rodapé de ferramenta. Push a cada
bloco fechado, não só no fim.

## 2. PR

```bash
gh pr create --base main --title "…" --body-file -
```

O corpo é a leitura de quem vai revisar: o que mudou e por quê, não a lista de
arquivos. **Não existe `CHANGELOG.md` neste projeto** — as notas do release saem
das mensagens de commit, que já são prosa explicando a decisão. Manter as duas
coisas seria o mesmo raciocínio em dois lugares.

## 3. Merge, tag e limpeza

Nesta ordem, e só depois do merge:

```bash
git checkout main && git pull
git tag v1.1.0 && git push --tags
git push origin --delete <branch>
```

**A tag vem depois do merge, nunca antes.** O `sources.zip` que a AMO recebe
precisa ter um commit correspondente na `main`; uma tag numa branch que ainda
pode ser reescrita não serve como referência do que foi enviado.

## 4. Artefatos

```bash
pnpm zip           # .output/vtex-companion-extension-<versão>-chrome.zip
pnpm zip:firefox   # o mesmo, mais -firefox.zip e -sources.zip
```

Daqui em diante o roteiro é o de [`publicacao.md`](./publicacao.md).

## 5. Depois de aprovado

- Guardar as duas URLs de listagem e colocá-las no `README.md` **e** na landing,
  trocando o `soon: 'Em breve'` dos botões de instalação por links reais.
- Conferir que `https://leocadio.dev/vtex-companion/` responde 200: é o
  `homepage_url` do manifesto, e um link quebrado ali aparece no gerenciador de
  extensões de todo mundo que instalar.

## Regras que não mudam

**Versão já usada não volta.** Nenhuma das duas lojas aceita reenviar um número
que já subiu. Envio rejeitado custa um bump antes da próxima tentativa — por
isso o número sobe na branch, e não depois de aprovado.

**Permissão que muda arrasta o formulário.** Alterar `permissions` ou
`host_permissions` em `wxt.config.ts` invalida a justificativa correspondente em
`publicacao.md`, e no Firefox mexe também em `data_collection_permissions` e no
`strict_min_version`. Os três andam juntos ou o envio volta.

**Privacidade é texto, não link.** `PRIVACY.md` aponta para a política
publicada, cujo texto mora no site com um `privacyUpdatedAt` datado. Se o que a
extensão lê ou grava mudar, os três se movem na mesma passada — o link
continuar respondendo 200 não quer dizer que ele ainda descreve o produto.

## O repositório irmão

A página de apresentação e a política de privacidade moram em
`../portfolio-astro`, não aqui: o texto tem um dono só. O que costuma precisar
de atualização, em `src/data/vtex-companion.ts`:

- `description` e `heroSub` — quando o resumo do produto muda;
- `features` — quando um recurso entra, sai ou muda de nome;
- `privacyUpdatedAt` — quando a política muda;
- `ogAlt` — só junto com a regeração das OG images, porque o texto está
  desenhado dentro da imagem.

As capturas são as mesmas cinco, copiadas para
`src/assets/vtex-companion/`. O script de capturas escreve nos dois lugares.

Verificação de lá, antes de commitar: `pnpm check` e `pnpm build`, e conferir
que `dist/og/` não existe caso uma rota temporária de OG tenha sido usada.
