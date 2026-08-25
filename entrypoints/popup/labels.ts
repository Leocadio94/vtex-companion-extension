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

/** Nome por extenso, para quando há espaço de linha inteira. */
export const PLATFORM_FULL: Record<DetectionResult['platform'], string> = {
  io: 'VTEX IO — Store Framework',
  faststore: 'FastStore',
  'cms-legacy': 'CMS Legacy Portal',
  headless: 'Headless — VTEX sem storefront conhecido',
  'not-vtex': 'Não é VTEX',
  unknown: 'Indeterminado',
};
