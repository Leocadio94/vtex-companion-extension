import { describe, expect, it } from 'vitest';
import { acceptsBody, buildRequest, isUnsafeMethod } from './request';

const ORIGIN = 'https://acme.com.br';

const input = (overrides: Partial<Parameters<typeof buildRequest>[0]> = {}) => ({
  method: 'GET',
  url: '/api/sessions?items=*',
  headers: '',
  body: '',
  ...overrides,
});

function built(overrides = {}) {
  const result = buildRequest(input(overrides), ORIGIN);
  if (!result.ok) throw new Error(result.error);
  return result.request;
}

function failure(overrides = {}) {
  const result = buildRequest(input(overrides), ORIGIN);
  if (result.ok) throw new Error('esperava falha');
  return result.error;
}

describe('buildRequest', () => {
  it('resolve caminho contra a origem da aba', () => {
    const request = built();
    expect(request.url).toBe('https://acme.com.br/api/sessions?items=*');
    expect(request.sameOrigin).toBe(true);
  });

  it('aceita URL completa e marca quando é outra origem', () => {
    expect(built({ url: 'https://acme.myvtex.com/api/oms/pvt/orders' }).sameOrigin).toBe(
      false,
    );
    expect(built({ url: 'https://acme.com.br/api/sessions' }).sameOrigin).toBe(true);
  });

  it('recusa entrada que não é caminho nem URL', () => {
    expect(failure({ url: 'api/sessions' })).toContain('Comece com');
    expect(failure({ url: '' })).toContain('Informe');
    expect(failure({ url: 'ftp://acme.com.br/x' })).toContain('http');
  });

  it('recusa método fora da lista', () => {
    expect(failure({ method: 'TRACE' })).toContain('não suportado');
  });

  it('põe accept em JSON quando o usuário não define', () => {
    expect(built().headers['accept']).toBe('application/json');
  });

  it('não sobrescreve um accept informado, mesmo com outra caixa', () => {
    expect(built({ headers: 'Accept: text/html' }).headers['Accept']).toBe(
      'text/html',
    );
    expect(built({ headers: 'Accept: text/html' }).headers['accept']).toBeUndefined();
  });

  it('lê cabeçalhos livres, um por linha, ignorando vazias', () => {
    const headers = built({
      headers: 'REST-Range: resources=0-99\n\nX-Vtex-Use-Https: true',
    }).headers;

    expect(headers['REST-Range']).toBe('resources=0-99');
    expect(headers['X-Vtex-Use-Https']).toBe('true');
  });

  it('recusa cabeçalho malformado', () => {
    expect(failure({ headers: 'sem separador' })).toContain('Cabeçalho inválido');
  });

  it('manda corpo só em método que aceita, com content-type padrão', () => {
    const post = built({ method: 'POST', body: '{"a":1}' });
    expect(post.body).toBe('{"a":1}');
    expect(post.headers['content-type']).toBe('application/json');

    expect(built({ method: 'GET', body: '{"a":1}' }).body).toBeUndefined();
  });

  it('respeita content-type informado', () => {
    const request = built({
      method: 'POST',
      body: 'a=1',
      headers: 'Content-Type: application/x-www-form-urlencoded',
    });

    expect(request.headers['Content-Type']).toBe(
      'application/x-www-form-urlencoded',
    );
  });
});

describe('classificação de método', () => {
  it('separa o que altera estado', () => {
    expect(isUnsafeMethod('GET')).toBe(false);
    expect(isUnsafeMethod('head')).toBe(false);
    for (const method of ['POST', 'put', 'PATCH', 'delete']) {
      expect(isUnsafeMethod(method)).toBe(true);
    }
  });

  it('separa o que carrega corpo', () => {
    expect(acceptsBody('GET')).toBe(false);
    expect(acceptsBody('HEAD')).toBe(false);
    expect(acceptsBody('POST')).toBe(true);
    expect(acceptsBody('DELETE')).toBe(true);
  });
});
