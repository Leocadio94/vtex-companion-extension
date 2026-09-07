/**
 * Leitura de cookies da aba atual.
 *
 * `browser.cookies` alcança cookies httpOnly, que `document.cookie` não vê —
 * é o único jeito de saber se existe uma sessão de admin (`VtexIdclientAutCookie`)
 * no domínio. Exige permissão de host para a URL; sem ela, a API rejeita e a
 * detecção segue sem esses sinais.
 */

import type { CookieSignals } from '../detect/signals';
import { SEGMENT_COOKIE } from '../segment/segment';

export const ADMIN_AUTH_COOKIE = 'VtexIdclientAutCookie';

export interface CookieTarget {
  url: string;
  name: string;
  secure: boolean;
  sameSite: 'lax' | 'no_restriction';
}

export interface CookieResult {
  ok: boolean;
  message: string;
}

/**
 * Atributos com que um cookie é gravado na origem da aba.
 *
 * `sameSite: 'lax'` de propósito: é o suficiente para as chamadas que a
 * extensão faz, que saem da própria origem, e não afrouxa o cookie além do que
 * a VTEX já usa. `secure` acompanha o protocolo porque o Chrome recusa cookie
 * seguro em http.
 */
export function cookieAttributes(url: string, name: string): CookieTarget | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

    return {
      url: parsed.origin,
      name,
      secure: parsed.protocol === 'https:',
      sameSite: 'lax',
    };
  } catch {
    return null;
  }
}

const EMPTY: CookieSignals = { names: [], hasAdminAuthCookie: false };

export async function readCookies(url: string): Promise<CookieSignals> {
  try {
    const cookies = await browser.cookies.getAll({ url });
    const names = cookies.map((cookie) => cookie.name);

    return {
      names,
      vtexWorkspace: cookies.find((cookie) => cookie.name === 'VtexWorkspace')
        ?.value,
      vtexSegment: cookies.find((cookie) => cookie.name === SEGMENT_COOKIE)
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
