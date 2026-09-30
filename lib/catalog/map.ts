/**
 * Mapeamento da resposta de `catalog_system/pub/products/search` para o
 * snapshot do painel.
 *
 * Pura e sem acesso a `browser.*`: roda dentro da página (via
 * `executeScript`) e no popup, quando a resposta vem pelo background. É o
 * que permite mandar só o snapshot de volta, nunca os centenas de KB do
 * catálogo.
 */

import type { CatalogSnapshot } from './signals';

function number(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function mapProductSnapshot(list: unknown[]): CatalogSnapshot | null {
  const product = Array.isArray(list) ? list[0] : null;
  if (!product) return null;

  const p = product as Record<string, any>;

  return {
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
}
