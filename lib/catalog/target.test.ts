import { describe, expect, it } from 'vitest';
import { urlSignals } from '../detect/test-helpers';
import {
  productSlugFromPath,
  resolveCatalogTarget,
  searchStateFromUrl,
  slugCandidates,
} from './target';

describe('productSlugFromPath', () => {
  it('lê o linkText antes do /p', () => {
    expect(productSlugFromPath('/camiseta-preta/p')).toBe('camiseta-preta');
  });

  it('tolera barra final e prefixo de locale', () => {
    expect(productSlugFromPath('/camiseta-preta/p/')).toBe('camiseta-preta');
    expect(productSlugFromPath('/en/camiseta-preta/p')).toBe('camiseta-preta');
  });

  it('devolve null fora de uma PDP', () => {
    expect(productSlugFromPath('/camisetas')).toBeNull();
    expect(productSlugFromPath('/')).toBeNull();
  });
});

describe('searchStateFromUrl', () => {
  it('lê o termo tanto do legacy quanto da Intelligent Search', () => {
    expect(
      searchStateFromUrl(urlSignals('https://acme.com.br/busca?_q=camiseta&map=ft'))
        .query,
    ).toBe('camiseta');
    expect(
      searchStateFromUrl(urlSignals('https://acme.com.br/s?q=camiseta')).query,
    ).toBe('camiseta');
  });

  it('reúne map, ordenação, página e segmentos', () => {
    const state = searchStateFromUrl(
      urlSignals('https://acme.com.br/roupas/camisetas?map=c,c&O=OrderByPriceASC&page=2'),
    );

    expect(state.map).toBe('c,c');
    expect(state.order).toBe('OrderByPriceASC');
    expect(state.page).toBe('2');
    expect(state.segments).toEqual(['roupas', 'camisetas']);
  });
});

describe('resolveCatalogTarget', () => {
  it('mira o produto numa PDP', () => {
    expect(
      resolveCatalogTarget(
        urlSignals('https://acme.com.br/camiseta-preta/p'),
        'pdp',
      ),
    ).toEqual({
      kind: 'product',
      slug: 'camiseta-preta',
      slugFallbacks: [],
      entityId: undefined,
    });
  });

  it('carrega os candidatos de slug do FastStore', () => {
    expect(
      resolveCatalogTarget(
        urlSignals('https://www.acme.com.br/-calca-yeapp-622629-1346884/p'),
        'pdp',
      ),
    ).toEqual({
      kind: 'product',
      slug: '-calca-yeapp-622629-1346884',
      slugFallbacks: ['-calca-yeapp-622629'],
      entityId: undefined,
    });
  });

  it('usa o id quando a URL não entrega o slug', () => {
    expect(
      resolveCatalogTarget(urlSignals('https://acme.com.br/produto'), 'pdp', '42'),
    ).toEqual({
      kind: 'product',
      slug: undefined,
      slugFallbacks: undefined,
      entityId: '42',
    });
  });

  it('desiste quando não há slug nem id', () => {
    expect(
      resolveCatalogTarget(urlSignals('https://acme.com.br/produto'), 'pdp'),
    ).toEqual({ kind: 'none' });
  });

  it('mira a categoria numa listagem e numa busca', () => {
    const plp = resolveCatalogTarget(
      urlSignals('https://acme.com.br/roupas?map=c'),
      'plp',
      '15',
    );
    expect(plp.kind).toBe('category');
    expect(plp.entityId).toBe('15');
    expect(plp.search?.map).toBe('c');

    expect(
      resolveCatalogTarget(urlSignals('https://acme.com.br/s?q=x'), 'search').kind,
    ).toBe('category');
  });

  it('não busca nada fora de PDP e listagem', () => {
    for (const template of ['home', 'checkout', 'admin', 'custom'] as const) {
      expect(
        resolveCatalogTarget(urlSignals('https://acme.com.br/'), template).kind,
      ).toBe('none');
    }
  });
});

describe('slugCandidates', () => {
  it('encurta o sufixo de SKU do FastStore', () => {
    expect(slugCandidates('-calca-yeapp-622629-1346884')).toEqual([
      '-calca-yeapp-622629-1346884',
      '-calca-yeapp-622629',
    ]);
  });

  it('mantém slug sem sufixo numérico como candidato único', () => {
    expect(slugCandidates('camiseta-preta')).toEqual(['camiseta-preta']);
  });
});
