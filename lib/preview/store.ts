/**
 * Memória das URLs de preview capturadas, indexada por aba.
 *
 * Guardar uma URL só, global, fazia o popup oferecer o mesmo link de preview em
 * qualquer aba do navegador. O que interessa é a aba do admin de onde o preview
 * saiu — e a própria aba do preview, para quem já está olhando para ela.
 */

export interface CapturedPreview {
  url: string;
  capturedAt: number;
  /** Foi redirecionada automaticamente ou só observada. */
  redirected: boolean;
  /** Aba em que o preview abriu. */
  tabId: number;
  /** Aba do admin que abriu o preview, quando conhecida. */
  openerTabId?: number;
}

export type PreviewsByTab = Record<string, CapturedPreview>;

/** Quantas abas ficam na memória antes das mais antigas caírem. */
export const MAX_REMEMBERED = 10;

function ownerKey(preview: CapturedPreview): string {
  return String(preview.openerTabId ?? preview.tabId);
}

export function rememberPreview(
  previews: PreviewsByTab,
  preview: CapturedPreview,
): PreviewsByTab {
  const next: PreviewsByTab = { ...previews, [ownerKey(preview)]: preview };

  const keys = Object.keys(next);
  if (keys.length <= MAX_REMEMBERED) return next;

  const surviving = keys
    .sort((a, b) => (next[b]?.capturedAt ?? 0) - (next[a]?.capturedAt ?? 0))
    .slice(0, MAX_REMEMBERED);

  return Object.fromEntries(surviving.map((key) => [key, next[key]!]));
}

/**
 * O preview que interessa para a aba ativa: o que ela abriu (é o admin) ou o
 * que está aberto nela (é a própria aba de preview).
 */
export function findPreviewForTab(
  previews: PreviewsByTab,
  tabId: number,
): CapturedPreview | null {
  const owned = previews[String(tabId)];
  if (owned) return owned;

  return (
    Object.values(previews).find((preview) => preview.tabId === tabId) ?? null
  );
}

/** Esquece o que uma aba fechada deixou para trás. */
export function forgetTab(
  previews: PreviewsByTab,
  tabId: number,
): PreviewsByTab {
  return Object.fromEntries(
    Object.entries(previews).filter(
      ([key, preview]) => key !== String(tabId) && preview.tabId !== tabId,
    ),
  );
}
