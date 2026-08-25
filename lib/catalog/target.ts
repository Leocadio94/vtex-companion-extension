/**
 * Decide o que buscar no catálogo a partir da página aberta.
 *
 * Função pura: recebe URL, template e o id da entidade que a detecção
 * encontrou, e devolve o alvo. Quem faz a requisição é `probe.ts`.
 */

import type { PageTemplate, UrlSignals } from '../detect/signals';
import type { SearchState } from './signals';

export interface CatalogTarget {
  kind: 'product' | 'category' | 'none';
  /** `linkText` do produto, tirado da URL. */
  slug?: string;
  /** productId ou categoryId, quando a página expõe. */
  entityId?: string;
  search?: SearchState;
}

/** `/camiseta-preta/p` → `camiseta-preta`. Tolera prefixo de locale. */
export function productSlugFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.at(-1)?.toLowerCase() !== 'p') return null;
  return segments.at(-2) ?? null;
}

export function searchStateFromUrl(url: UrlSignals): SearchState {
  const params = new URLSearchParams(url.search);
  return {
    // `_q` é o legacy e o IO; `q` é a Intelligent Search e o FastStore.
    query: params.get('_q') ?? params.get('q'),
    map: params.get('map'),
    order: params.get('O') ?? params.get('sort') ?? params.get('order'),
    page: params.get('page') ?? params.get('PS'),
    segments: url.pathname.split('/').filter(Boolean),
  };
}

export function resolveCatalogTarget(
  url: UrlSignals,
  template: PageTemplate,
  entityId?: string,
): CatalogTarget {
  if (template === 'pdp') {
    const slug = productSlugFromPath(url.pathname);
    return slug || entityId
      ? { kind: 'product', slug: slug ?? undefined, entityId }
      : { kind: 'none' };
  }

  if (template === 'plp' || template === 'search') {
    return { kind: 'category', entityId, search: searchStateFromUrl(url) };
  }

  return { kind: 'none' };
}
