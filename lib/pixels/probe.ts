/**
 * Leitura dos scripts de terceiros da página.
 *
 * Roda no MAIN world: metade da evidência são globais que o vendor deixa em
 * `window` (`fbq`, `ttq`, `hj`, `clarity`), e o mundo isolado não os enxerga.
 * Como é injetada, precisa ser autocontida.
 */

import type { PixelSignals } from './signals';

/** Globais que valem consultar. Precisa acompanhar `VENDOR_RULES`. */
const KNOWN_GLOBALS = [
  'google_tag_manager',
  'dataLayer',
  'fbq',
  'ttq',
  'clarity',
  'hj',
  'uetq',
  'pintrk',
  'twq',
];

/** Ids de conta que aparecem em script inline. */
const INLINE_ID_PATTERN =
  /\b(GTM-[A-Z0-9]{4,}|G-[A-Z0-9]{6,}|AW-[A-Z0-9]{6,}|UA-\d{4,}-\d+)\b/g;

export function readPixels(
  knownGlobals: string[],
  inlinePattern: string,
): PixelSignals {
  // Declarada aqui dentro de propósito: a função é serializada para dentro da
  // página, então qualquer identificador de escopo de módulo vira
  // `ReferenceError` no destino.
  const maxResources = 800;

  const win = window as unknown as Record<string, unknown>;

  const urls = new Set<string>();

  const entries = performance.getEntriesByType('resource');
  for (let i = 0; i < Math.min(entries.length, maxResources); i += 1) {
    const name = entries[i]?.name;
    if (name) urls.add(name);
  }

  for (const script of document.querySelectorAll<HTMLScriptElement>(
    'script[src]',
  )) {
    if (script.src) urls.add(script.src);
  }

  const globals = knownGlobals.filter((name) => win[name] != null);

  const inlineIds = new Set<string>();
  const pattern = new RegExp(inlinePattern, 'g');
  for (const script of document.querySelectorAll('script:not([src])')) {
    const text = script.textContent;
    if (!text || text.length > 200_000) continue;

    pattern.lastIndex = 0;
    let found = pattern.exec(text);
    while (found && inlineIds.size < 20) {
      if (found[1]) inlineIds.add(found[1]);
      found = pattern.exec(text);
    }
  }

  return { urls: [...urls], globals, inlineIds: [...inlineIds] };
}

export async function collectPixelSignals(
  tabId: number,
): Promise<PixelSignals | null> {
  try {
    const [result] = await browser.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: readPixels,
      args: [KNOWN_GLOBALS, INLINE_ID_PATTERN.source],
    });
    return (result?.result as PixelSignals | undefined) ?? null;
  } catch {
    return null;
  }
}
