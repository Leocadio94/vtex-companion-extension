/**
 * Probe da Session Manager: confirma que o domínio é VTEX e diz se há shopper
 * autenticado. É a camada mais cara da detecção, então só roda depois das
 * outras duas.
 */

import type { SessionSignals } from '../detect/signals';

const FAILED: SessionSignals = { ok: false };

interface SessionResponse {
  namespaces?: {
    profile?: {
      isAuthenticated?: { value?: string | boolean };
      email?: { value?: string };
    };
    store?: {
      channel?: { value?: string };
      cultureInfo?: { value?: string };
      currencyCode?: { value?: string };
    };
  };
}

function asBoolean(value: string | boolean | undefined): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

/**
 * `origin` é a origem da loja (`https://www.acme.com.br`). Precisa de permissão
 * de host — sem ela a requisição falha e a detecção fica sem o estado de login,
 * sem quebrar o resto.
 */
export async function probeSession(origin: string): Promise<SessionSignals> {
  try {
    const response = await fetch(`${origin}/api/sessions?items=*`, {
      credentials: 'include',
      headers: { accept: 'application/json' },
    });

    if (!response.ok) return FAILED;

    const data = (await response.json()) as SessionResponse;
    const profile = data.namespaces?.profile;
    const store = data.namespaces?.store;

    return {
      ok: true,
      isAuthenticated: asBoolean(profile?.isAuthenticated?.value),
      email: profile?.email?.value,
      channel: store?.channel?.value,
      cultureInfo: store?.cultureInfo?.value,
      currencyCode: store?.currencyCode?.value,
    };
  } catch {
    return FAILED;
  }
}
