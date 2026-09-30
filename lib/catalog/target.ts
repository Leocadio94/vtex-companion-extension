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
  /**
   * Slugs alternativos do mais específico ao mais curto: o path do FastStore
   * pode carregar o SKU id que o `linkText` do catálogo não tem.
   */
  slugFallbacks?: string[];
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

/**
 * Candidatos de `linkText` a partir do slug da URL, em ordem de tentativa.
 *
 * O FastStore acrescenta o SKU selecionado ao path (`/{linkText}-{skuId}/p`),
 * e buscar pelo path inteiro devolve lista vazia: o `linkText` no catálogo
 * termina no `-productId`. Um encurte só — o candidato seguinte é o próprio
 * `linkText`, e encurtar além disso buscaria produto errado.
 */
export function slugCandidates(slug: string): string[] {
  const trimmed = slug.replace(/-\d+$/, '');
  return trimmed === slug ? [slug] : [slug, trimmed];
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
      ? {
          kind: 'product',
          slug: slug ?? undefined,
          slugFallbacks: slug ? slugCandidates(slug).slice(1) : undefined,
          entityId,
        }
      : { kind: 'none' };
  }

  if (template === 'plp' || template === 'search') {
    return { kind: 'category', entityId, search: searchStateFromUrl(url) };
  }

  return { kind: 'none' };
}
