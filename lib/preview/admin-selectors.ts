/**
 * Todo o acoplamento com o DOM do admin da VTEX mora aqui.
 *
 * É a parte frágil do projeto: a VTEX redesenha o admin sem aviso e sem
 * contrato público. A regra é degradar em silêncio — não achar o botão é um
 * resultado válido, nunca uma exceção jogada no console da página do usuário.
 */

/** Marca os elementos que a extensão injeta, para não se auto-detectar. */
export const INJECTED_ATTRIBUTE = 'data-vtex-companion';

export const PREVIEW_LABELS = [
  'pre-visualizacao',
  'previsualizacao',
  'preview',
  'vista previa',
  'previsualizacion',
];

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function accessibleText(element: Element): string {
  return normalize(
    element.getAttribute('aria-label') ?? element.textContent ?? '',
  );
}

/**
 * O botão "Pré-visualização" do CMS. Procura por texto acessível em vez de
 * classe ou id porque o texto é a única coisa que sobreviveu a todas as versões
 * do admin até agora.
 */
export function findPreviewButton(root: ParentNode): HTMLElement | null {
  const candidates = root.querySelectorAll<HTMLElement>(
    'button, a[role="button"], [role="button"]',
  );

  for (const candidate of candidates) {
    if (candidate.hasAttribute(INJECTED_ATTRIBUTE)) continue;

    const text = accessibleText(candidate);
    if (PREVIEW_LABELS.some((label) => text === label || text.startsWith(label))) {
      return candidate;
    }
  }

  return null;
}

/**
 * O link "Open API URL" do painel Development Mode. Só existe com `cmsDevMode`
 * ligado; quando existe, entrega a URL de preview sem precisar de clique.
 *
 * O `:not()` importa: o bloco que injetamos é um clone deste, inserido antes
 * dele. Sem a exclusão, a própria cópia venceria a busca por ordem de
 * documento e o link passaria a se alimentar de si mesmo.
 */
export function findDevModeApiLink(
  root: ParentNode,
): HTMLAnchorElement | null {
  return root.querySelector<HTMLAnchorElement>(
    `a[title="Open API URL"]:not([${INJECTED_ATTRIBUTE}])`,
  );
}

/**
 * Container Tachyons de cada campo do painel Development Mode (rótulo + valor).
 * Segue valendo neste admin — é o mesmo seletor que o userscript de origem usa.
 */
export const DEV_MODE_FIELD_SELECTOR = '.mt6.mb4.mh5.f6.c-on-base';
