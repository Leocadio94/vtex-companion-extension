/**
 * Ponto de entrada da detecção: junta as três camadas num `DetectionResult`.
 */

import { resolveIdentity } from './account';
import { detectPlatform } from './platform';
import { detectTemplate } from './template';
import type { AuthState, DetectionResult, DetectionSignals } from './signals';

export * from './signals';
export { parseVtexHost, accountFromAssetUrl } from './account';
export { isPreviewUrl, rewritePreviewUrl } from '../preview/rewrite';

function resolveAuth(signals: DetectionSignals): AuthState {
  const { session, cookies } = signals;

  return {
    storefront: session?.ok ? Boolean(session.isAuthenticated) : 'unknown',
    storefrontEmail: session?.email,
    admin: cookies.hasAdminAuthCookie,
  };
}

export function detect(signals: DetectionSignals): DetectionResult {
  const { platform, confidence, reasons } = detectPlatform(signals);
  const identity = resolveIdentity(signals);
  const { template, reason } = detectTemplate(signals, platform);

  return {
    isVtex: platform !== 'not-vtex',
    confidence,
    platform,
    reasons,
    ...identity,
    template,
    templateReason: reason,
    auth: resolveAuth(signals),
  };
}
