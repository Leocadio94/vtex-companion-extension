import { describe, expect, it } from 'vitest';
import { detect } from './index';
import { parseVtexHost } from './account';
import {
  cookieSignals,
  pageSignals,
  sessionSignals,
  signals,
} from './test-helpers';

describe('parseVtexHost', () => {
  it('lê account em {account}.myvtex.com', () => {
    expect(parseVtexHost('acme.myvtex.com')).toEqual({
      account: 'acme',
      isVtexHost: true,
    });
  });

  it('lê workspace e account em {workspace}--{account}.myvtex.com', () => {
    expect(parseVtexHost('dev--acme.myvtex.com')).toEqual({
      account: 'acme',
      workspace: 'dev',
      isVtexHost: true,
    });
  });

  it('reconhece vtex.app e vtexcommercestable', () => {
    expect(parseVtexHost('acme.vtex.app').account).toBe('acme');
    expect(parseVtexHost('acme.vtexcommercestable.com.br').account).toBe('acme');
  });

  it('não infere nada de um domínio próprio da loja', () => {
    expect(parseVtexHost('www.acme.com.br')).toEqual({ isVtexHost: false });
  });
});

describe('detect — IO Store Framework', () => {
  const io = signals('https://www.acme.com.br/camisetas?map=c', {
    cookies: cookieSignals({ names: ['vtex_segment', 'VtexWorkspace'] }),
    page: pageSignals({
      runtime: {
        account: 'acme',
        workspace: 'master',
        production: true,
        route: {
          id: 'store.search',
          pageContext: { type: 'category', id: '15' },
        },
      },
      assetAccounts: ['acme'],
    }),
  });

  it('identifica IO pelo __RUNTIME__ com confiança alta', () => {
    const result = detect(io);
    expect(result.platform).toBe('io');
    expect(result.confidence).toBe('high');
    expect(result.isVtex).toBe(true);
  });

  it('tira account e workspace do runtime', () => {
    const result = detect(io);
    expect(result.account).toBe('acme');
    expect(result.workspace).toBe('master');
  });

  it('separa PLP de busca pelo pageContext.type', () => {
    expect(detect(io).template).toBe('plp');

    const search = signals('https://www.acme.com.br/busca?q=camiseta', {
      page: pageSignals({
        runtime: {
          route: { id: 'store.search', pageContext: { type: 'search' } },
        },
      }),
    });
    expect(detect(search).template).toBe('search');
  });

  it('usa a classe render-route quando o runtime ficou para trás numa navegação SPA', () => {
    const spa = signals('https://www.acme.com.br/camiseta-preta/p', {
      page: pageSignals({
        // O runtime ainda é o snapshot da home, renderizada no SSR.
        runtime: { route: { id: 'store.home', path: '/' } },
        runtimeRouteStale: true,
        ioRouteClass: 'store-product',
      }),
    });

    const result = detect(spa);
    expect(result.template).toBe('pdp');
    expect(result.templateReason).toContain('render-route');
  });

  it('desempata PLP e busca pela URL quando só existe a classe render-route', () => {
    const plp = signals('https://www.acme.com.br/camisetas?map=c', {
      page: pageSignals({
        runtime: { route: { id: 'store.home', path: '/' } },
        runtimeRouteStale: true,
        ioRouteClass: 'store-search',
      }),
    });
    expect(detect(plp).template).toBe('plp');

    const search = signals('https://www.acme.com.br/camiseta?_q=camiseta&map=ft', {
      page: pageSignals({
        runtime: { route: { id: 'store.home', path: '/' } },
        runtimeRouteStale: true,
        ioRouteClass: 'store-search',
      }),
    });
    expect(detect(search).template).toBe('search');
  });

  it('assume a rota desatualizada, sinalizando, quando não há classe render-route', () => {
    const result = detect(
      signals('https://www.acme.com.br/camiseta-preta/p', {
        page: pageSignals({
          runtime: { route: { id: 'store.home', path: '/' } },
          runtimeRouteStale: true,
        }),
      }),
    );

    expect(result.templateReason).toContain('desatualizado');
  });

  it('trata route.id desconhecido como página custom', () => {
    const custom = signals('https://www.acme.com.br/institucional', {
      page: pageSignals({
        runtime: { route: { id: 'store.custom#institucional' } },
      }),
    });
    expect(detect(custom).template).toBe('custom');
  });
});

describe('detect — FastStore', () => {
  it('identifica FastStore pela marcação data-fs-*', () => {
    const result = detect(
      signals('https://acme.vtex.app/camiseta-preta/p', {
        page: pageSignals({
          nextData: { page: '/[slug]/p', buildId: 'abc' },
          hasFastStoreMarkup: true,
          assetAccounts: ['acme'],
        }),
      }),
    );

    expect(result.platform).toBe('faststore');
    expect(result.template).toBe('pdp');
    expect(result.account).toBe('acme');
  });

  it('usa o JSON-LD para separar coleção de landing page em /[...slug]', () => {
    const plp = detect(
      signals('https://acme.vtex.app/colecao/verao', {
        page: pageSignals({
          nextData: { page: '/[...slug]' },
          hasFastStoreMarkup: true,
          jsonLdTypes: ['ItemList', 'BreadcrumbList'],
        }),
      }),
    );
    expect(plp.template).toBe('plp');

    const landing = detect(
      signals('https://acme.vtex.app/institucional/sobre', {
        page: pageSignals({
          nextData: { page: '/[...slug]' },
          hasFastStoreMarkup: true,
          jsonLdTypes: ['WebPage'],
        }),
      }),
    );
    expect(landing.template).toBe('custom');
  });

  it('classifica Next sem marcação do FastStore como headless', () => {
    const result = detect(
      signals('https://www.acme.com.br/', {
        cookies: cookieSignals({ names: ['vtex_segment'] }),
        page: pageSignals({
          nextData: { page: '/' },
          assetAccounts: ['acme'],
        }),
      }),
    );

    expect(result.platform).toBe('headless');
    expect(result.isVtex).toBe(true);
  });
});

describe('detect — CMS Legacy Portal', () => {
  it('identifica o legacy e lê o pageCategory', () => {
    const result = detect(
      signals('https://www.acme.com.br/camiseta-preta/p', {
        cookies: cookieSignals({ names: ['checkout.vtex.com'] }),
        page: pageSignals({
          legacy: {
            pageCategory: 'Product',
            productId: 42,
            accountName: 'acme',
          },
          hasVtexJs: true,
        }),
      }),
    );

    expect(result.platform).toBe('cms-legacy');
    expect(result.template).toBe('pdp');
    expect(result.account).toBe('acme');
  });
});

describe('detect — checkout', () => {
  it('reconhece o checkout em qualquer tecnologia', () => {
    const result = detect(
      signals('https://www.acme.com.br/checkout/#/payment', {
        page: pageSignals({
          runtime: { route: { id: 'store.home' } },
          hasVtexJs: true,
        }),
      }),
    );

    expect(result.template).toBe('checkout');
  });

  it('separa orderPlaced do restante do checkout', () => {
    const result = detect(
      signals('https://www.acme.com.br/checkout/#/orderPlaced?og=123', {
        page: pageSignals({ hasVtexJs: true }),
      }),
    );

    expect(result.template).toBe('order-placed');
  });
});

describe('detect — ambiente e autenticação', () => {
  it('reconhece o admin e o workspace pela URL', () => {
    const result = detect(
      signals('https://dev--acme.myvtex.com/admin/app/new-cms/faststore', {
        cookies: cookieSignals({ hasAdminAuthCookie: true }),
      }),
    );

    expect(result.environment).toBe('admin');
    expect(result.isWorkspace).toBe(true);
    expect(result.workspace).toBe('dev');
    expect(result.account).toBe('acme');
    expect(result.template).toBe('admin');
    expect(result.auth.admin).toBe(true);
  });

  it('reporta a loja final como storefront', () => {
    expect(detect(signals('https://www.acme.com.br/')).environment).toBe(
      'storefront',
    );
  });

  it('deixa a autenticação de loja como desconhecida sem o probe de sessão', () => {
    expect(detect(signals('https://www.acme.com.br/')).auth.storefront).toBe(
      'unknown',
    );
  });

  it('usa o probe de sessão quando ele existe', () => {
    const result = detect(
      signals('https://www.acme.com.br/', {
        session: sessionSignals({
          isAuthenticated: true,
          email: 'dev@acme.com.br',
        }),
      }),
    );

    expect(result.auth.storefront).toBe(true);
    expect(result.auth.storefrontEmail).toBe('dev@acme.com.br');
  });
});

describe('detect — site que não é VTEX', () => {
  it('não inventa plataforma sem nenhum sinal', () => {
    const result = detect(
      signals('https://www.example.com/', { page: pageSignals() }),
    );

    expect(result.isVtex).toBe(false);
    expect(result.platform).toBe('not-vtex');
    expect(result.confidence).toBe('none');
  });
});
