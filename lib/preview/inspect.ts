/**
 * Diagnóstico do botão injetado, frame a frame.
 *
 * Existe porque o content script não pode logar no console do admin: quando o
 * botão não aparece, esta é a forma de descobrir em qual dos três pontos
 * quebrou — o script não rodou no frame, rodou e não reconheceu o botão de
 * preview, ou reconheceu e a inserção falhou.
 *
 * Os candidatos são procurados por texto, sem passar pelo seletor de produção.
 * É isso que permite descobrir que o botão existe mas com uma tag que
 * `findPreviewButton` ignora.
 */

import { INJECTED_ATTRIBUTE } from './admin-selectors';

export interface FrameInspection {
  frameId: number;
  url: string;
  /** O content script chegou a rodar neste frame. */
  ready: boolean;
  /** Resultado da última tentativa registrada pelo content script. */
  state: string;
  hasInjectedButton: boolean;
  /** O link "Localhost URL" do painel Development Mode está no DOM. */
  hasDevModeLink: boolean;
  /** Elementos cujo texto lembra "preview", achados sem o seletor oficial. */
  candidates: string[];
}

/** Roda no MAIN world de cada frame; precisa ser autocontida. */
function inspectFrame(injectedAttribute: string) {
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const candidates: string[] = [];
  const seen = new Set<Element>();
  const all = document.querySelectorAll('*');
  const limit = Math.min(all.length, 5000);

  for (let i = 0; i < limit; i += 1) {
    const element = all[i];
    if (!element || seen.has(element)) continue;

    const label = element.getAttribute('aria-label') ?? '';
    const text = element.textContent ?? '';
    // Só folhas: sem isso todo ancestral do botão vira candidato.
    if (element.children.length > 0 && !label) continue;

    const haystack = normalize(label || text);
    if (haystack.length > 40) continue;
    if (!haystack.includes('visualiza') && !haystack.includes('preview')) continue;

    const target = element.closest('button, a, [role]') ?? element;
    if (seen.has(target)) continue;
    seen.add(target);

    const role = target.getAttribute('role');
    candidates.push(
      `${target.tagName.toLowerCase()}${role ? `[role=${role}]` : ''} "${haystack}"`,
    );
    if (candidates.length >= 6) break;
  }

  return {
    url: window.location.href,
    ready:
      document.documentElement.getAttribute(`${injectedAttribute}-ready`) === '1',
    state:
      document.documentElement.getAttribute(`${injectedAttribute}-state`) ??
      'sem registro',
    hasInjectedButton: Boolean(
      document.querySelector(`[${injectedAttribute}="preview"]`),
    ),
    hasDevModeLink: Boolean(
      document.querySelector(`[${injectedAttribute}="devmode-link"]`),
    ),
    candidates,
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
      args: [INJECTED_ATTRIBUTE],
    });

    return results.map((entry) => {
      const value = entry.result as Partial<FrameInspection> | undefined;
      return {
        frameId: entry.frameId ?? 0,
        url: value?.url ?? '',
        ready: Boolean(value?.ready),
        state: value?.state ?? 'sem registro',
        hasInjectedButton: Boolean(value?.hasInjectedButton),
        hasDevModeLink: Boolean(value?.hasDevModeLink),
        candidates: value?.candidates ?? [],
      };
    });
  } catch {
    return [];
  }
}

/** Resumo em uma linha para o popup. */
export function summarizeInjection(frames: FrameInspection[]): string {
  if (frames.length === 0) return 'nenhum frame lido';

  const injected = frames.filter((frame) => frame.hasInjectedButton);
  if (injected.length > 0) {
    const withLink = frames.filter((frame) => frame.hasDevModeLink).length;
    return `injetado em ${injected.length} frame(s)${withLink ? ' · link do dev mode presente' : ''}`;
  }

  const ready = frames.filter((frame) => frame.ready);
  if (ready.length === 0) {
    return `content script não rodou em nenhum dos ${frames.length} frame(s)`;
  }

  const withCandidates = frames.filter((frame) => frame.candidates.length > 0);
  return withCandidates.length > 0
    ? `botão existe mas não foi reconhecido (${ready.length} frame(s) ativos)`
    : `nenhum botão de preview nos ${ready.length} frame(s) ativos`;
}

/** Caminho curto, para caber no popup. */
export function shortUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`.slice(0, 48);
  } catch {
    return url.slice(0, 48) || 'about:blank';
  }
}
