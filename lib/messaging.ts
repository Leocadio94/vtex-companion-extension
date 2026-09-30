/** Mensagens trocadas entre content script, popup e background. */

export interface ArmOneShotMessage {
  type: 'preview:arm-one-shot';
}

/**
 * Busca de catálogo fora da página: lojas FastStore/headless não servem a
 * API de catálogo no domínio próprio, e a API de `{account}.myvtex.com` não
 * manda CORS. O background tem host permission para `*.myvtex.com`.
 */
export interface CatalogFetchMessage {
  type: 'catalog:fetch';
  account: string;
  paths: string[];
}

export interface CatalogFetchResponse {
  ok: boolean;
  /** Snapshot mapeado, quando algum caminho devolveu produto. */
  snapshot?: unknown;
  error?: string;
}

export type CompanionMessage = ArmOneShotMessage | CatalogFetchMessage;
