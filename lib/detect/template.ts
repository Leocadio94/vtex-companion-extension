/**
 * Que tipo de página está aberta: home, PDP, PLP, busca, checkout, etc.
 *
 * Cada tecnologia expõe essa informação de um jeito. O checkout é a exceção:
 * roda no mesmo `/checkout` nas três, então é resolvido antes de qualquer
 * ramificação por plataforma.
 */

import type {
  DetectionSignals,
  PageTemplate,
  VtexPlatform,
} from './signals';

export interface TemplateVerdict {
  template: PageTemplate;
  reason?: string;
}

/** `route.id` do IO Store Framework. */
const IO_ROUTES: Record<string, PageTemplate> = {
  'store.home': 'home',
  'store.product': 'pdp',
  'store.login': 'login',
  'store.account': 'account',
  'store.orderplaced': 'order-placed',
  'store.checkout': 'checkout',
  'store.search': 'plp',
};

/** `pageCategory` do `vtex.events.addData` no CMS Legacy Portal. */
const LEGACY_CATEGORIES: Record<string, PageTemplate> = {
  home: 'home',
  product: 'pdp',
  department: 'plp',
  category: 'plp',
  subcategory: 'plp',
  brand: 'plp',
  search: 'search',
  internalsitesearch: 'search',
  checkout: 'checkout',
  orderplaced: 'order-placed',
  login: 'login',
  account: 'account',
};

/** `page` do `__NEXT_DATA__` nas rotas padrão do FastStore. */
const FASTSTORE_PAGES: Record<string, PageTemplate> = {
  '/': 'home',
  '/[slug]/p': 'pdp',
  '/s': 'search',
  '/login': 'login',
  '/account': 'account',
  '/checkout': 'checkout',
};

function detectCheckout(signals: DetectionSignals): TemplateVerdict | null {
  const { pathname, hash } = signals.url;
  if (!pathname.startsWith('/checkout')) return null;

  const step = hash.replace(/^#\/?/, '').toLowerCase();
  if (step.startsWith('orderplaced') || pathname.includes('orderPlaced')) {
    return { template: 'order-placed', reason: 'rota de checkout em orderPlaced' };
  }

  return { template: 'checkout', reason: `rota de checkout${step ? ` (#/${step})` : ''}` };
}

function detectIo(signals: DetectionSignals): TemplateVerdict | null {
  const route = signals.page?.runtime?.route;
  if (!route?.id) return null;

  const contextType = route.pageContext?.type?.toLowerCase();

  if (route.id === 'store.search') {
    const template: PageTemplate = contextType === 'search' ? 'search' : 'plp';
    return { template, reason: `route.id=store.search, pageContext.type=${contextType ?? 'desconhecido'}` };
  }

  const mapped = IO_ROUTES[route.id];
  if (mapped) return { template: mapped, reason: `route.id=${route.id}` };

  return { template: 'custom', reason: `route.id=${route.id}` };
}

function detectFastStore(signals: DetectionSignals): TemplateVerdict | null {
  const page = signals.page?.nextData?.page;
  if (!page) return null;

  const mapped = FASTSTORE_PAGES[page];
  if (mapped) return { template: mapped, reason: `__NEXT_DATA__.page=${page}` };

  // `/[...slug]` cobre tanto coleção quanto landing page de CMS. O JSON-LD
  // separa os dois: só a listagem publica um ItemList.
  if (signals.page?.jsonLdTypes.includes('ItemList')) {
    return { template: 'plp', reason: `${page} com JSON-LD ItemList` };
  }

  return { template: 'custom', reason: `__NEXT_DATA__.page=${page}` };
}

function detectLegacy(signals: DetectionSignals): TemplateVerdict | null {
  const category = signals.page?.legacy?.pageCategory;
  if (typeof category !== 'string') return null;

  const mapped = LEGACY_CATEGORIES[category.toLowerCase()];
  return mapped
    ? { template: mapped, reason: `pageCategory=${category}` }
    : { template: 'custom', reason: `pageCategory=${category}` };
}

/** Último recurso: só a URL. Vale para qualquer tecnologia. */
function detectFromUrl(signals: DetectionSignals): TemplateVerdict {
  const { pathname, search } = signals.url;

  if (pathname === '/' || pathname === '') {
    return { template: 'home', reason: 'path raiz' };
  }
  if (/\/p\/?$/.test(pathname)) {
    return { template: 'pdp', reason: 'path termina em /p' };
  }
  if (pathname.startsWith('/s') || search.includes('q=')) {
    return { template: 'search', reason: 'rota de busca' };
  }
  if (search.includes('map=')) {
    return { template: 'plp', reason: 'query com map=' };
  }

  return { template: 'unknown' };
}

export function detectTemplate(
  signals: DetectionSignals,
  platform: VtexPlatform,
): TemplateVerdict {
  const checkout = detectCheckout(signals);
  if (checkout) return checkout;

  if (signals.url.pathname.startsWith('/admin')) {
    return { template: 'admin', reason: 'path do admin VTEX' };
  }

  const byPlatform =
    platform === 'io'
      ? detectIo(signals)
      : platform === 'faststore'
        ? detectFastStore(signals)
        : platform === 'cms-legacy'
          ? detectLegacy(signals)
          : null;

  return byPlatform ?? detectFromUrl(signals);
}
