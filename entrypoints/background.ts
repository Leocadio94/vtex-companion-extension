import type { CompanionMessage } from '@/lib/messaging';
import { isPreviewUrl, rewritePreviewUrl } from '@/lib/preview/rewrite';
import { forgetTab, rememberPreview } from '@/lib/preview/store';
import {
  ONE_SHOT_TTL_MS,
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

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: CompanionMessage) => {
    if (message?.type === 'preview:arm-one-shot') {
      return oneShotUntil.setValue(Date.now() + ONE_SHOT_TTL_MS).then(() => true);
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
