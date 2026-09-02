/**
 * Montagem da requisição do fetch runner.
 *
 * Pura: transforma o que o usuário digitou em algo que a sonda executa, ou
 * numa mensagem de erro. Toda a validação vive aqui, e não na UI.
 */

export const METHODS = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
] as const;

export type Method = (typeof METHODS)[number];

/** Métodos que alteram estado e por isso exigem confirmação explícita. */
const UNSAFE: string[] = ['POST', 'PUT', 'PATCH', 'DELETE'];

/** Métodos que não carregam corpo. */
const BODYLESS: string[] = ['GET', 'HEAD'];

export function isUnsafeMethod(method: string): boolean {
  return UNSAFE.includes(method.toUpperCase());
}

export function acceptsBody(method: string): boolean {
  return !BODYLESS.includes(method.toUpperCase());
}

export interface RunnerInput {
  method: string;
  /** Caminho (`/api/...`) ou URL http(s) completa. */
  url: string;
  /** Cabeçalhos livres, um `Nome: valor` por linha. */
  headers: string;
  body: string;
}

const BLANK_REQUEST: RunnerInput = {
  method: 'GET',
  url: '',
  headers: '',
  body: '',
};

/**
 * O que o formulário mostra quando não há nada guardado.
 *
 * Fora de um domínio VTEX o caminho vem vazio: sugerir `/api/sessions` num site
 * qualquer promete uma resposta que não existe ali.
 */
export function defaultRequest(isVtex: boolean): RunnerInput {
  return isVtex
    ? { ...BLANK_REQUEST, url: '/api/sessions?items=*' }
    : BLANK_REQUEST;
}

export interface BuiltRequest {
  url: string;
  method: Method;
  headers: Record<string, string>;
  body?: string;
  /** A URL é da mesma origem da aba ativa. */
  sameOrigin: boolean;
}

export type BuildResult =
  | { ok: true; request: BuiltRequest }
  | { ok: false; error: string };

function parseHeaders(raw: string): Record<string, string> | string {
  const headers: Record<string, string> = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const separator = trimmed.indexOf(':');
    if (separator < 1) {
      return `Cabeçalho inválido: "${trimmed}". Use "Nome: valor".`;
    }

    const name = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!name) return `Cabeçalho sem nome: "${trimmed}".`;

    headers[name] = value;
  }

  return headers;
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  const wanted = name.toLowerCase();
  return Object.keys(headers).some((key) => key.toLowerCase() === wanted);
}

export function buildRequest(
  input: RunnerInput,
  tabOrigin: string,
): BuildResult {
  const method = input.method.toUpperCase() as Method;
  if (!METHODS.includes(method)) {
    return { ok: false, error: `Método não suportado: ${input.method}.` };
  }

  const raw = input.url.trim();
  if (!raw) return { ok: false, error: 'Informe um caminho ou uma URL.' };

  let url: string;
  let sameOrigin: boolean;

  if (raw.startsWith('/')) {
    url = `${tabOrigin}${raw}`;
    sameOrigin = true;
  } else {
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return { ok: false, error: 'Só http e https.' };
      }
      url = parsed.toString();
      sameOrigin = parsed.origin === tabOrigin;
    } catch {
      return {
        ok: false,
        error: 'Comece com "/" para usar a origem da aba, ou informe uma URL completa.',
      };
    }
  }

  const parsedHeaders = parseHeaders(input.headers);
  if (typeof parsedHeaders === 'string') {
    return { ok: false, error: parsedHeaders };
  }

  const headers = { ...parsedHeaders };
  if (!hasHeader(headers, 'accept')) headers['accept'] = 'application/json';

  const body = acceptsBody(method) ? input.body.trim() : '';
  if (body && !hasHeader(headers, 'content-type')) {
    headers['content-type'] = 'application/json';
  }

  return {
    ok: true,
    request: {
      url,
      method,
      headers,
      ...(body ? { body } : {}),
      sameOrigin,
    },
  };
}
