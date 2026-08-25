import { describe, expect, it } from 'vitest';
import { isPreviewUrl, rewritePreviewUrl } from './rewrite';

const opts = { port: 3000 };

describe('isPreviewUrl', () => {
  it('reconhece o preview do CMS legacy pelos três parâmetros', () => {
    expect(
      isPreviewUrl(
        'https://acme.vtex.app/?contentType=page&documentId=abc&versionId=def',
      ),
    ).toBe(true);
  });

  it('reconhece o preview do CMS novo pelo path /api/preview', () => {
    expect(isPreviewUrl('https://acme.vtex.app/api/preview?entryId=x')).toBe(
      true,
    );
  });

  it('aceita /api/preview com barra final', () => {
    expect(isPreviewUrl('https://acme.vtex.app/api/preview/?entryId=x')).toBe(
      true,
    );
  });

  it('rejeita quando falta um dos três parâmetros do legacy', () => {
    expect(
      isPreviewUrl('https://acme.vtex.app/?contentType=page&documentId=abc'),
    ).toBe(false);
  });

  it('rejeita URLs que já apontam para o localhost, para não gerar loop', () => {
    expect(
      isPreviewUrl('http://localhost:3000/api/preview?entryId=x'),
    ).toBe(false);
    expect(
      isPreviewUrl('http://127.0.0.1:3000/api/preview?entryId=x'),
    ).toBe(false);
  });

  it('rejeita protocolos que não são http(s)', () => {
    expect(isPreviewUrl('about:blank')).toBe(false);
    expect(isPreviewUrl('chrome://newtab')).toBe(false);
  });

  it('rejeita entrada inválida', () => {
    expect(isPreviewUrl('')).toBe(false);
    expect(isPreviewUrl('não é uma url')).toBe(false);
  });
});

describe('rewritePreviewUrl', () => {
  it('move o preview legacy da raiz para /api/preview no localhost', () => {
    expect(
      rewritePreviewUrl(
        'https://acme.vtex.app/?contentType=page&documentId=abc&versionId=def',
        opts,
      ),
    ).toBe(
      'http://localhost:3000/api/preview?contentType=page&documentId=abc&versionId=def',
    );
  });

  it('funciona quando a Preview URL é o domínio de produção da loja', () => {
    expect(
      rewritePreviewUrl(
        'https://www.acme.com.br/?contentType=page&documentId=abc&versionId=def',
        opts,
      ),
    ).toBe(
      'http://localhost:3000/api/preview?contentType=page&documentId=abc&versionId=def',
    );
  });

  it('troca apenas o origin quando o path já é /api/preview (CMS novo)', () => {
    expect(
      rewritePreviewUrl(
        'https://acme.vtex.app/api/preview?entryId=x&branch=main&locale=pt-BR',
        opts,
      ),
    ).toBe('http://localhost:3000/api/preview?entryId=x&branch=main&locale=pt-BR');
  });

  it('preserva um path que não seja a raiz', () => {
    expect(
      rewritePreviewUrl(
        'https://acme.vtex.app/institucional/sobre?contentType=page&documentId=abc&versionId=def',
        opts,
      ),
    ).toBe(
      'http://localhost:3000/institucional/sobre?contentType=page&documentId=abc&versionId=def',
    );
  });

  it('preserva o hash', () => {
    expect(
      rewritePreviewUrl(
        'https://acme.vtex.app/api/preview?entryId=x#section-2',
        opts,
      ),
    ).toBe('http://localhost:3000/api/preview?entryId=x#section-2');
  });

  it('respeita a porta configurada', () => {
    expect(
      rewritePreviewUrl('https://acme.vtex.app/api/preview?entryId=x', {
        port: 4000,
      }),
    ).toBe('http://localhost:4000/api/preview?entryId=x');
  });

  it('devolve null quando a URL não é de preview', () => {
    expect(rewritePreviewUrl('https://acme.vtex.app/p/produto', opts)).toBeNull();
  });

  it('devolve null para uma URL já reescrita, para não gerar loop', () => {
    expect(
      rewritePreviewUrl('http://localhost:3000/api/preview?entryId=x', opts),
    ).toBeNull();
  });
});
