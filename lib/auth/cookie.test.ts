import { describe, expect, it } from 'vitest';
import {
  AUTH_COOKIE,
  cookieAttributes,
  isAdminDomain,
  listAuthCookies,
  pickSourceCookie,
} from './cookie';

describe('cookieAttributes', () => {
  it('grava na origem, sem caminho da página', () => {
    const target = cookieAttributes('https://acme.com.br/camiseta/p?x=1', AUTH_COOKIE);
    expect(target?.url).toBe('https://acme.com.br');
  });

  it('marca secure conforme o protocolo', () => {
    expect(cookieAttributes('https://acme.com.br/', AUTH_COOKIE)?.secure).toBe(true);
    expect(cookieAttributes('http://localhost:3000/', AUTH_COOKIE)?.secure).toBe(
      false,
    );
  });

  it('não afrouxa o SameSite', () => {
    expect(cookieAttributes('https://acme.com.br/', AUTH_COOKIE)?.sameSite).toBe(
      'lax',
    );
  });

  it('recusa URL que não aceita cookie', () => {
    expect(cookieAttributes('chrome://extensions', AUTH_COOKIE)).toBeNull();
    expect(cookieAttributes('não é url', AUTH_COOKIE)).toBeNull();
  });
});

describe('listAuthCookies', () => {
  const names = [
    'VtexIdclientAutCookie',
    'VtexIdclientAutCookie_acme',
    'VtexWorkspace',
    'checkout.vtex.com',
  ];

  it('ignora o que não é cookie de sessão', () => {
    expect(listAuthCookies(names, false).map((entry) => entry.name)).toEqual([
      'VtexIdclientAutCookie',
      'VtexIdclientAutCookie_acme',
    ]);
  });

  it('na loja, o sufixado é o login do shopper', () => {
    expect(listAuthCookies(names, false)).toEqual([
      { name: 'VtexIdclientAutCookie', scope: 'admin' },
      { name: 'VtexIdclientAutCookie_acme', scope: 'store', account: 'acme' },
    ]);
  });

  it('no myvtex, o sufixado também é do admin', () => {
    expect(listAuthCookies(names, true).map((entry) => entry.scope)).toEqual([
      'admin',
      'admin',
    ]);
  });

  it('não inventa account quando o sufixo é vazio', () => {
    expect(listAuthCookies(['VtexIdclientAutCookie_'], false)).toEqual([
      { name: 'VtexIdclientAutCookie_', scope: 'store' },
    ]);
  });

  it('devolve lista vazia sem nenhum cookie de sessão', () => {
    expect(listAuthCookies(['VtexWorkspace'], false)).toEqual([]);
  });
});

describe('isAdminDomain', () => {
  it('reconhece o domínio do admin', () => {
    expect(isAdminDomain('acme.myvtex.com')).toBe(true);
    expect(isAdminDomain('dev--acme.myvtex.com')).toBe(true);
  });

  it('recusa a loja', () => {
    expect(isAdminDomain('www.acme.com.br')).toBe(false);
    expect(isAdminDomain('acme.myvtex.com.br')).toBe(false);
  });
});

describe('pickSourceCookie', () => {
  const suffixed = { name: `${AUTH_COOKIE}_acme`, value: 'token-admin' };
  const plain = { name: AUTH_COOKIE, value: 'token-simples' };

  it('prefere o cookie sufixado pela account', () => {
    expect(pickSourceCookie([plain, suffixed], 'acme')).toBe(suffixed);
  });

  it('cai para o nome puro quando não há sufixado', () => {
    expect(pickSourceCookie([plain], 'acme')).toBe(plain);
  });

  it('ignora o sufixado de outra account', () => {
    const outra = { name: `${AUTH_COOKIE}_outra`, value: 'x' };
    expect(pickSourceCookie([outra, plain], 'acme')).toBe(plain);
  });

  it('ignora cookie com valor vazio', () => {
    expect(
      pickSourceCookie([{ name: `${AUTH_COOKIE}_acme`, value: '' }, plain], 'acme'),
    ).toBe(plain);
    expect(pickSourceCookie([{ name: AUTH_COOKIE, value: '' }], 'acme')).toBeNull();
  });

  it('devolve null quando não há nenhum', () => {
    expect(pickSourceCookie([{ name: 'outro', value: 'x' }], 'acme')).toBeNull();
  });
});
