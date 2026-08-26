# Política de Privacidade — VTEX Companion

**Última atualização:** 25 de agosto de 2026

## Resumo

A extensão não coleta, não armazena em servidor e não transmite nenhum dado
seu. Não há servidor: tudo acontece dentro do seu navegador.

## O que a extensão acessa

Para funcionar, a extensão lê dados da aba que você está vendo:

- **Conteúdo da página** — tags de SEO, dados estruturados, scripts carregados e
  variáveis que a loja publica, para identificar a tecnologia VTEX e o tipo de
  página.
- **Cookies do domínio** — para informar se existe sessão de loja ou de admin.
  Cookies são lidos apenas do domínio da aba ativa e do domínio de admin da
  conta detectada.
- **APIs públicas da loja** — a extensão consulta a API de catálogo e a de
  sessão do próprio site que você está visitando, a partir da própria página.

Tudo isso é lido sob demanda, quando você abre o painel, e é descartado quando
o painel fecha.

## Fetch runner

As requisições que você dispara pelo fetch runner saem da aba ativa, para o
domínio dessa aba, com os cookies que aquela aba já possui. A extensão não
intermedeia, não registra e não copia essas respostas para lugar nenhum. O
histórico de requisições fica na memória de sessão do navegador e é apagado
quando o navegador fecha.

## Tokens de sessão

A funcionalidade de sessão grava um cookie de autenticação no domínio que você
escolher, a partir de um token colado por você ou copiado de outro domínio da
mesma conta.

**O token nunca é gravado pela extensão.** Ele existe apenas na memória do
painel enquanto ele está aberto e não é salvo em `storage`, não é sincronizado
entre dispositivos e não sai da sua máquina.

## O que é salvo localmente

Apenas preferências e estado de trabalho, no armazenamento local do navegador:

- Porta do servidor de desenvolvimento e o estado do redirecionamento de preview
- Aba do painel em que você estava
- Última URL de preview capturada, por aba
- Formulário e histórico do fetch runner, durante a sessão do navegador

Nada disso contém credenciais, e nada disso é enviado para fora do navegador.

## Permissões

A extensão pede acesso fixo apenas a `*.myvtex.com` e a `localhost`. O acesso a
domínios de loja é opcional e concedido por você, site a site, ao clicar em
"Conceder acesso a este site".

## Contato

Dúvidas ou problemas:
<https://github.com/Leocadio94/vtex-companion-extension/issues>
