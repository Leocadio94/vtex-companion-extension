import type { CompanionMessage } from '@/lib/messaging';
import {
  findDevModeApiLink,
  findPreviewButton,
  INJECTED_ATTRIBUTE,
} from '@/lib/preview/admin-selectors';

const BUTTON_LABEL = 'Localhost';

/**
 * Injeta um botão "Localhost" ao lado do "Pré-visualização" do CMS.
 *
 * O botão não tenta descobrir a URL do preview no DOM — isso é o que faz o
 * userscript e é o que quebra quando o `cmsDevMode` está desligado. Em vez
 * disso ele arma um redirecionamento de uso único no background e clica no
 * botão original: a URL real passa pelo `webNavigation` como sempre, e é lá que
 * ela é reescrita.
 *
 * Roda em todos os frames porque o CMS do FastStore é renderizado dentro de um
 * iframe no admin.
 */
export default defineContentScript({
  matches: ['*://*.myvtex.com/*'],
  allFrames: true,
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

    sync();
    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
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
