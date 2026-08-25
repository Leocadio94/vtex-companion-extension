/**
 * Extração de account, workspace e ambiente a partir dos sinais coletados.
 * Funções puras — ver `lib/detect/signals.ts` para o contrato.
 */

import type {
  CookieSignals,
  DetectionSignals,
  PageSignals,
  UrlSignals,
  VtexEnvironment,
} from './signals';

/** Hosts em que o subdomínio é o nome da account. */
const ACCOUNT_HOST_SUFFIXES = [
  '.myvtex.com',
  '.vtex.app',
  '.vtexcommercestable.com.br',
  '.vtexassets.com',
  '.vtexcrm.com.br',
];

export interface HostParts {
  account?: string;
  workspace?: string;
  /** O host pertence a um domínio de infraestrutura da VTEX. */
  isVtexHost: boolean;
}

/**
 * Lê `{workspace}--{account}.myvtex.com` e as demais formas de host VTEX.
 * Domínios próprios da loja (`www.acme.com.br`) não carregam essa informação.
 */
export function parseVtexHost(hostname: string): HostParts {
  const host = hostname.toLowerCase();
  const suffix = ACCOUNT_HOST_SUFFIXES.find((candidate) =>
    host.endsWith(candidate),
  );

  if (!suffix) return { isVtexHost: false };

  const subdomain = host.slice(0, -suffix.length);
  if (!subdomain || subdomain.includes('.')) return { isVtexHost: true };

  const [first, second] = subdomain.split('--');

  return second
    ? { account: second, workspace: first, isVtexHost: true }
    : { account: first, isVtexHost: true };
}

/** Accounts que aparecem em URLs de asset (`{account}.vtexassets.com`). */
export function accountFromAssetUrl(url: string): string | undefined {
  const match = url.match(
    /https?:\/\/([a-z0-9-]+)\.(?:vtexassets\.com|vteximg\.com\.br)/i,
  );
  return match?.[1]?.toLowerCase();
}

/**
 * Nome da account, da fonte mais confiável para a menos.
 * Os globais da página vencem o host porque sobrevivem a domínios próprios e a
 * CDNs na frente da loja.
 */
export function resolveAccount(
  url: UrlSignals,
  page?: PageSignals | null,
): string | undefined {
  const fromRuntime = page?.runtime?.account;
  if (fromRuntime) return fromRuntime;

  const fromLegacy = page?.legacy?.accountName;
  if (typeof fromLegacy === 'string' && fromLegacy) return fromLegacy;

  const fromHost = parseVtexHost(url.hostname).account;
  if (fromHost) return fromHost;

  return page?.assetAccounts[0];
}

/** Workspace de IO. `master` conta como workspace nomeado, não como ausência. */
export function resolveWorkspace(
  url: UrlSignals,
  cookies: CookieSignals,
  page?: PageSignals | null,
): string | undefined {
  return (
    page?.runtime?.workspace ??
    parseVtexHost(url.hostname).workspace ??
    cookies.vtexWorkspace ??
    undefined
  );
}

/** A URL aponta para um workspace de desenvolvimento, não para produção. */
export function isWorkspaceUrl(url: UrlSignals): boolean {
  return parseVtexHost(url.hostname).workspace !== undefined;
}

/** Admin da VTEX x loja final. */
export function resolveEnvironment(url: UrlSignals): VtexEnvironment {
  const { isVtexHost } = parseVtexHost(url.hostname);
  if (isVtexHost && url.pathname.startsWith('/admin')) return 'admin';
  if (url.hostname) return 'storefront';
  return 'unknown';
}

export function resolveBinding(page?: PageSignals | null): string | undefined {
  return page?.runtime?.binding?.id;
}

export function resolveIdentity(signals: DetectionSignals) {
  const { url, cookies, page } = signals;
  return {
    account: resolveAccount(url, page),
    workspace: resolveWorkspace(url, cookies, page),
    binding: resolveBinding(page),
    environment: resolveEnvironment(url),
    isWorkspace: isWorkspaceUrl(url),
  };
}
