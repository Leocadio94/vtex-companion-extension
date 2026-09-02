/**
 * Página de DevTools: existe só para registrar o painel.
 *
 * Não renderiza nada — o DevTools a carrega escondida quando abre, e é dela que
 * o painel nasce.
 */

// O nome da extensão, não o da plataforma: uma aba "VTEX" ao lado das nativas
// se apresenta como painel oficial, e não é.
browser.devtools.panels.create(
  'VTEX Companion',
  'icon/48.png',
  'devtools-panel.html',
);
