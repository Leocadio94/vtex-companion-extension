/**
 * Construtores de sinais para os testes. Cada fixture representa uma loja real
 * de uma tecnologia diferente.
 */

import type {
  CookieSignals,
  DetectionSignals,
  PageSignals,
  SessionSignals,
  UrlSignals,
} from './signals';

export function urlSignals(href: string): UrlSignals {
  const url = new URL(href);
  return {
    href,
    hostname: url.hostname,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  };
}

export function cookieSignals(
  overrides: Partial<CookieSignals> = {},
): CookieSignals {
  return { names: [], hasAdminAuthCookie: false, ...overrides };
}

export function pageSignals(overrides: Partial<PageSignals> = {}): PageSignals {
  return {
    runtime: null,
    nextData: null,
    legacy: null,
    hasFastStoreMarkup: false,
    hasVtexJs: false,
    assetAccounts: [],
    jsonLdTypes: [],
    href: 'https://example.com/',
    ...overrides,
  };
}

export function sessionSignals(
  overrides: Partial<SessionSignals> = {},
): SessionSignals {
  return { ok: true, ...overrides };
}

export function signals(
  href: string,
  overrides: Partial<Omit<DetectionSignals, 'url'>> = {},
): DetectionSignals {
  return {
    url: urlSignals(href),
    cookies: cookieSignals(),
    page: null,
    session: null,
    ...overrides,
  };
}
