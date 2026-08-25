import type { CompanionMessage } from '@/lib/messaging';
import {
  findDevModeApiLink,
  findPreviewButton,
  INJECTED_ATTRIBUTE,
} from '@/lib/preview/admin-selectors';

const BUTTON_LABEL = 'Localhost';

/**
 * Tentativas escalonadas depois do carregamento. O MutationObserver cobre a
 * maioria dos casos, mas o admin monta o CMS em etapas dentro de um iframe e
 * houve caso do botão só existir bem depois do `document_idle` — sem nenhuma
 * mutação observável no documento em que estamos.
 */
const RETRY_DELAYS_MS = [0, 300, 800, 1500, 3000, 5000, 8000, 13000, 21000];

/**
 * Injeta um botão "Localhost" ao lado do "Pré-visualização" do CMS.
 *
 * O botão não tenta descobrir a URL do preview no DOM — isso é o que faz o
 * userscript e é o que quebra quando o `cmsDevMode` está desligado. Em vez
 * disso ele arma um redirecionamento de uso único no background e clica no
 * botão original: a URL real passa pelo `webNavigation` como sempre, e é lá que
 * ela é reescrita.
 *
 * Roda em todos os frames, incluindo os que nascem `about:blank` e só depois
 * recebem conteúdo — que é como boa parte do admin da VTEX monta seus iframes.
 */
export default defineContentScript({
  matches: ['*://*.myvtex.com/*'],
  allFrames: true,
  matchAboutBlank: true,
  runAt: 'document_idle',

  main() {
    let scheduled = false;

    const sync = () => {
      scheduled = false;
      try {
        ensureButton();
      } catch {
        // O admin é território alheio: nenhuma falha nossa pode aparecer no
        // console dele nem interromper a página.
      }
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.setTimeout(sync, 150);
    };

    for (const delay of RETRY_DELAYS_MS) window.setTimeout(sync, delay);

    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    // Voltar de outra aba costuma coincidir com o CMS ter terminado de montar.
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('focus', schedule);
  },
});

function ensureButton() {
  const original = findPreviewButton(document);
  if (!original?.parentElement) return;

  const existing = document.querySelector<HTMLElement>(
    `[${INJECTED_ATTRIBUTE}="preview"]`,
  );

  if (existing?.isConnected) {
    describe(existing);
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = BUTTON_LABEL;
  button.setAttribute(INJECTED_ATTRIBUTE, 'preview');
  // Herdar as classes do botão original mantém o visual do admin sem depender
  // de conhecer o design system dele.
  button.className = original.className;
  button.style.marginRight = '8px';

  button.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const message: CompanionMessage = { type: 'preview:arm-one-shot' };
    await browser.runtime.sendMessage(message);
    original.click();
  });

  describe(button);
  original.parentElement.insertBefore(button, original);
}

/**
 * Quando o Development Mode está ligado, a URL de preview já está no DOM.
 * Nesse caso o tooltip mostra a URL local — puro conforto, o clique funciona
 * igual sem ela.
 */
function describe(button: HTMLElement) {
  const apiUrl = findDevModeApiLink(document)?.textContent?.trim();
  button.title = apiUrl
    ? `Abrir este preview no dev server local (${apiUrl})`
    : 'Abrir este preview no dev server local';
}
