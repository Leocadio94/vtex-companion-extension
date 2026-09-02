/**
 * Escrita do cookie de sessão VTEX.
 *
 * É a parte da extensão que mexe com credencial, então duas regras valem para
 * tudo aqui: o valor nunca é persistido em `storage` nem sai da máquina, e a
 * escrita só é oferecida em domínio reconhecido como VTEX — colar um token de
 * admin numa página qualquer não teria utilidade e teria risco.
 */

import { AUTH_COOKIE, authCookieNames, pickSourceCookie } from './names';

export {
  AUTH_COOKIE,
  authCookieNames,
  isAdminDomain,
  listAuthCookies,
  pickSourceCookie,
} from './names';
export type { AuthCookieInfo, AuthScope } from './names';

export interface CookieTarget {
  url: string;
  name: string;
  secure: boolean;
  sameSite: 'lax' | 'no_restriction';
}

/**
 * Atributos com que o cookie é gravado.
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

export interface CookieResult {
  ok: boolean;
  message: string;
}

export async function writeAuthCookie(
  url: string,
  name: string,
  value: string,
): Promise<CookieResult> {
  const target = cookieAttributes(url, name);
  if (!target) return { ok: false, message: 'URL da aba não aceita cookie.' };

  try {
    await browser.cookies.set({
      url: target.url,
      name: target.name,
      value,
      path: '/',
      secure: target.secure,
      // Espelha o cookie real: o JavaScript da página não deve conseguir lê-lo.
      httpOnly: true,
      sameSite: target.sameSite,
    });

    return { ok: true, message: `${target.name} gravado em ${target.url}.` };
  } catch (error) {
    return {
      ok: false,
      message: `Não foi possível gravar: ${(error as Error)?.message ?? error}`,
    };
  }
}

export async function clearAuthCookie(
  url: string,
  name: string,
): Promise<CookieResult> {
  const target = cookieAttributes(url, name);
  if (!target) return { ok: false, message: 'URL da aba não aceita cookie.' };

  try {
    await browser.cookies.remove({ url: target.url, name: target.name });
    return { ok: true, message: `${target.name} removido de ${target.url}.` };
  } catch (error) {
    return {
      ok: false,
      message: `Não foi possível remover: ${(error as Error)?.message ?? error}`,
    };
  }
}

/**
 * Apaga toda a sessão VTEX da origem — a do admin e a do shopper.
 *
 * Relê os cookies no fim em vez de confiar no `remove`: um cookie gravado no
 * domínio pai, ou num path que não seja `/`, sobrevive à remoção pela URL da
 * aba, e a mensagem precisa dizer isso em vez de anunciar um sucesso que não
 * aconteceu.
 */
export async function clearSession(url: string): Promise<CookieResult> {
  const target = cookieAttributes(url, AUTH_COOKIE);
  if (!target) return { ok: false, message: 'URL da aba não aceita cookie.' };

  let present: string[];
  try {
    const cookies = await browser.cookies.getAll({ url: target.url });
    present = authCookieNames(cookies.map((cookie) => cookie.name));
  } catch {
    return { ok: false, message: `Sem permissão para ler ${target.url}.` };
  }

  if (present.length === 0) {
    return { ok: true, message: 'Nenhuma sessão VTEX nesta origem.' };
  }

  try {
    await Promise.all(
      present.map((name) => browser.cookies.remove({ url: target.url, name })),
    );
  } catch (error) {
    return {
      ok: false,
      message: `Não foi possível remover: ${(error as Error)?.message ?? error}`,
    };
  }

  const after = await browser.cookies.getAll({ url: target.url });
  const left = authCookieNames(after.map((cookie) => cookie.name));

  if (left.length > 0) {
    return {
      ok: false,
      message: `Sobrou ${left.join(', ')} — provavelmente gravado no domínio pai.`,
    };
  }

  return {
    ok: true,
    message: `${present.length} cookie${present.length > 1 ? 's' : ''} de sessão removido${present.length > 1 ? 's' : ''} de ${target.url}.`,
  };
}

/**
 * Copia a sessão de `{account}.myvtex.com` para o domínio da aba.
 *
 * Evita o copiar-e-colar do token, que é onde uma credencial costuma vazar —
 * ela passa pelo clipboard, pelo histórico do terminal, pela conversa.
 */
export async function cloneAuthCookie(
  account: string,
  targetUrl: string,
  targetName: string,
): Promise<CookieResult> {
  const source = `https://${account}.myvtex.com`;

  let cookies;
  try {
    cookies = await browser.cookies.getAll({ url: source });
  } catch {
    return {
      ok: false,
      message: `Sem permissão para ler cookies de ${source}.`,
    };
  }

  const found = pickSourceCookie(cookies, account);
  if (!found) {
    return {
      ok: false,
      message: `Nenhuma sessão de admin em ${source}. Faça login lá primeiro.`,
    };
  }

  const result = await writeAuthCookie(targetUrl, targetName, found.value);
  return result.ok
    ? { ok: true, message: `${found.name} copiado de ${source}.` }
    : result;
}
