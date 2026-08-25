import type { CompanionMessage } from '@/lib/messaging';
import {
  findDevModeApiLink,
  findPreviewButton,
  INJECTED_ATTRIBUTE,
} from '@/lib/preview/admin-selectors';
import { previewUrlFromCmsApiUrl } from '@/lib/preview/rewrite';
import { previewPort } from '@/lib/settings';

const BUTTON_LABEL = 'Localhost';

/**
 * Tentativas escalonadas depois do carregamento. O MutationObserver cobre a
 * maioria dos casos, mas o admin monta o CMS em etapas dentro de um iframe e
 * houve caso do botão só existir bem depois do `document_idle` — sem nenhuma
 * mutação observável no documento em que estamos.
 */
const RETRY_DELAYS_MS = [0, 300, 800, 1500, 3000, 5000, 8000, 13000, 21000];

/**
 * Porta do dev server, espelhada do `storage` porque o DOM precisa dela de
 * forma síncrona a cada varredura.
 */
let port = 3000;

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
    // Marca de vida, lida pelo diagnóstico do popup. O content script não pode
    // logar no console do admin, então esta é a única forma de saber se ele
    // chegou a rodar neste frame.
    mark('ready', '1');

    let scheduled = false;

    const sync = () => {
      scheduled = false;
      try {
        mark('state', `${ensureButton()} | ${ensureDevModeLink()}`);
      } catch (error) {
        // O admin é território alheio: nenhuma falha nossa pode aparecer no
        // console dele nem interromper a página.
        mark('state', `erro: ${(error as Error)?.message ?? 'desconhecido'}`);
      }
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.setTimeout(sync, 150);
    };

    void previewPort.getValue().then((value) => {
      port = value;
      sync();
    });
    previewPort.watch((value) => {
      port = value;
      sync();
    });

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

/** Registra o estado da última tentativa num atributo do `<html>` do frame. */
function mark(name: 'ready' | 'state', value: string) {
  try {
    document.documentElement.setAttribute(
      `${INJECTED_ATTRIBUTE}-${name}`,
      value,
    );
  } catch {
    // Documento sem `documentElement` acessível: nada a registrar.
  }
}

/** Devolve o resultado da tentativa, para virar diagnóstico. */
function ensureButton(): string {
  const original = findPreviewButton(document);
  if (!original) return 'botao-de-preview-nao-encontrado';
  if (!original.parentElement) return 'botao-de-preview-sem-pai';

  const existing = document.querySelector<HTMLElement>(
    `[${INJECTED_ATTRIBUTE}="preview"]`,
  );

  if (existing?.isConnected) {
    describe(existing);
    return 'injetado';
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

  return button.isConnected ? 'injetado' : 'insercao-falhou';
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

/**
 * Com `cmsDevMode` ligado, acrescenta um "Localhost URL" clicável ao painel
 * Development Mode, ao lado do "API URL" que o próprio CMS mostra.
 *
 * O bloco é construído do zero em vez de clonar o container do CMS: as classes
 * do admin mudaram de esquema (`admin-ui-c-*`) e clonar amarraria o recurso a
 * uma estrutura que não é contrato.
 */
function ensureDevModeLink(): string {
  const apiLink = findDevModeApiLink(document);
  if (!apiLink) return 'dev-mode-desligado';

  const target = previewUrlFromCmsApiUrl(
    apiLink.textContent?.trim() || apiLink.href,
    { port },
  );
  if (!target) return 'api-url-ilegivel';

  const existing = document.querySelector<HTMLAnchorElement>(
    `a[${INJECTED_ATTRIBUTE}="devmode-link"]`,
  );

  const anchor = existing?.isConnected ? existing : createDevModeLink(apiLink);
  if (!anchor) return 'sem-onde-inserir';

  // Reescrito a cada varredura: trocar de versão ou de documento muda a URL.
  anchor.href = target;
  anchor.textContent = target;

  return 'link-devmode-ok';
}

function createDevModeLink(apiLink: HTMLAnchorElement): HTMLAnchorElement | null {
  const container = apiLink.closest('div') ?? apiLink.parentElement;
  if (!container?.parentElement) return null;

  const block = document.createElement('div');
  block.setAttribute(INJECTED_ATTRIBUTE, 'devmode-block');
  block.style.margin = '12px 0';

  const label = document.createElement('div');
  label.textContent = 'Localhost URL';
  label.style.fontWeight = '600';
  label.style.marginBottom = '4px';

  const anchor = document.createElement('a');
  anchor.setAttribute(INJECTED_ATTRIBUTE, 'devmode-link');
  anchor.target = '_blank';
  anchor.rel = 'noreferrer';
  anchor.title = 'Open Localhost URL';
  anchor.style.overflowWrap = 'anywhere';

  block.append(label, anchor);
  container.parentElement.insertBefore(block, container);

  return anchor;
}
