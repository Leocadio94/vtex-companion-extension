/**
 * Ponto de entrada da detecção: junta as três camadas num `DetectionResult`.
 */

import { isAdminDomain, listAuthCookies } from '../auth/names';
import { resolveIdentity } from './account';
import { detectPlatform } from './platform';
import { detectTemplate } from './template';
import type { AuthState, DetectionResult, DetectionSignals } from './signals';

export * from './signals';
export { parseVtexHost, accountFromAssetUrl } from './account';
export { isPreviewUrl, rewritePreviewUrl } from '../preview/rewrite';

function resolveAuth(signals: DetectionSignals): AuthState {
  const { session, cookies, url } = signals;

  return {
    storefront: session?.ok ? Boolean(session.isAuthenticated) : 'unknown',
    storefrontEmail: session?.email,
    admin: cookies.hasAdminAuthCookie,
    cookies: listAuthCookies(cookies.names, isAdminDomain(url.hostname)),
  };
}

/**
 * Id da entidade da página, quando a tecnologia entrega um.
 * O IO publica no `pageContext`; o portal legacy, no payload de eventos.
 */
function resolveEntityId(signals: DetectionSignals): string | undefined {
  const page = signals.page;

  const fromRuntime = page?.runtime?.route?.pageContext?.id;
  if (fromRuntime) return String(fromRuntime);

  const legacy = page?.legacy;
  const fromLegacy =
    legacy?.productId ?? legacy?.['categoryId'] ?? legacy?.['departmentId'];

  return fromLegacy != null && fromLegacy !== ''
    ? String(fromLegacy)
    : undefined;
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
    entityId: resolveEntityId(signals),
    auth: resolveAuth(signals),
  };
}
