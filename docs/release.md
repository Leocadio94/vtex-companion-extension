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

**Documentação** — nenhum release sai com documentação atrasada. A varredura é
sempre a mesma, arquivo por arquivo:

- `README.md` descreve o escopo da versão, então muda sempre que um recurso
  entra ou muda de comportamento;
- `CLAUDE.md` muda quando muda um invariante, uma armadilha ou um contrato que
  um agente quebraria em silêncio — não é changelog, e recurso que não mexe em
  nenhum dos três não entra ali;
- `docs/*.md` — o arquivo do assunto acompanha o código dele: `segment.md`,
  `url.md` e os que vierem depois. Recurso novo com raciocínio próprio ganha o
  seu, e o `CLAUDE.md` só aponta;
- `publicacao.md` muda quando as permissões mudam — ver a regra abaixo;
- `PRIVACY.md` e a política publicada, quando muda o que a extensão lê ou grava.

O que muda em cada um é a razão, não o texto repetido: um assunto tem uma fonte
só, e os outros arquivos apontam para ela.

**Site** — se o comportamento visível mudou, a landing precisa acompanhar. Ver
[o repositório irmão](#o-repositório-irmão).

**Capturas** — `pnpm screenshots`. Elas envelhecem a cada mudança de interface e
são exigidas em **1280×800 exatos**; a Chrome Web Store recusa 1282×800. O
painel sai no tema escuro por padrão, para combinar com as duas capturas
manuais; `--theme=light` ou `--theme=auto` mudam isso, e um número como
argumento refaz só aquela.

**Resto dos artefatos de listagem** — `brand/icon-128.png` é o ícone exigido pela
Chrome Web Store (128×128 exatos, gerado do SVG), `brand/icon-512.png` serve à
AMO, e `pnpm promo` refaz o bloco promocional 440×280. Só mudam quando a marca
muda; estão listados aqui para não serem procurados no meio do envio.

**Changelog** — a seção da versão entra em [`CHANGELOG.md`](../CHANGELOG.md)
aqui, na branch, junto do bump. Ela é escrita a partir das mensagens de commit,
que já são prosa explicando a decisão, e vira o texto do release no GitHub sem
ser reescrita — o arquivo é a fonte, a página cita.

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
arquivos.

## 3. Merge, tag e limpeza

**A tag é o gatilho do envio.** `.github/workflows/release.yml` roda no push de
uma tag `v*.*.*`: refaz o portão, gera os zips e para no ambiente `stores`, que
espera aprovação humana antes de falar com as lojas. Tag empurrada por engano
não publica sozinha — mas fica esperando um clique que ninguém deveria dar.

Nesta ordem, e só depois do merge:

```bash
git checkout main && git pull
git tag v<versão> && git push --tags
git push origin --delete <branch>
```

O release no GitHub sai da seção que já está no `CHANGELOG.md`, com os pacotes
anexados — é onde alguém consegue baixar exatamente o que foi enviado às lojas.
**A Action faz isso sozinha** no push da tag, e recusa a tag cujo `CHANGELOG.md`
não começa pela seção daquela versão: publicar a nota da versão anterior é pior
do que não publicar nota nenhuma. Reexecutar não duplica — atualiza a nota e
troca os pacotes.

À mão, quando a Action estiver fora do ar, é o mesmo texto:

```bash
awk '/^## /{ n++ } n == 1' CHANGELOG.md | tail -n +2 > /tmp/notes.md
gh release create v<versão> --title "v<versão>" \
  --notes-file /tmp/notes.md .output/*.zip
```

**A tag vem depois do merge, nunca antes.** O `sources.zip` que a AMO recebe
precisa ter um commit correspondente na `main`; uma tag numa branch que ainda
pode ser reescrita não serve como referência do que foi enviado.

## 4. Artefatos

```bash
pnpm zip           # .output/vtex-companion-extension-<versão>-chrome.zip
pnpm zip:firefox   # o mesmo, mais -firefox.zip e -sources.zip
```

Daqui em diante o roteiro é o de [`publicacao.md`](./publicacao.md). Com a Action
no ar, este passo é o que ela faz sozinha depois da tag; o que segue é o mesmo
envio pela máquina, para quando se quer olhar de perto ou a Action está fora do
ar. O upload manual pelos dois consoles foi o custo da primeira vez: os itens já
existem nas duas lojas, então da 1.2.0 em diante o envio dos pacotes é

```bash
pnpm dlx wxt submit \
  --chrome-zip .output/*-chrome.zip \
  --firefox-zip .output/*-firefox.zip \
  --firefox-sources-zip .output/*-sources.zip
```

com as credenciais que `wxt submit init` grava num `.env` fora do git, e
`--dry-run` para conferir autenticação sem enviar. Isso automatiza o **pacote**,
não a listagem: descrição, capturas, imagens promocionais e privacidade
continuam sendo campos de console.

## 5. Depois de aprovado

- Guardar as duas URLs de listagem e colocá-las no `README.md` **e** em
  `storeLinks` (`src/data/vtex-companion.ts` do repositório irmão), que é o único
  ponto do código que sabe se a extensão está no ar: `null` deixa o botão em
  "Em breve". Usar a URL canônica com slug que a loja serve, não a de id puro
  que o console mostra.
- Conferir que `https://leocadio.dev/vtex-companion/` responde 200: é o
  `homepage_url` do manifesto, e um link quebrado ali aparece no gerenciador de
  extensões de todo mundo que instalar.

## Regras que não mudam

**Documentação atrasada segura o release.** A varredura do passo 1 é condição
para abrir o PR, não item de faxina posterior: quem revisa lê o texto junto do
diff, e documentação que só chega depois do merge descreve uma versão que já
está nas lojas. Se um arquivo não precisou mudar, isso é uma resposta válida —
o que não vale é não ter olhado.

**Sem bump não há release.** `package.json` é de onde o WXT tira a versão do
manifesto, e é o único lugar onde ela é escrita. Pacote que muda e não sobe o
número não chega às lojas: elas recusam o reenvio de um número publicado, e o
que sobe sem bump é o pacote anterior com outro nome. O bump acontece na branch,
antes do PR, pelo critério minor/patch do passo 1.

**Versão já usada não volta.** Nenhuma das duas lojas aceita reenviar um número
já publicado — por isso o número sobe na branch, e não depois de aprovado.
Rejeição é outra coisa: se o que voltou foi metadado (descrição, capturas,
justificativa), corrige-se o rascunho e reenvia na mesma versão, sem rebuild.
Bump só quando o que muda é o pacote.

**Alterar a listagem publicada custa uma revisão.** Trocar uma linha da descrição
põe o item na fila de novo — sem tirar do ar a versão aprovada, mas com o mesmo
risco de rejeição por metadado que a 1.1.0 já pagou uma vez. Ajuste de texto
viaja junto do próximo release, nunca sozinho.

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
