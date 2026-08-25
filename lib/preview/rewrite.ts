/**
 * Reescreve a URL que o botão "Pré-visualização" do CMS abre para o servidor de
 * desenvolvimento local do FastStore.
 *
 * Funções puras: nada de `browser.*`, nada de DOM. É o núcleo do recurso e o
 * único ponto que precisa entender os dois formatos de preview.
 */

/** Parâmetros que identificam o preview do Headless CMS (legacy). */
const LEGACY_PARAMS = ['contentType', 'documentId', 'versionId'] as const;

/** Path que o CMS novo usa na Preview URL configurada por loja. */
const PREVIEW_PATH = '/api/preview';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

export interface RewriteOptions {
  /** Porta do `pnpm dev` do FastStore. O default do framework é 3000. */
  port: number;
}

function parse(url: string): URL | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed;
  } catch {
    return null;
  }
}

function isPreviewPath(pathname: string): boolean {
  return pathname === PREVIEW_PATH || pathname === `${PREVIEW_PATH}/`;
}

function hasLegacyParams(params: URLSearchParams): boolean {
  return LEGACY_PARAMS.every((name) => params.has(name));
}

/**
 * `true` quando a URL é um preview de CMS que ainda aponta para um host remoto.
 *
 * URLs que já apontam para o localhost são rejeitadas de propósito: o
 * redirecionamento de aba as veria de novo depois de reescrever e entraria em
 * loop.
 */
export function isPreviewUrl(url: string): boolean {
  const parsed = parse(url);
  if (!parsed) return false;
  if (LOCAL_HOSTNAMES.has(parsed.hostname)) return false;

  return isPreviewPath(parsed.pathname) || hasLegacyParams(parsed.searchParams);
}

/**
 * Devolve a URL equivalente no servidor local, ou `null` se a entrada não for
 * um preview reescrevível.
 *
 * A query é preservada inteira — é isso que faz o recurso valer para o CMS novo,
 * cujos parâmetros não são documentados publicamente. Só o path da raiz é
 * trocado, porque o preview legacy chega em `/` e o FastStore expõe a rota de
 * preview em `/api/preview`.
 */
export function rewritePreviewUrl(
  url: string,
  { port }: RewriteOptions,
): string | null {
  if (!isPreviewUrl(url)) return null;

  const parsed = parse(url);
  if (!parsed) return null;

  const local = new URL(parsed.toString());
  local.protocol = 'http:';
  local.hostname = 'localhost';
  local.port = String(port);

  if (local.pathname === '/' || local.pathname === '') {
    local.pathname = PREVIEW_PATH;
  }

  return local.toString();
}

/**
 * Monta a URL local a partir do link "Open API URL" que o painel Development
 * Mode do Headless CMS mostra.
 *
 * É o caminho do userscript: o link aponta para a API do CMS
 * (`.../{contentType}/{documentId}?versionId=…`), e o preview local quer esses
 * mesmos três valores como query. Só existe com `cmsDevMode` ligado — o botão
 * injetado cobre o resto do tempo.
 */
export function previewUrlFromCmsApiUrl(
  apiUrl: string,
  { port }: RewriteOptions,
): string | null {
  const parsed = parse(apiUrl);
  if (!parsed) return null;

  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null;

  const [contentType, documentId] = segments.slice(-2) as [string, string];
  const versionId = parsed.searchParams.get('versionId');

  const local = new URL(`http://localhost:${port}${PREVIEW_PATH}`);
  local.searchParams.set('contentType', contentType);
  local.searchParams.set('documentId', documentId);
  if (versionId) local.searchParams.set('versionId', versionId);

  return local.toString();
}
