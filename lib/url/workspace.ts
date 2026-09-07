/**
 * Abrir a mesma rota em outro workspace.
 *
 * Pura. Existem duas formas de dizer o workspace, e qual delas vale depende do
 * host: `{workspace}--{account}.myvtex.com` no domínio da plataforma, e
 * `?workspace=` no domínio próprio da loja.
 *
 * @see docs/url.md
 */

import { parseVtexHost } from '../detect/account';

export const MASTER = 'master';

const WORKSPACE_PARAM = 'workspace';
const MYVTEX = '.myvtex.com';
const MAX_RECENT = 6;

/** O que a VTEX aceita como nome de workspace. */
const VALID = /^[a-z][a-z0-9]*$/;

function parse(href: string): URL | null {
  try {
    const parsed = new URL(href);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** O workspace que a URL abre hoje. Sem sinal nenhum, é o master. */
export function currentWorkspace(href: string): string {
  const parsed = parse(href);
  if (!parsed) return MASTER;

  const fromHost = parseVtexHost(parsed.hostname).workspace;
  if (fromHost) return fromHost;

  return parsed.searchParams.get(WORKSPACE_PARAM) || MASTER;
}

/**
 * A mesma URL noutro workspace, ou `null` quando o nome ou a URL não servem.
 *
 * No host da plataforma a troca é no subdomínio, e a query `workspace` sai
 * junto: com as duas presentes, quem ganha depende do serviço que responde, e um
 * empate silencioso é pior que uma URL feia.
 */
export function switchWorkspace(href: string, workspace: string): string | null {
  const parsed = parse(href);
  if (!parsed) return null;

  const name = workspace.trim().toLowerCase();
  if (name !== MASTER && !VALID.test(name)) return null;

  const host = parsed.hostname.toLowerCase();

  if (host.endsWith(MYVTEX)) {
    const { account } = parseVtexHost(host);
    if (!account) return null;

    parsed.hostname =
      name === MASTER ? `${account}${MYVTEX}` : `${name}--${account}${MYVTEX}`;
    parsed.searchParams.delete(WORKSPACE_PARAM);
    return parsed.toString();
  }

  if (name === MASTER) parsed.searchParams.delete(WORKSPACE_PARAM);
  else parsed.searchParams.set(WORKSPACE_PARAM, name);

  return parsed.toString();
}

/** Lista de recentes, mais novo na frente e sem repetir. */
export function rememberWorkspace(
  recent: string[],
  workspace: string,
): string[] {
  const name = workspace.trim().toLowerCase();
  if (!name || name === MASTER) return recent;

  return [name, ...recent.filter((item) => item !== name)].slice(0, MAX_RECENT);
}
