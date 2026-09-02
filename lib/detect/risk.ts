/**
 * Risco da sessão de admin na aba, derivado do `DetectionResult`.
 *
 * Função pura: quem decide se o aviso aparece mora aqui, e o cabeçalho só
 * pinta o que ela devolve.
 */

import type { DetectionResult } from './signals';

export type RiskLevel = 'none' | 'warn';

export interface SessionRisk {
  level: RiskLevel;
  message?: string;
}

const NONE: SessionRisk = { level: 'none' };

/** Hosts em que um cookie de admin não representa risco nenhum. */
function isLocal(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.localhost')
  );
}

/**
 * Avisa quando há sessão de admin numa loja que serve conteúdo de produção.
 *
 * O cookie no admin é o esperado, e num workspace de desenvolvimento é o que
 * torna o preview possível. O caso que merece aviso é o outro: navegar a loja
 * publicada autenticado como admin, onde um clique em Site Editor edita o que
 * o cliente final está vendo.
 */
export function sessionRisk(
  result: DetectionResult,
  hostname: string,
): SessionRisk {
  if (!result.isVtex || !result.auth.admin) return NONE;
  if (result.environment !== 'storefront') return NONE;
  if (isLocal(hostname)) return NONE;

  // `isWorkspace` cobre `{ws}--{account}.myvtex.com`; o `workspace` cobre o
  // caso em que a URL não carrega o nome mas o runtime carrega.
  if (result.isWorkspace) return NONE;
  if (result.workspace && result.workspace !== 'master') return NONE;

  return {
    level: 'warn',
    message: 'Sessão de admin numa loja de produção.',
  };
}
