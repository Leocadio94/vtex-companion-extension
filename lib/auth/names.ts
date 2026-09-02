/**
 * Nomes dos cookies de sessão VTEX, e o que cada um significa.
 *
 * Puro de propósito: a detecção precisa dessa leitura e não pode depender de
 * `browser.*`. Quem escreve e apaga é `./cookie.ts`.
 */

export const AUTH_COOKIE = 'VtexIdclientAutCookie';

/** `admin` é sessão do admin; `store` é o login do shopper na loja. */
export type AuthScope = 'admin' | 'store';

export interface AuthCookieInfo {
  name: string;
  scope: AuthScope;
  /** Account do sufixo, quando o nome traz um. */
  account?: string;
}

/**
 * Classifica os cookies de sessão presentes numa origem.
 *
 * O mesmo nome sufixado quer dizer coisas diferentes conforme o domínio: em
 * `{account}.myvtex.com` ele é o token do admin daquela conta — é o que
 * `pickSourceCookie` procura para clonar —, e no domínio da loja é o login do
 * shopper pelo VTEX ID. Por isso a classificação depende do host, não só do
 * nome.
 */
export function listAuthCookies(
  names: string[],
  isAdminHost: boolean,
): AuthCookieInfo[] {
  return authCookieNames(names).map((name) => {
    if (!name.startsWith(`${AUTH_COOKIE}_`)) {
      return { name, scope: 'admin' as AuthScope };
    }

    const account = name.slice(AUTH_COOKIE.length + 1);
    return {
      name,
      scope: (isAdminHost ? 'admin' : 'store') as AuthScope,
      account: account || undefined,
    };
  });
}

/** Os nomes de cookie de sessão VTEX presentes, sem julgar o que cada um é. */
export function authCookieNames(names: string[]): string[] {
  return names.filter((name) => name.startsWith(AUTH_COOKIE));
}

/** Host em que o cookie sufixado pela account é do admin, não do shopper. */
export function isAdminDomain(hostname: string): boolean {
  return hostname.endsWith('.myvtex.com');
}

/**
 * Qual cookie do admin usar como origem da cópia.
 *
 * O VTEX ID grava o token do admin com o nome sufixado pela account, e às vezes
 * também o nome puro. O sufixado é o do admin daquela conta, então vence.
 */
export function pickSourceCookie<T extends { name: string; value: string }>(
  cookies: T[],
  account: string,
): T | null {
  const suffixed = cookies.find(
    (cookie) => cookie.name === `${AUTH_COOKIE}_${account}`,
  );
  if (suffixed?.value) return suffixed;

  const plain = cookies.find((cookie) => cookie.name === AUTH_COOKIE);
  return plain?.value ? plain : null;
}
