# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Desenvolvedores que trabalham com lojas VTEX no dia a dia: implementam,
diagnosticam ou integram storefronts (VTEX IO/Store Framework, FastStore,
CMS Legacy Portal, headless). Usam a extensão sobre a aba da loja que já
estão inspecionando, no popup e no painel do DevTools; no Firefox Android,
só o popup.

## Product Purpose

Ferramenta de diagnóstico que responde, sobre a aba aberta: qual tecnologia
VTEX renderiza a página e com quais sinais, o que o catálogo diz do produto
ou da listagem, que achados de SEO a página tem, que pixels e origens de
terceiros carregam, e qual sessão está presente. E o recurso que originou o
projeto: abrir o preview do CMS do FastStore no dev server local com a query
inteira preservada. Sucesso: a resposta chega sem abrir o DevTools,
decodificar cookie ou rodar curl — e sem tocar no estado da loja.

## Positioning

Duas coisas que uma ferramenta vizinha não copia sem custo: (1) detecção em
três camadas de funções puras (URL/cookies, globais da página, Session
Manager) que diz a confiança e o porquê, não só um label; (2) reescrita do
preview do CMS por troca de origin com query preservada, funcionando nas
duas versões do CMS sem conhecer os parâmetros não documentados do novo.
Posicionamento declarado: projeto independente e de código aberto, sem
associação com a VTEX — nunca se apresentar como produto oficial dela.

## Operating Context

- Abas de loja em domínio próprio, `{account}.myvtex.com` e `localhost`.
- Admin da VTEX é território alheio: content script não joga erro no console
  dele; o canal de debug são atributos `data-vtex-companion-*`.
- Desenvolvimento em WSL com navegador no Windows (`pnpm dev`); dev server
  do WXT fixado em 3010 para não competir com FastStore em 3000.
- Publicação nas duas lojas a partir de `docs/publicacao.md`, que leva os
  textos prontos de colar; cada campo de justificativa tem texto próprio.

## Capabilities and Constraints

- Detecção, catálogo, SEO, pixels e sessão são funções puras sobre objetos
  simples; sondas só leem. Toda decisão nova entra como função pura com
  testes antes da sonda em volta.
- Requisições (catálogo, fetch runner) saem de dentro da aba: same-origin,
  sessão da própria aba, sem host permission ampla.
- Sem `<all_urls>`; leitura de página em `activeTab` sob demanda. Acesso
  fixo só a `*.myvtex.com` e `localhost`; origem de loja é permissão
  opcional concedida por clique.
- Nada sai da máquina: sem servidor, sem telemetria. Token de sessão
  nunca é gravado em `storage` nem sai do painel; `storage.sync` não é usado
  (a política promete que o que é salvo fica local).
- Popup em 400×600; no Firefox Android o popup é a interface inteira e o
  painel do DevTools não existe.
- Idioma da interface: português (Brasil), hardcoded — i18n é decisão de
  roadmap que ac Interface e listagem juntas.
- A background service worker morre à vontade: nada mora em estado de
  módulo; preferências em `local:`, efêmero em `session:`.

## Brand Commitments

- Nome: VTEX Companion. Ícone: lupa própria no rosa da VTEX `#F71963` (dark:
  `#ff3d7f`), sem o logo da VTEX.
- Aviso de não associação vai na descrição, no README e no site.
- Voz textual definida no repo irmão `portfolio-astro`
  (`docs/texto-do-site.md`): frases curtas, voz ativa, sem travessão no que
  o usuário lê, negação só quando corrige, sem vocabulário de venda.

## Evidence on Hand

- Capturas da listagem em `brand/screenshots/`, geradas por `pnpm
  screenshots` (1, 4 e 5 automatizadas; 2 e 3 manuais).
- Textos de listagem e justificativas prontos em `docs/publicacao.md`.
- Demo pública para teste sem login: `storetheme.vtex.com`.

## Product Principles

- Decidir é separado de fazer: julgamento em função pura testada, sonda
  fina em volta.
- Falha explícita vence estado oculto: sonda sem resultado é mostrada, não
  escondida; erro não ganha peso de nota de rodapé.
- O admin alheio não se parte: seletores frágeis concentram-se em um
  arquivo e "não achar" é resultado válido.
- O que é copiado, copia com um clique; o que é sensível, pede confirmação
  antes de agir.
- Menos permissão é feature: o aviso que a instalação não mostra é motivo,
  não acaso.

## Accessibility & Inclusion

- Contraste AA nos dois temas (light e dark por `prefers-color-scheme`;
  tema explícito é item de roadmap).
- Público de dev: densidade e atalhos valem mais que passeio, mas foco
  visível em todo controle interativo e rótulo que diz o que faz.
