import { describe, expect, it } from 'vitest';
import {
  MASTER,
  currentWorkspace,
  rememberWorkspace,
  switchWorkspace,
} from './workspace';

describe('currentWorkspace', () => {
  it('lê o workspace do host da myvtex', () => {
    expect(currentWorkspace('https://dev--acme.myvtex.com/p')).toBe('dev');
  });

  it('lê o workspace da query quando o host não carrega um', () => {
    expect(currentWorkspace('https://www.acme.com.br/?workspace=qa')).toBe('qa');
  });

  it('sem nenhum dos dois, a loja está no master', () => {
    expect(currentWorkspace('https://acme.myvtex.com/')).toBe(MASTER);
    expect(currentWorkspace('https://www.acme.com.br/')).toBe(MASTER);
  });
});

describe('switchWorkspace', () => {
  it('troca o prefixo do host da myvtex', () => {
    expect(switchWorkspace('https://dev--acme.myvtex.com/camiseta/p', 'qa')).toBe(
      'https://qa--acme.myvtex.com/camiseta/p',
    );
  });

  it('acrescenta o prefixo quando a URL está no master', () => {
    expect(switchWorkspace('https://acme.myvtex.com/admin', 'dev')).toBe(
      'https://dev--acme.myvtex.com/admin',
    );
  });

  it('volta ao master tirando o prefixo', () => {
    expect(switchWorkspace('https://dev--acme.myvtex.com/p', MASTER)).toBe(
      'https://acme.myvtex.com/p',
    );
  });

  it('no domínio próprio da loja usa a query, que é o que existe lá', () => {
    expect(switchWorkspace('https://www.acme.com.br/busca?q=tenis', 'dev')).toBe(
      'https://www.acme.com.br/busca?q=tenis&workspace=dev',
    );
  });

  it('voltar ao master no domínio próprio tira a query', () => {
    expect(
      switchWorkspace('https://www.acme.com.br/busca?q=tenis&workspace=dev', MASTER),
    ).toBe('https://www.acme.com.br/busca?q=tenis');
  });

  it('limpa a query ao trocar pelo host, para os dois não brigarem', () => {
    expect(
      switchWorkspace('https://acme.myvtex.com/p?workspace=qa', 'dev'),
    ).toBe('https://dev--acme.myvtex.com/p');
  });

  it('preserva path, query e hash', () => {
    expect(
      switchWorkspace('https://dev--acme.myvtex.com/p?sc=2#reviews', 'qa'),
    ).toBe('https://qa--acme.myvtex.com/p?sc=2#reviews');
  });

  it('recusa nome que não é workspace VTEX', () => {
    expect(switchWorkspace('https://acme.myvtex.com/', 'dev workspace')).toBeNull();
    expect(switchWorkspace('https://acme.myvtex.com/', 'dev--acme')).toBeNull();
    expect(switchWorkspace('https://acme.myvtex.com/', '')).toBeNull();
  });

  it('recusa URL que não dá para reescrever', () => {
    expect(switchWorkspace('não é url', 'dev')).toBeNull();
    expect(switchWorkspace('chrome://extensions', 'dev')).toBeNull();
  });
});

describe('rememberWorkspace', () => {
  it('põe o mais recente na frente', () => {
    expect(rememberWorkspace(['qa'], 'dev')).toEqual(['dev', 'qa']);
  });

  it('não repete o que já está na lista', () => {
    expect(rememberWorkspace(['qa', 'dev'], 'dev')).toEqual(['dev', 'qa']);
  });

  it('não guarda o master, que é o estado normal', () => {
    expect(rememberWorkspace(['qa'], MASTER)).toEqual(['qa']);
  });

  it('para de crescer', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(rememberWorkspace(many, 'novo')).toHaveLength(6);
    expect(rememberWorkspace(many, 'novo')[0]).toBe('novo');
  });
});
