/**
 * A quem o preview no `localhost` se aplica.
 *
 * O recurso é do CMS do FastStore — o botão "Pré-visualização" do Headless CMS
 * e do Storefront > Content. VTEX IO e o portal legacy têm pré-visualização
 * própria, por workspace, que não passa por aqui. A aba precisa dizer isso em
 * vez de oferecer controles inertes.
 */

import type { DetectionResult } from '../detect/signals';

export type PreviewFit = 'admin' | 'faststore' | 'other-platform' | 'unknown';

/**
 * O admin vem antes da plataforma de propósito: é de lá que o preview nasce, e
 * uma aba do admin não revela se a conta usa FastStore ou não.
 */
export function previewFit(result: DetectionResult | null): PreviewFit {
  if (!result) return 'unknown';
  if (result.environment === 'admin') return 'admin';
  if (result.platform === 'faststore') return 'faststore';
  if (result.platform === 'io' || result.platform === 'cms-legacy') {
    return 'other-platform';
  }

  return 'unknown';
}
