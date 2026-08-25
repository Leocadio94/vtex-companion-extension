import { describe, expect, it } from 'vitest';
import { classifyPixels } from './vendors';
import type { PixelSignals } from './signals';

const STORE = 'https://acme.com.br';

function signals(overrides: Partial<PixelSignals> = {}): PixelSignals {
  return { urls: [], globals: [], inlineIds: [], ...overrides };
}

const vendorIds = (report: ReturnType<typeof classifyPixels>) =>
  report.vendors.map((vendor) => vendor.id);

describe('classifyPixels', () => {
  it('identifica o GTM e extrai o container', () => {
    const report = classifyPixels(
      signals({
        urls: ['https://www.googletagmanager.com/gtm.js?id=GTM-ABC123'],
      }),
      STORE,
    );

    expect(report.vendors[0]?.id).toBe('gtm');
    expect(report.vendors[0]?.ids).toEqual(['GTM-ABC123']);
    expect(report.vendors[0]?.evidence).toEqual(['rede']);
  });

  it('extrai o id do Meta da requisição de tracking', () => {
    const report = classifyPixels(
      signals({
        urls: [
          'https://connect.facebook.net/pt_BR/fbevents.js',
          'https://www.facebook.com/tr/?id=123456789&ev=PageView',
        ],
        globals: ['fbq'],
      }),
      STORE,
    );

    const meta = report.vendors.find((vendor) => vendor.id === 'meta');
    expect(meta?.ids).toEqual(['123456789']);
    expect(meta?.evidence).toEqual(['rede', 'global']);
  });

  it('pega vendor que só aparece como global', () => {
    const report = classifyPixels(signals({ globals: ['ttq'] }), STORE);
    expect(vendorIds(report)).toEqual(['tiktok']);
    expect(report.vendors[0]?.evidence).toEqual(['global']);
  });

  it('pega GTM injetado inline, sem script src', () => {
    const report = classifyPixels(
      signals({ inlineIds: ['GTM-INLINE1'] }),
      STORE,
    );

    expect(report.vendors[0]?.id).toBe('gtm');
    expect(report.vendors[0]?.evidence).toEqual(['inline']);
  });

  it('não conta a própria loja nem a infraestrutura VTEX como terceiro', () => {
    const report = classifyPixels(
      signals({
        urls: [
          'https://acme.com.br/assets/app.js',
          'https://acme.vtexassets.com/img.png',
          'https://acme.vteximg.com.br/arquivos/x.png',
          'https://acme.myvtex.com/api/sessions',
        ],
      }),
      STORE,
    );

    expect(report.others).toEqual([]);
  });

  it('agrupa os terceiros desconhecidos por origem e ordena por volume', () => {
    const report = classifyPixels(
      signals({
        urls: [
          'https://cdn.exemplo.com/a.js',
          'https://cdn.exemplo.com/b.js',
          'https://outro.com/c.js',
        ],
      }),
      STORE,
    );

    expect(report.others).toEqual([
      { origin: 'https://cdn.exemplo.com', requests: 2 },
      { origin: 'https://outro.com', requests: 1 },
    ]);
  });

  it('tira dos desconhecidos o que já virou vendor', () => {
    const report = classifyPixels(
      signals({ urls: ['https://www.clarity.ms/tag/abc'] }),
      STORE,
    );

    expect(vendorIds(report)).toContain('clarity');
    expect(report.others).toEqual([]);
  });

  it('ignora URLs inválidas em vez de quebrar', () => {
    const report = classifyPixels(
      signals({ urls: ['data:text/javascript,void 0', 'não é url'] }),
      STORE,
    );

    expect(report.others).toEqual([]);
  });
});
