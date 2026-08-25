/**
 * Orquestra as três camadas de detecção para a aba ativa.
 *
 * Roda no popup, não no background: a leitura só acontece quando o usuário abre
 * o painel, e é o clique dele que ativa a permissão `activeTab`. Isso evita ter
 * um content script registrado em `<all_urls>`, que traria o aviso de "ler dados
 * em todos os sites" na instalação.
 */

import { detect } from './detect';
import type { DetectionResult, UrlSignals } from './detect/signals';
import { readCookies } from './browser/cookies';
import { collectPageSignals } from './browser/probe';
import { probeSession } from './vtex/session';

export interface TabContext {
  tabId: number;
  url: string;
  origin: string;
  /** A extensão tem permissão de host para esta origem. */
  hasHostPermission: boolean;
}

export async function getActiveTabContext(): Promise<TabContext | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return null;

  let origin: string;
  try {
    const parsed = new URL(tab.url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    origin = parsed.origin;
  } catch {
    return null;
  }

  return {
    tabId: tab.id,
    url: tab.url,
    origin,
    hasHostPermission: await browser.permissions.contains({
      origins: [`${origin}/*`],
    }),
  };
}

export function toUrlSignals(href: string): UrlSignals {
  const url = new URL(href);
  return {
    href,
    hostname: url.hostname,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  };
}

export async function collectDetection(
  context: TabContext,
): Promise<DetectionResult> {
  const url = toUrlSignals(context.url);

  const [cookies, page] = await Promise.all([
    readCookies(context.url),
    collectPageSignals(context.tabId),
  ]);

  // O probe de sessão é a camada cara e só faz sentido na loja: no admin o
  // cookie de autenticação já responde a pergunta.
  const isAdmin = url.pathname.startsWith('/admin');
  const session =
    isAdmin || !context.hasHostPermission
      ? null
      : await probeSession(context.origin);

  return detect({ url, cookies, page, session });
}
