import type { TabContext } from '@/lib/collect';
import type { DetectionResult } from '@/lib/detect/signals';

/** Cabe no badge do cabeçalho, ao lado do título. */
export const PLATFORM_SHORT: Record<DetectionResult['platform'], string> = {
  io: 'VTEX IO',
  faststore: 'FastStore',
  'cms-legacy': 'CMS Legacy',
  headless: 'Headless',
  'not-vtex': 'Não é VTEX',
  unknown: 'Indeterminado',
};

/**
 * Linha de identidade do cabeçalho: account, workspace e ambiente.
 *
 * Fora da VTEX não há o que resumir, e o hostname é a única identidade útil.
 */
export function identityLine(
  context: TabContext | null,
  result: DetectionResult | null,
): string | null {
  if (!context) return null;

  const hostname = new URL(context.url).hostname;
  if (!result?.isVtex) return hostname;

  const parts = [result.account ?? hostname];
  if (result.workspace) parts.push(result.workspace);
  parts.push(result.environment === 'admin' ? 'Admin' : 'Loja');

  return parts.join(' · ');
}

/** Nome por extenso, para quando há espaço de linha inteira. */
export const PLATFORM_FULL: Record<DetectionResult['platform'], string> = {
  io: 'VTEX IO — Store Framework',
  faststore: 'FastStore',
  'cms-legacy': 'CMS Legacy Portal',
  headless: 'Headless — VTEX sem storefront conhecido',
  'not-vtex': 'Não é VTEX',
  unknown: 'Indeterminado',
};
