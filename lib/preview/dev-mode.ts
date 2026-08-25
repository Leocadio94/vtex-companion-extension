/**
 * Leitura e escrita do `cmsDevMode` do Headless CMS.
 *
 * O CMS roda dentro de um iframe no admin, e `localStorage` é por origin de
 * frame — quem precisa da flag é o documento do iframe, não o do topo. Por isso
 * tudo aqui roda com `allFrames: true` e reporta frame a frame, em vez de
 * apostar num frame específico.
 */

const STORAGE_KEY = 'cmsDevMode';

export interface FrameDevMode {
  frameId: number;
  /** `null` quando o frame não deixa acessar `localStorage`. */
  enabled: boolean | null;
  url?: string;
}

function readInFrame(key: string) {
  try {
    return {
      enabled: window.localStorage.getItem(key) !== null,
      url: window.location.href,
    };
  } catch {
    // Frame com sandbox sem `allow-same-origin`: origin opaco, `localStorage`
    // lança. Reportar como indisponível em vez de derrubar o resto.
    return { enabled: null, url: window.location.href };
  }
}

function writeInFrame(key: string, enabled: boolean) {
  try {
    if (enabled) window.localStorage.setItem(key, '1');
    else window.localStorage.removeItem(key);
    return {
      enabled: window.localStorage.getItem(key) !== null,
      url: window.location.href,
    };
  } catch {
    return { enabled: null, url: window.location.href };
  }
}

async function runInAllFrames<T>(
  tabId: number,
  func: (...args: any[]) => T,
  args: any[],
): Promise<FrameDevMode[]> {
  try {
    const results = await browser.scripting.executeScript({
      target: { tabId, allFrames: true },
      world: 'MAIN',
      func,
      args,
    });

    return results.map((entry) => ({
      frameId: entry.frameId ?? 0,
      enabled: (entry.result as { enabled: boolean | null } | undefined)?.enabled ?? null,
      url: (entry.result as { url?: string } | undefined)?.url,
    }));
  } catch {
    return [];
  }
}

export function readDevMode(tabId: number): Promise<FrameDevMode[]> {
  return runInAllFrames(tabId, readInFrame, [STORAGE_KEY]);
}

export function writeDevMode(
  tabId: number,
  enabled: boolean,
): Promise<FrameDevMode[]> {
  return runInAllFrames(tabId, writeInFrame, [STORAGE_KEY, enabled]);
}

/** O dev mode conta como ligado se qualquer frame da aba tiver a flag. */
export function isDevModeOn(frames: FrameDevMode[]): boolean {
  return frames.some((frame) => frame.enabled === true);
}
