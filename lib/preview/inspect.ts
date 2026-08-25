/**
 * Diagnóstico do botão injetado, frame a frame.
 *
 * Existe porque o content script não pode logar no console do admin: quando o
 * botão não aparece, esta é a forma de descobrir se o frame não foi alcançado,
 * se o botão de preview não existe ali, ou se existe e a injeção falhou.
 */

import { INJECTED_ATTRIBUTE, PREVIEW_LABELS } from './admin-selectors';

export interface FrameInspection {
  frameId: number;
  url: string;
  hasPreviewButton: boolean;
  hasInjectedButton: boolean;
}

/** Roda no MAIN world de cada frame; precisa ser autocontida. */
function inspectFrame(labels: string[], injectedAttribute: string) {
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const candidates = document.querySelectorAll(
    'button, a[role="button"], [role="button"]',
  );

  let hasPreviewButton = false;
  for (const candidate of candidates) {
    if (candidate.hasAttribute(injectedAttribute)) continue;
    const text = normalize(
      candidate.getAttribute('aria-label') ?? candidate.textContent ?? '',
    );
    if (labels.some((label) => text === label || text.startsWith(label))) {
      hasPreviewButton = true;
      break;
    }
  }

  return {
    url: window.location.href,
    hasPreviewButton,
    hasInjectedButton: Boolean(
      document.querySelector(`[${injectedAttribute}="preview"]`),
    ),
  };
}

export async function inspectAdminFrames(
  tabId: number,
): Promise<FrameInspection[]> {
  try {
    const results = await browser.scripting.executeScript({
      target: { tabId, allFrames: true },
      world: 'MAIN',
      func: inspectFrame,
      args: [PREVIEW_LABELS, INJECTED_ATTRIBUTE],
    });

    return results.map((entry) => ({
      frameId: entry.frameId ?? 0,
      url: (entry.result as { url?: string } | undefined)?.url ?? '',
      hasPreviewButton: Boolean(
        (entry.result as { hasPreviewButton?: boolean } | undefined)
          ?.hasPreviewButton,
      ),
      hasInjectedButton: Boolean(
        (entry.result as { hasInjectedButton?: boolean } | undefined)
          ?.hasInjectedButton,
      ),
    }));
  } catch {
    return [];
  }
}

/** Resumo em uma linha para o popup. */
export function summarizeInjection(frames: FrameInspection[]): string {
  if (frames.length === 0) return 'nenhum frame lido';

  const withButton = frames.filter((frame) => frame.hasPreviewButton);
  if (withButton.length === 0) {
    return `botão de preview não encontrado em ${frames.length} frame(s)`;
  }

  const injected = withButton.filter((frame) => frame.hasInjectedButton);
  return `injetado em ${injected.length} de ${withButton.length} frame(s) com botão de preview`;
}
