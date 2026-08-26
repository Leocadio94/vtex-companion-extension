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
| Política de privacidade | `PRIVACY.md` deste repositório, publicado numa URL acessível |

## Propósito único (Chrome Web Store)

> Ferramenta de diagnóstico para desenvolvedores que trabalham com lojas VTEX:
> identifica qual tecnologia VTEX a página usa, mostra dados de SEO, catálogo e
> scripts de terceiros daquela página, permite chamar as APIs da própria loja
> com a sessão da aba, e abre o preview do CMS no servidor de desenvolvimento
> local.

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

**`webNavigation`** — Detectar quando o CMS da VTEX abre uma aba de preview,
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
- [ ] Publicar `PRIVACY.md` numa URL pública e apontar o formulário para ela
- [ ] Capturas de tela em `brand/screenshots/` — **exatamente** 1280×800 ou
      640×400; a Chrome Web Store recusa 1282×800, e a captura de janela do
      Windows costuma sair alguns pixels maior
- [ ] Ícone da listagem: `brand/icon-512.png`

## Capturas

Ficam em `brand/screenshots/`, junto do ícone da listagem. **O número do arquivo
é a ordem de envio**, e a ordem importa: a Chrome Web Store exibe na sequência
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
