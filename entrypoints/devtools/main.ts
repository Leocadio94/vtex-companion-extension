/**
 * Página de DevTools: existe só para registrar o painel.
 *
 * Não renderiza nada — o DevTools a carrega escondida quando abre, e é dela que
 * o painel nasce.
 */

browser.devtools.panels.create(
  'VTEX',
  'icon/48.png',
  'devtools-panel.html',
);
