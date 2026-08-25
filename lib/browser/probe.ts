/**
 * Leitura dos globais da página.
 *
 * `readPageGlobals` roda no MAIN world da aba, injetada sob demanda com
 * `scripting.executeScript`. Por isso ela precisa ser autocontida: nada de
 * import, nada de closure sobre o módulo. O retorno é serializado de volta,
 * então só objetos simples podem sair daqui — nunca o `__RUNTIME__` inteiro,
 * que é grande demais e cheio de referências circulares.
 */

import type { PageSignals } from '../detect/signals';

/** Marcações que só o FastStore emite. */
const FASTSTORE_SELECTORS = [
  '[data-fs-product-details]',
  '[data-fs-product-card]',
  '[data-fs-section]',
  '[data-fs-container]',
  '[data-fs-hero]',
  '[data-fs-product-listing]',
];

export function readPageGlobals(fastStoreSelectors: string[]): PageSignals {
  const w = window as unknown as Record<string, any>;

  const runtime = (() => {
    const raw = w.__RUNTIME__;
    if (!raw || typeof raw !== 'object') return null;
    return {
      account: raw.account,
      workspace: raw.workspace,
      production: raw.production,
      binding: raw.binding
        ? {
            id: raw.binding.id,
            canonicalBaseAddress: raw.binding.canonicalBaseAddress,
          }
        : undefined,
      route: raw.route
        ? {
            id: raw.route.id,
            path: raw.route.path,
            pageContext: raw.route.pageContext
              ? {
                  type: raw.route.pageContext.type,
                  id: raw.route.pageContext.id,
                }
              : undefined,
          }
        : undefined,
    };
  })();

  const nextData = (() => {
    const raw = w.__NEXT_DATA__;
    if (!raw || typeof raw !== 'object') return null;
    return { page: raw.page, buildId: raw.buildId, query: raw.query };
  })();

  const legacy = (() => {
    // O portal legacy expõe o contexto da página em `vtxctx` e publica o
    // `pageCategory` num `vtex.events.addData` inline. Nenhum dos dois sozinho
    // cobre todos os casos, então os dois são lidos e mesclados.
    const ctx = w.vtxctx && typeof w.vtxctx === 'object' ? w.vtxctx : null;

    let fromEvents: Record<string, unknown> | null = null;
    const scripts = document.querySelectorAll('script:not([src])');
    for (let i = 0; i < scripts.length && !fromEvents; i += 1) {
      const text = scripts[i]?.textContent ?? '';
      if (!text.includes('pageCategory')) continue;
      const match = text.match(/addData\(\s*(\{[\s\S]*?\})\s*\)/);
      if (!match?.[1]) continue;
      try {
        fromEvents = JSON.parse(match[1]);
      } catch {
        // Payload com aspas simples ou trailing comma: cai fora em silêncio,
        // `vtxctx` ainda cobre o essencial.
      }
    }

    if (!ctx && !fromEvents && !w.skuJson && !w.skuJson_0) return null;

    return {
      ...(ctx ?? {}),
      ...(fromEvents ?? {}),
      accountName:
        (fromEvents?.accountName as string | undefined) ??
        (w.vtex && typeof w.vtex === 'object' ? w.vtex.accountName : undefined),
    };
  })();

  const hasFastStoreMarkup = (() => {
    if (document.querySelector(fastStoreSelectors.join(','))) return true;
    // Fallback limitado: varre um prefixo do documento atrás de qualquer
    // atributo `data-fs-*`, sem percorrer a árvore inteira.
    const sample = document.querySelectorAll('body *');
    const limit = Math.min(sample.length, 2000);
    for (let i = 0; i < limit; i += 1) {
      const attrs = sample[i]?.attributes;
      if (!attrs) continue;
      for (let j = 0; j < attrs.length; j += 1) {
        if (attrs[j]?.name.startsWith('data-fs-')) return true;
      }
    }
    return false;
  })();

  const assetAccounts = (() => {
    const found = new Set<string>();
    const entries = performance.getEntriesByType('resource');
    for (const entry of entries) {
      const match = entry.name.match(
        /https?:\/\/([a-z0-9-]+)\.(?:vtexassets\.com|vteximg\.com\.br)/i,
      );
      if (match?.[1]) found.add(match[1].toLowerCase());
    }
    return [...found];
  })();

  const jsonLdTypes = (() => {
    const types = new Set<string>();
    const blocks = document.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    for (const block of blocks) {
      try {
        const parsed = JSON.parse(block.textContent ?? '');
        const list = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of list) {
          const type = item?.['@type'];
          if (typeof type === 'string') types.add(type);
          else if (Array.isArray(type)) type.forEach((t) => types.add(String(t)));
        }
      } catch {
        // JSON-LD malformado é comum em loja de produção; ignorar.
      }
    }
    return [...types];
  })();

  return {
    runtime,
    nextData,
    legacy,
    hasFastStoreMarkup,
    hasVtexJs: Boolean(w.vtexjs),
    assetAccounts,
    jsonLdTypes,
    href: window.location.href,
  };
}

/**
 * Injeta `readPageGlobals` no frame principal da aba.
 * Devolve `null` quando a página bloqueia a injeção (páginas internas do
 * browser, PDF viewer, sites sem permissão concedida).
 */
export async function collectPageSignals(
  tabId: number,
): Promise<PageSignals | null> {
  try {
    const [result] = await browser.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: readPageGlobals,
      args: [FASTSTORE_SELECTORS],
    });
    return (result?.result as PageSignals | undefined) ?? null;
  } catch {
    return null;
  }
}
