import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // O projeto é desenvolvido no WSL, com os navegadores no Windows: não há
  // binário de browser para o WXT abrir. `pnpm dev` só compila e observa; a
  // extensão é carregada à mão.
  webExt: { disabled: true },
  // 3000 é a porta do dev server do FastStore. O WXT escolheria a próxima
  // livre sozinho, mas fixar deixa o endereço de HMR previsível.
  dev: { server: { port: 3010 } },
  srcDir: '.',
  // Firefox também sai em MV3: o default do WXT ainda é MV2 para o Gecko, e o
  // MV2 não tem `optional_host_permissions`, que é a base da nossa estratégia
  // de permissões.
  manifestVersion: 3,
  manifest: {
    name: 'VTEX Companion',
    description:
      'Identifies the VTEX technology behind the current site and unlocks the FastStore localhost preview.',
    permissions: [
      'storage',
      'activeTab',
      'scripting',
      'tabs',
      'webNavigation',
      'cookies',
    ],
    host_permissions: ['*://*.myvtex.com/*', 'http://localhost/*'],
    optional_host_permissions: ['*://*/*'],
    browser_specific_settings: {
      gecko: {
        id: 'vtex-companion@gabrielleocadio.dev',
        // `world: "MAIN"` scripting needs 128+; `data_collection_permissions`
        // needs 140+, so 140 is the real floor.
        strict_min_version: '140.0',
        // Required by AMO for new extensions. Nothing leaves the browser.
        data_collection_permissions: { required: ['none'] },
      },
      gecko_android: { strict_min_version: '142.0' },
    },
  },
});
