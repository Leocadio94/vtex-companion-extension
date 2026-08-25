/**
 * Busca dados de catálogo a partir de dentro da própria página.
 *
 * A requisição roda no contexto da aba, e não no popup, por dois motivos: é
 * same-origin — sem CORS e sem exigir permissão de host além de `activeTab` — e
 * o mapeamento acontece antes do retorno. A resposta de
 * `catalog_system/pub/products/search` chega com centenas de KB por produto;
 * serializar isso de volta para o popup seria desperdício puro.
 */

import type { CatalogTarget } from './target';
import type { CatalogSnapshot } from './signals';

async function fetchCatalog(target: CatalogTarget): Promise<CatalogSnapshot> {
  const json = async (path: string) => {
    const response = await fetch(path, {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  };

  const number = (value: unknown): number | null =>
    typeof value === 'number' && Number.isFinite(value) ? value : null;

  if (target.kind === 'product') {
    try {
      let list: any[] = [];

      if (target.slug) {
        list = await json(
          `/api/catalog_system/pub/products/search/${encodeURIComponent(target.slug)}/p`,
        );
      }

      // O slug da URL nem sempre é o `linkText` do catálogo — binding com
      // outro idioma, redirect antigo. O id resolve quando a página o expõe.
      if ((!list || list.length === 0) && target.entityId) {
        list = await json(
          `/api/catalog_system/pub/products/search?fq=productId:${encodeURIComponent(target.entityId)}`,
        );
      }

      const product = Array.isArray(list) ? list[0] : null;
      if (!product) {
        return { kind: 'product', product: null, note: 'Produto não encontrado no catálogo.' };
      }

      return {
        kind: 'product',
        product: {
          productId: String(product.productId ?? ''),
          productName: String(product.productName ?? ''),
          linkText: product.linkText ?? null,
          productReference: product.productReference ?? null,
          brand: product.brand ?? null,
          brandId: product.brandId != null ? String(product.brandId) : null,
          categoryId: product.categoryId != null ? String(product.categoryId) : null,
          categories: Array.isArray(product.categories) ? product.categories : [],
          skus: (Array.isArray(product.items) ? product.items : []).map(
            (item: any) => {
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
            },
          ),
        },
      };
    } catch (error) {
      return {
        kind: 'product',
        product: null,
        note: `Catálogo não respondeu: ${(error as Error)?.message ?? 'erro'}`,
      };
    }
  }

  if (target.kind === 'category') {
    const path = target.search?.segments ?? [];

    if (!target.entityId) {
      // Sem id, o caminho da URL ainda descreve a navegação.
      return {
        kind: 'category',
        category: { id: null, name: null, path, hasChildren: null },
        search: target.search,
      };
    }

    try {
      const category = await json(
        `/api/catalog_system/pub/category/${encodeURIComponent(target.entityId)}`,
      );
      return {
        kind: 'category',
        category: {
          id: category?.id != null ? String(category.id) : target.entityId,
          name: category?.name ?? category?.Title ?? null,
          path,
          hasChildren:
            typeof category?.hasChildren === 'boolean' ? category.hasChildren : null,
        },
        search: target.search,
      };
    } catch {
      return {
        kind: 'category',
        category: { id: target.entityId, name: null, path, hasChildren: null },
        search: target.search,
        note: 'Detalhe da categoria indisponível — mostrando o que a URL entrega.',
      };
    }
  }

  return { kind: 'none' };
}

export async function collectCatalog(
  tabId: number,
  target: CatalogTarget,
): Promise<CatalogSnapshot | null> {
  if (target.kind === 'none') return null;

  try {
    const [result] = await browser.scripting.executeScript({
      target: { tabId },
      func: fetchCatalog,
      args: [target],
    });
    return (result?.result as CatalogSnapshot | undefined) ?? null;
  } catch {
    return null;
  }
}
