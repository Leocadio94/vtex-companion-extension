import { describe, expect, it } from 'vitest';
import { analyzeSeo, worstSeverity } from './analyze';
import type { SeoSignals } from './signals';

function seo(overrides: Partial<SeoSignals> = {}): SeoSignals {
  return {
    url: 'https://acme.com.br/camiseta-preta/p',
    lang: 'pt-BR',
    title: 'Camiseta Preta Masculina | Acme',
    description:
      'Camiseta preta masculina em algodão, com caimento reto e disponível em cinco tamanhos. Frete grátis acima de R$ 199.',
    canonical: 'https://acme.com.br/camiseta-preta/p',
    robots: null,
    googlebot: null,
    viewport: 'width=device-width, initial-scale=1',
    openGraph: { title: 'Camiseta Preta', image: 'https://acme.com.br/i.jpg' },
    twitter: {},
    hreflang: [],
    headings: { h1: ['Camiseta Preta Masculina'], h2: 4, h3: 2 },
    images: { total: 10, withoutAlt: 0 },
    jsonLdTypes: ['Product', 'BreadcrumbList'],
    ...overrides,
  };
}

const ids = (signals: SeoSignals, template: Parameters<typeof analyzeSeo>[1] = 'pdp') =>
  analyzeSeo(signals, template).map((finding) => finding.id);

describe('analyzeSeo', () => {
  it('não acusa nada numa PDP bem montada', () => {
    expect(ids(seo())).toEqual([]);
  });

  it('trata noindex como erro', () => {
    const findings = analyzeSeo(seo({ robots: 'noindex, follow' }), 'pdp');
    expect(findings[0]?.id).toBe('noindex');
    expect(findings[0]?.severity).toBe('error');
  });

  it('lê noindex também do googlebot', () => {
    expect(ids(seo({ googlebot: 'NOINDEX' }))).toContain('noindex');
  });

  it('cobra title ausente, curto e longo', () => {
    expect(ids(seo({ title: null }))).toContain('title-missing');
    expect(ids(seo({ title: 'Camiseta' }))).toContain('title-short');
    expect(ids(seo({ title: 'C'.repeat(61) }))).toContain('title-long');
  });

  it('cobra description ausente e comenta os extremos', () => {
    expect(ids(seo({ description: null }))).toContain('description-missing');
    expect(ids(seo({ description: 'curta' }))).toContain('description-short');
    expect(ids(seo({ description: 'd'.repeat(161) }))).toContain(
      'description-long',
    );
  });

  it('aceita canonical que só difere na query ou na barra final', () => {
    expect(
      ids(
        seo({
          url: 'https://acme.com.br/camiseta-preta/p/?utm_source=x',
          canonical: 'https://acme.com.br/camiseta-preta/p',
        }),
      ),
    ).toEqual([]);
  });

  it('avisa quando o canonical aponta para outra página', () => {
    expect(
      ids(seo({ canonical: 'https://acme.com.br/outra/p' })),
    ).toContain('canonical-elsewhere');
  });

  it('cobra H1 ausente e comenta H1 repetido', () => {
    expect(ids(seo({ headings: { h1: [], h2: 0, h3: 0 } }))).toContain(
      'h1-missing',
    );
    expect(
      ids(seo({ headings: { h1: ['a', 'b'], h2: 0, h3: 0 } })),
    ).toContain('h1-multiple');
  });

  it('cobra dados estruturados conforme o tipo de página', () => {
    expect(ids(seo({ jsonLdTypes: ['BreadcrumbList'] }), 'pdp')).toContain(
      'jsonld-product',
    );
    expect(ids(seo({ jsonLdTypes: ['BreadcrumbList'] }), 'plp')).toContain(
      'jsonld-itemlist',
    );
    // Home não é cobrada por Product nem por ItemList.
    expect(ids(seo({ jsonLdTypes: [] }), 'home')).not.toContain(
      'jsonld-product',
    );
  });

  it('conta imagens sem alt', () => {
    const findings = analyzeSeo(
      seo({ images: { total: 10, withoutAlt: 3 } }),
      'pdp',
    );
    expect(findings.find((f) => f.id === 'img-alt')?.message).toContain(
      '3 de 10',
    );
  });
});

describe('worstSeverity', () => {
  it('escala de info até error', () => {
    expect(worstSeverity([])).toBeNull();
    expect(worstSeverity([{ id: 'a', severity: 'info', message: '' }])).toBe(
      'info',
    );
    expect(
      worstSeverity([
        { id: 'a', severity: 'info', message: '' },
        { id: 'b', severity: 'warn', message: '' },
      ]),
    ).toBe('warn');
    expect(
      worstSeverity([
        { id: 'a', severity: 'warn', message: '' },
        { id: 'b', severity: 'error', message: '' },
      ]),
    ).toBe('error');
  });
});
