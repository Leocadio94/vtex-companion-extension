/**
 * Navegar a aba e esperar ela assentar.
 *
 * `tabs.update` e `tabs.reload` resolvem quando o pedido é aceito, não quando a
 * página nova carregou. Reler a detecção ali devolve o estado anterior — o
 * workspace mostrado continua sendo o antigo até alguém reabrir o painel.
 */

const SETTLE_TIMEOUT_MS = 4000;

/**
 * Espera a aba terminar de carregar. Devolve mesmo assim quando estoura o
 * tempo: uma loja lenta não pode deixar o painel preso em "Lendo a página…".
 */
function waitUntilComplete(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    let timer: number | undefined;

    const done = () => {
      browser.tabs.onUpdated.removeListener(listener);
      window.clearTimeout(timer);
      resolve();
    };

    const listener = (
      updatedTabId: number,
      changeInfo: { status?: string },
    ) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') done();
    };

    browser.tabs.onUpdated.addListener(listener);
    timer = window.setTimeout(done, SETTLE_TIMEOUT_MS);
  });
}

export async function navigateTab(tabId: number, url: string): Promise<void> {
  await browser.tabs.update(tabId, { url });
  await waitUntilComplete(tabId);
}

export async function reloadTab(tabId: number): Promise<void> {
  await browser.tabs.reload(tabId);
  await waitUntilComplete(tabId);
}
