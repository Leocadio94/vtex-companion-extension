# Publicação

Textos e justificativas prontos para colar nos formulários das duas lojas, e o
que os revisores costumam pedir.

## Metadados

| Campo | Valor |
| --- | --- |
| Nome | VTEX Companion |
| Descrição curta | Identifica a tecnologia VTEX do site, abre o preview do FastStore no localhost e chama as APIs com a sessão da aba. |
| Categoria | Ferramentas para desenvolvedores |
| Idioma principal | Português (Brasil) |
| Política de privacidade | <https://leocadio.dev/vtex-companion/privacy/> (EN: `/en/vtex-companion/privacy/`) |
| Site / homepage | <https://leocadio.dev/vtex-companion/> (EN: `/en/vtex-companion/`) |
| Código-fonte | <https://github.com/Leocadio94/vtex-companion-extension> |
| Suporte | <https://github.com/Leocadio94/vtex-companion-extension/issues> |

O `homepage_url` do manifesto aponta para a página de apresentação, não para o
repositório: é o link que o gerenciador de extensões mostra ao usuário, e quem
chega ali pelo aviso de permissão quer saber o que a extensão faz, não ler
código. O repositório fica linkado na própria página.

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

- [ ] `pnpm test`, `pnpm compile` e `pnpm dlx web-ext lint --source-dir .output/firefox-mv3` sem erros
- [ ] Testar num perfil limpo do navegador, sem outras extensões
- [ ] Conferir que a versão em `package.json` subiu
- [ ] Conferir que <https://leocadio.dev/vtex-companion/privacy/> responde 200 e
      apontar o formulário para ela (o texto é mantido no repo do site, não aqui)
- [ ] Conferir que <https://leocadio.dev/vtex-companion/> responde 200 — é o
      `homepage_url` do manifesto, e um link quebrado ali aparece no navegador
      de todo mundo que instalar
- [ ] Capturas de tela em `brand/screenshots/` — **exatamente** 1280×800 ou
      640×400; a Chrome Web Store recusa 1282×800, e a captura de janela do
      Windows costuma sair alguns pixels maior
- [ ] Ícone da listagem: `brand/icon-512.png`

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
2. Em **Account settings**, declarar a condição de *trader* ou *non-trader*. É
   exigência da UE e bloqueia a publicação enquanto estiver em branco; quem
   publica sem fim comercial marca *non-trader*.
3. **Add new item** → subir `vtex-companion-extension-<versão>-chrome.zip`.
4. **Store listing**: descrição curta (o campo corta em 132 caracteres),
   descrição longa, categoria *Developer Tools*, idioma Português (Brasil),
   ícone `brand/icon-512.png`, as cinco capturas de `brand/screenshots/` na
   ordem numerada, e os campos de site e suporte da tabela de metadados.
5. **Privacy**: propósito único, a justificativa de cada permissão e de host
   (os textos deste arquivo), a URL da política e as declarações de uso de
   dados.
6. **Distribution**: público, todas as regiões.
7. **Submit for review**. A primeira submissão de uma conta nova costuma demorar
   mais que as seguintes.

### AMO (Firefox)

1. Criar a conta em <https://addons.mozilla.org/developers/> — gratuita, exige
   uma conta Mozilla e um nome de exibição.
2. **Submit a New Add-on** → *On this site* (listada) → subir
   `vtex-companion-extension-<versão>-firefox.zip`. A validação roda sozinha e
   repete o que o `web-ext lint` já mostrou.
3. Responder **sim** à pergunta sobre código minificado ou compilado, subir
   `vtex-companion-extension-<versão>-sources.zip` e colar as instruções de
   build da seção anterior.
4. Listagem: nome, resumo, descrição, categoria, licença MIT, URL da política,
   site, suporte e capturas. A AMO não exige dimensão fixa nas capturas — as
   mesmas do envio da Chrome servem.
5. Confirmar a declaração de coleta de dados como *nenhuma*, igual ao
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

## Marca

O ícone é uma lupa desenhada para este projeto. A extensão não usa o logo nem a
identidade visual da VTEX, e não é um produto oficial da VTEX — as duas lojas
rejeitam extensões que se apresentam como oficiais de uma marca de terceiro.
