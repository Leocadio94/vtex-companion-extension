/**
 * Execução da requisição dentro da aba ativa.
 *
 * Rodar na página é o que dá sentido a "usar o cookie da sessão atual": a
 * requisição sai da própria origem, com os cookies que aquela aba tem, sem
 * precisar de permissão de host e sem esbarrar em CORS. O preço é que só
 * chamadas para a origem da aba funcionam — `buildRequest` marca as demais e a
 * UI avisa antes de enviar.
 */

import type { BuiltRequest } from './request';

export interface RunnerResponse {
  ok: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  contentType: string | null;
  headers: Record<string, string>;
  body: string;
  truncated: boolean;
  error?: string;
}

async function runFetch(
  request: BuiltRequest,
  maxBytes: number,
): Promise<RunnerResponse> {
  const started = performance.now();
  const elapsed = () => Math.round(performance.now() - started);

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      credentials: 'include',
    });

    const text = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, name) => {
      headers[name] = value;
    });

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      durationMs: elapsed(),
      contentType: response.headers.get('content-type'),
      headers,
      body: text.slice(0, maxBytes),
      truncated: text.length > maxBytes,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: '',
      durationMs: elapsed(),
      contentType: null,
      headers: {},
      body: '',
      truncated: false,
      error: (error as Error)?.message ?? String(error),
    };
  }
}

/** Teto do corpo trazido de volta. Acima disso o popup não tem o que fazer. */
const MAX_BODY_BYTES = 1_000_000;

export async function runRequest(
  tabId: number,
  request: BuiltRequest,
): Promise<RunnerResponse> {
  try {
    const [result] = await browser.scripting.executeScript({
      target: { tabId },
      func: runFetch,
      args: [request, MAX_BODY_BYTES],
    });

    return (
      (result?.result as RunnerResponse | undefined) ?? {
        ok: false,
        status: 0,
        statusText: '',
        durationMs: 0,
        contentType: null,
        headers: {},
        body: '',
        truncated: false,
        error: 'A página não devolveu resposta.',
      }
    );
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: '',
      durationMs: 0,
      contentType: null,
      headers: {},
      body: '',
      truncated: false,
      error: `Não foi possível executar na aba: ${(error as Error)?.message ?? error}`,
    };
  }
}
