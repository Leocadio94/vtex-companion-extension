import { describe, expect, it } from 'vitest';
import { prettyJson, tokenizeJson } from './format';

describe('prettyJson', () => {
  it('indenta JSON válido', () => {
    expect(prettyJson('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  it('devolve null para corpo que não é JSON', () => {
    expect(prettyJson('<html></html>')).toBeNull();
    expect(prettyJson('')).toBeNull();
    expect(prettyJson('   ')).toBeNull();
  });

  it('aceita array na raiz', () => {
    expect(prettyJson('[1,2]')).toBe('[\n  1,\n  2\n]');
  });
});

describe('tokenizeJson', () => {
  const types = (text: string) =>
    tokenizeJson(text)
      .filter((token) => token.type !== 'punct')
      .map((token) => [token.type, token.text]);

  it('separa chave de valor string', () => {
    expect(types('{"nome": "acme"}')).toEqual([
      ['key', '"nome"'],
      ['string', '"acme"'],
    ]);
  });

  it('reconhece número, booleano e null', () => {
    expect(types('{"a": 1, "b": true, "c": null}')).toEqual([
      ['key', '"a"'],
      ['number', '1'],
      ['key', '"b"'],
      ['literal', 'true'],
      ['key', '"c"'],
      ['literal', 'null'],
    ]);
  });

  it('lida com negativo e expoente', () => {
    expect(types('[-1.5, 2e10]')).toEqual([
      ['number', '-1.5'],
      ['number', '2e10'],
    ]);
  });

  it('não se perde com aspas escapadas dentro da string', () => {
    expect(types('{"a": "diz \\"oi\\""}')).toEqual([
      ['key', '"a"'],
      ['string', '"diz \\"oi\\""'],
    ]);
  });

  it('trata como valor a string que não é seguida de dois-pontos', () => {
    expect(types('["a", "b"]')).toEqual([
      ['string', '"a"'],
      ['string', '"b"'],
    ]);
  });

  it('preserva o texto inteiro ao juntar os pedaços', () => {
    const text = '{\n  "a": [1, "x"],\n  "b": false\n}';
    expect(tokenizeJson(text).map((token) => token.text).join('')).toBe(text);
  });
});
