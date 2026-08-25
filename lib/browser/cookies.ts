/**
 * Leitura de cookies da aba atual.
 *
 * `browser.cookies` alcança cookies httpOnly, que `document.cookie` não vê —
 * é o único jeito de saber se existe uma sessão de admin (`VtexIdclientAutCookie`)
 * no domínio. Exige permissão de host para a URL; sem ela, a API rejeita e a
 * detecção segue sem esses sinais.
 */

import type { CookieSignals } from '../detect/signals';

export const ADMIN_AUTH_COOKIE = 'VtexIdclientAutCookie';

const EMPTY: CookieSignals = { names: [], hasAdminAuthCookie: false };

export async function readCookies(url: string): Promise<CookieSignals> {
  try {
    const cookies = await browser.cookies.getAll({ url });
    const names = cookies.map((cookie) => cookie.name);

    return {
      names,
      vtexWorkspace: cookies.find((cookie) => cookie.name === 'VtexWorkspace')
        ?.value,
      // O cookie de admin é emitido por prefixo em alguns fluxos
      // (`VtexIdclientAutCookie_{account}`), então a checagem é por prefixo.
      hasAdminAuthCookie: names.some((name) =>
        name.startsWith(ADMIN_AUTH_COOKIE),
      ),
    };
  } catch {
    return EMPTY;
  }
}
