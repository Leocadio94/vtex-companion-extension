import { describe, expect, it } from 'vitest';
import { URL_FLAGS, clearFlags, readFlags, setFlag } from './flags';

const STORE = 'https://www.acme.com.br/camiseta/p';

describe('readFlags', () => {
  it('lê as flags presentes na URL', () => {
    const flags = readFlags(`${STORE}?workspace=dev&sc=2`);

    expect(flags.workspace).toBe('dev');
    expect(flags.sc).toBe('2');
  });

  it('ignora o que não é flag conhecida', () => {
    expect(readFlags(`${STORE}?utm_source=news`)).toEqual({});
  });

  it('devolve vazio para URL que não dá para ler', () => {
    expect(readFlags('não é url')).toEqual({});
  });
});

describe('setFlag', () => {
  it('acrescenta preservando a query que já estava lá', () => {
    const next = setFlag(`${STORE}?utm_source=news`, 'workspace', 'dev');

    expect(next).toBe(`${STORE}?utm_source=news&workspace=dev`);
  });

  it('substitui em vez de duplicar', () => {
    const next = setFlag(`${STORE}?workspace=dev`, 'workspace', 'qa');

    expect(next).toBe(`${STORE}?workspace=qa`);
  });

  it('remove com null, e a interrogação some junto com o último parâmetro', () => {
    expect(setFlag(`${STORE}?workspace=dev`, 'workspace', null)).toBe(STORE);
  });

  it('trata valor vazio como remoção', () => {
    expect(setFlag(`${STORE}?sc=2`, 'sc', '   ')).toBe(STORE);
  });

  it('apara o valor colado com espaço em volta', () => {
    expect(setFlag(STORE, 'sc', ' 2 ')).toBe(`${STORE}?sc=2`);
  });

  it('não mexe no path nem no hash', () => {
    const next = setFlag(`${STORE}#reviews`, '__siteEditor', 'true');

    expect(next).toBe(`${STORE}?__siteEditor=true#reviews`);
  });

  it('devolve null quando a URL não serve', () => {
    expect(setFlag('não é url', 'sc', '2')).toBeNull();
    expect(setFlag('chrome://extensions', 'sc', '2')).toBeNull();
  });
});

describe('clearFlags', () => {
  it('tira só as flags conhecidas', () => {
    const next = clearFlags(
      `${STORE}?utm_source=news&workspace=dev&__siteEditor=true&sc=2`,
    );

    expect(next).toBe(`${STORE}?utm_source=news`);
  });

  it('devolve a mesma URL quando não há flag nenhuma', () => {
    expect(clearFlags(STORE)).toBe(STORE);
  });
});

describe('URL_FLAGS', () => {
  it('descreve as flags que a interface oferece', () => {
    expect(URL_FLAGS.map((flag) => flag.key)).toEqual([
      'workspace',
      '__siteEditor',
      '__disableSSR',
      '__disableRuntimeSSR',
      '__bindingAddress',
      'sc',
    ]);
  });

  it('toda flag de liga-desliga sabe o valor que grava', () => {
    for (const flag of URL_FLAGS) {
      if (flag.kind === 'toggle') expect(flag.on).toBeTruthy();
    }
  });
});
