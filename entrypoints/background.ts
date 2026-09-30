import type { CompanionMessage } from '@/lib/messaging';
import { mapProductSnapshot } from '@/lib/catalog/map';
import { catalogApiHost } from '@/lib/catalog/probe';
import { isPreviewUrl, rewritePreviewUrl } from '@/lib/preview/rewrite';
import { forgetTab, rememberPreview } from '@/lib/preview/store';
import {
  ONE_SHOT_TTL_MS,
  migrateFromSync,
  oneShotUntil,
  previewPort,
  previews,
  redirectPreview,
} from '@/lib/settings';

/** A aba que abriu esta foi um admin VTEX? Devolve também qual era. */
async function findAdminOpener(tabId: number): Promise<number | undefined> {
  try {
    const tab = await browser.tabs.get(tabId);
    if (tab.openerTabId === undefined) return undefined;

    const opener = await browser.tabs.get(tab.openerTabId);
    if (!opener.url) return undefined;

    const { hostname, pathname } = new URL(opener.url);
    return hostname.endsWith('.myvtex.com') && pathname.startsWith('/admin')
      ? tab.openerTabId
      : undefined;
  } catch {
    return undefined;
  }
}

/** Consome a arma de uso único do botão injetado, se ainda estiver válida. */
async function consumeOneShot(): Promise<boolean> {
  const until = await oneShotUntil.getValue();
  if (until === null) return false;

  await oneShotUntil.setValue(null);
  return until > Date.now();
}

/**
 * Catálogo no domínio de API da conta. A conta vem da detecção, mas o host
 * é reconstruído e validado aqui: a mensagem poderia vir de qualquer um, e
 * a permissão do background vale só para `*.myvtex.com`.
 */
async function fetchCatalogFromAccount(
  account: string,
  paths: string[],
): Promise<{ ok: boolean; snapshot?: unknown; error?: string }> {
  const host = catalogApiHost(account);
  if (!host || !Array.isArray(paths) || paths.length === 0) {
    return { ok: false, error: 'conta inválida' };
  }

  for (const path of paths) {
    if (typeof path !== 'string' || !path.startsWith('/api/catalog_system/')) {
      continue;
    }

    try {
      const response = await fetch(`https://${host}${path}`, {
        headers: { accept: 'application/json' },
      });
      if (!response.ok) continue;
      const json = await response.json();
      if (!Array.isArray(json) || json.length === 0) continue;

      return { ok: true, snapshot: mapProductSnapshot(json) };
    } catch (error) {
      return { ok: false, error: (error as Error)?.message ?? 'erro' };
    }
  }

  return { ok: false };
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => void migrateFromSync());

  browser.runtime.onMessage.addListener((message: CompanionMessage, _sender, sendResponse) => {
    // Chrome ignora Promise devolvida de listener e só entrega resposta por
    // `sendResponse` com `return true`; Firefox é o contrário. O 3º argumento
    // só existe no Chrome, e a presença dele decide o caminho.
    const chromeStyle = typeof sendResponse === 'function';

    if (message?.type === 'preview:arm-one-shot') {
      const done = oneShotUntil
        .setValue(Date.now() + ONE_SHOT_TTL_MS)
        .then(() => true);
      if (chromeStyle) {
        void done.then(sendResponse);
        return true;
      }
      return done;
    }

    if (message?.type === 'catalog:fetch') {
      const done = fetchCatalogFromAccount(message.account, message.paths);
      if (chromeStyle) {
        void done.then(sendResponse);
        return true;
      }
      return done;
    }

    return undefined;
  });

  browser.tabs.onRemoved.addListener(async (tabId) => {
    await previews.setValue(forgetTab(await previews.getValue(), tabId));
  });

  browser.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Só o frame principal: o preview abre numa aba nova, nunca num iframe.
    if (details.frameId !== 0) return;
    if (!isPreviewUrl(details.url)) return;

    const openerTabId = await findAdminOpener(details.tabId);
    const armed = await consumeOneShot();
    const shouldRedirect =
      armed || ((await redirectPreview.getValue()) && openerTabId !== undefined);

    // A URL é registrada mesmo sem redirecionar: é ela que o popup transforma
    // em link local quando o toggle está desligado.
    await previews.setValue(
      rememberPreview(await previews.getValue(), {
        url: details.url,
        capturedAt: Date.now(),
        redirected: shouldRedirect,
        tabId: details.tabId,
        openerTabId,
      }),
    );

    if (!shouldRedirect) return;

    const local = rewritePreviewUrl(details.url, {
      port: await previewPort.getValue(),
    });
    if (!local) return;

    await browser.tabs.update(details.tabId, { url: local });
  });
});
