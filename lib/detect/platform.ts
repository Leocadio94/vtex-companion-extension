/**
 * Qual tecnologia VTEX está por trás da página.
 *
 * A ordem importa: `window.vtexjs` existe no checkout de todas as tecnologias,
 * e `__NEXT_DATA__` existe em qualquer loja Next headless. Por isso o sinal mais
 * específico é avaliado primeiro e os genéricos só desempatam no fim.
 */

import type {
  Confidence,
  DetectionSignals,
  VtexPlatform,
} from './signals';

/** Cookies que só aparecem em domínios servidos pela VTEX. */
const VTEX_COOKIE_NAMES = [
  'vtex_segment',
  'vtex_session',
  'checkout.vtex.com',
  'VtexWorkspace',
  'VtexRCMacIdv7',
  'janus_sid',
];

export interface PlatformVerdict {
  platform: VtexPlatform;
  confidence: Confidence;
  reasons: string[];
}

function hasVtexCookie(names: string[]): boolean {
  return names.some((name) => VTEX_COOKIE_NAMES.includes(name));
}

export function detectPlatform(signals: DetectionSignals): PlatformVerdict {
  const { cookies, page, session } = signals;
  const reasons: string[] = [];

  if (page?.runtime) {
    reasons.push('window.__RUNTIME__ presente');
    return { platform: 'io', confidence: 'high', reasons };
  }

  if (page?.hasFastStoreMarkup) {
    reasons.push('markup com atributos data-fs-*');
    if (page.nextData) reasons.push('window.__NEXT_DATA__ presente');
    return { platform: 'faststore', confidence: 'high', reasons };
  }

  if (page?.legacy) {
    reasons.push('vtex.events.addData presente');
    return { platform: 'cms-legacy', confidence: 'high', reasons };
  }

  // A partir daqui não há runtime reconhecível. Ainda dá para afirmar que é
  // VTEX — só não dá para afirmar qual storefront.
  const vtexEvidence: string[] = [];
  if (page?.assetAccounts.length) vtexEvidence.push('assets em vtexassets/vteximg');
  if (hasVtexCookie(cookies.names)) vtexEvidence.push('cookies de sessão VTEX');
  if (session?.ok) vtexEvidence.push('/api/sessions respondeu');
  if (page?.hasVtexJs) vtexEvidence.push('window.vtexjs presente');

  if (vtexEvidence.length === 0) {
    return { platform: 'not-vtex', confidence: 'none', reasons };
  }

  reasons.push(...vtexEvidence);

  // Next sem marcação do FastStore: loja headless com frontend próprio.
  if (page?.nextData) {
    reasons.unshift('Next.js sem marcação do FastStore');
    return { platform: 'headless', confidence: 'medium', reasons };
  }

  return {
    platform: 'headless',
    confidence: vtexEvidence.length > 1 ? 'medium' : 'low',
    reasons,
  };
}
