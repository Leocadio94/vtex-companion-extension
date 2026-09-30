/**
 * Busca dados de catálogo a partir de dentro da própria página.
 *
 * A requisição roda no contexto da aba, e não no popup, por dois motivos: é
 * same-origin — sem CORS e sem exigir permissão de host além de `activeTab` — e
 * o mapeamento acontece antes do retorno. A resposta de
 * `catalog_system/pub/products/search` chega com centenas de KB por produto;
 * serializar isso de volta para o popup seria desperdício puro.
 *
 * Exceção: lojas FastStore e headless não servem a API de catálogo no domínio
 * próprio. A API responde em `{account}.myvtex.com`, que é host permission
 * obrigatória da extensão — mas de fora da página, porque a API de lá não
 * manda cabeçalho de CORS. Nesse caso a coleta repete pelo background, que
 * tem a permissão e devolve o snapshot já mapeado.
 */

import type { CatalogSnapshot } from './signals';
import type { CatalogTarget } from './target';

/** Caminhos da API de catálogo para um alvo, em ordem de tentativa. */
export function catalogPaths(target: CatalogTarget): string[] {
  if (target.kind !== 'product') return [];

  const paths: string[] = [];
  for (const slug of [target.slug, ...(target.slugFallbacks ?? [])]) {
    if (!slug) continue;
    paths.push(
      `/api/catalog_system/pub/products/search/${encodeURIComponent(slug)}/p`,
    );
  }

  if (target.entityId) {
    paths.push(
      `/api/catalog_system/pub/products/search?fq=productId:${encodeURIComponent(target.entityId)}`,
    );
  }

  return paths;
}

/**
 * Host da API de catálogo para uma conta. `account` vem da detecção, nunca
 * da página, e a checagem vale também no background: só `*.myvtex.com` é
 * host permission da extensão.
 */
export function catalogApiHost(account: string): string | null {
  return /^[a-z0-9][a-z0-9-]*$/i.test(account)
    ? `${account.toLowerCase()}.myvtex.com`
    : null;
}

/**
 * Roda dentro da página. Função injetada: autocontida, sem import, sem
 * closure — inclusive o mapeamento do produto, que espelha
 * `lib/catalog/map.ts` (ver a armadilha em CLAUDE.md).
 */
async function readCatalogInPage(
  paths: string[],
  categoryPath: string | null,
): Promise<{ product: CatalogSnapshot | null; category: CatalogSnapshot | null }> {
  const number = (value: unknown): number | null =>
    typeof value === 'number' && Number.isFinite(value) ? value : null;

  let product: CatalogSnapshot | null = null;

  for (const path of paths) {
    try {
      const response = await fetch(path, {
        headers: { accept: 'application/json' },
      });
      if (!response.ok) continue;
      const json = await response.json();
      if (!Array.isArray(json) || json.length === 0) continue;
      const p = json[0] as Record<string, any>;
      product = {
        kind: 'product',
        product: {
          productId: String(p.productId ?? ''),
          productName: String(p.productName ?? ''),
          linkText: p.linkText ?? null,
          productReference: p.productReference ?? null,
          brand: p.brand ?? null,
          brandId: p.brandId != null ? String(p.brandId) : null,
          categoryId: p.categoryId != null ? String(p.categoryId) : null,
          categories: Array.isArray(p.categories) ? p.categories : [],
          skus: (Array.isArray(p.items) ? p.items : []).map((item: any) => {
            const seller = item.sellers?.[0];
            const offer = seller?.commertialOffer;
            return {
              id: String(item.itemId ?? ''),
              name: String(item.name ?? ''),
              ean: item.ean || null,
              refId: item.referenceId?.[0]?.Value ?? null,
              sellerId: seller?.sellerId ?? null,
              sellerName: seller?.sellerName ?? null,
              available: Boolean(offer?.IsAvailable),
              quantity: number(offer?.AvailableQuantity),
              price: number(offer?.Price),
              listPrice: number(offer?.ListPrice),
              images: Array.isArray(item.images) ? item.images.length : 0,
            };
          }),
        },
      };
      break;
    } catch {
      // CORS, offline ou bloqueio da loja: o fallback pelo background decide.
      break;
    }
  }

  let category: CatalogSnapshot | null = null;

  if (categoryPath) {
    try {
      const response = await fetch(categoryPath, {
        headers: { accept: 'application/json' },
      });
      if (response.ok) {
        const categoryJson = await response.json();
        category = {
          kind: 'category',
          category: {
            id:
              categoryJson?.id != null
                ? String(categoryJson.id)
                : String(categoryPath.split('/').at(-1)),
            name: categoryJson?.name ?? categoryJson?.Title ?? null,
            path: [],
            hasChildren:
              typeof categoryJson?.hasChildren === 'boolean'
                ? categoryJson.hasChildren
                : null,
          },
        };
      } else {
        category = {
          kind: 'category',
          category: null,
          note: 'Detalhe da categoria indisponível: mostrando o que a URL entrega.',
        };
      }
    } catch {
      category = {
        kind: 'category',
        category: null,
        note: 'Detalhe da categoria indisponível: mostrando o que a URL entrega.',
      };
    }
  }

  return { product, category };
}

/** Pede ao background o produto no domínio de API da conta. */
async function fetchViaBackground(
  account: string,
  paths: string[],
): Promise<CatalogSnapshot | null> {
  try {
    const response = await browser.runtime.sendMessage({
      type: 'catalog:fetch',
      account,
      paths,
    });
    return response?.ok ? (response.snapshot as CatalogSnapshot) : null;
  } catch {
    return null;
  }
}

export async function collectCatalog(
  tabId: number,
  target: CatalogTarget,
  account?: string | null,
): Promise<CatalogSnapshot | null> {
  if (target.kind === 'none') return null;

  const paths = catalogPaths(target);
  const categoryPath =
    target.kind === 'category' && target.entityId
      ? `/api/catalog_system/pub/category/${encodeURIComponent(target.entityId)}`
      : null;

  if (paths.length === 0 && !categoryPath) {
    // Sem id, o caminho da URL ainda descreve a navegação.
    if (target.kind === 'category') {
      return {
        kind: 'category',
        category: { id: null, name: null, path: target.search?.segments ?? [], hasChildren: null },
        search: target.search,
      };
    }
    return null;
  }

  let result: { product: CatalogSnapshot | null; category: CatalogSnapshot | null };

  try {
    const [inPage] = await browser.scripting.executeScript({
      target: { tabId },
      func: readCatalogInPage,
      args: [paths, categoryPath],
    });
    result =
      (inPage?.result as typeof result | undefined) ??
      { product: null, category: null };
  } catch {
    result = { product: null, category: null };
  }

  // FastStore/headless: a API não vive no domínio da loja. O background tem
  // permissão para o domínio de API da conta e não sofre CORS.
  if (result.product === null && account && paths.length > 0) {
    const fromBackground = await fetchViaBackground(account, paths);
    if (fromBackground) result.product = fromBackground;
  }

  if (target.kind === 'product' && result.product) return result.product;
  if (target.kind === 'product' && !result.product) {
    return {
      kind: 'product',
      product: null,
      note: 'Produto não encontrado no catálogo.',
    };
  }

  if (target.kind === 'category') {
    return {
      ...result.category,
      kind: 'category',
      category: result.category?.category ?? {
        id: target.entityId ? String(target.entityId) : null,
        name: null,
        path: target.search?.segments ?? [],
        hasChildren: null,
      },
      search: target.search,
    };
  }

  return null;
}
