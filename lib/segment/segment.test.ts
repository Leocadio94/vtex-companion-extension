import { describe, expect, it } from 'vitest';
import {
  SEGMENT_FIELDS,
  applyEdits,
  decodeSegment,
  encodeSegment,
  parseSegmentJson,
} from './segment';

/** Cookie de uma loja BR: base64 sem padding, com `R$` em UTF-8. */
const REAL =
  'eyJjYW1wYWlnbnMiOm51bGwsImNoYW5uZWwiOiIxIiwicHJpY2VUYWJsZXMiOm51bGwsInJlZ2lvbklkIjpudWxsLCJ1dG1fY2FtcGFpZ24iOm51bGwsInV0bV9zb3VyY2UiOm51bGwsInV0bWlfY2FtcGFpZ24iOm51bGwsImN1cnJlbmN5Q29kZSI6IkJSTCIsImN1cnJlbmN5U3ltYm9sIjoiUiQiLCJjb3VudHJ5Q29kZSI6IkJSQSIsImN1bHR1cmVJbmZvIjoicHQtQlIiLCJjaGFubmVsUHJpdmFjeSI6InB1YmxpYyJ9';

/** `{"channel":"1","currencySymbol":"R$"}`, nas três formas que aparecem. */
const SMALL = 'eyJjaGFubmVsIjoiMSIsImN1cnJlbmN5U3ltYm9sIjoiUiQifQ==';
const SMALL_PCT = 'eyJjaGFubmVsIjoiMSIsImN1cnJlbmN5U3ltYm9sIjoiUiQifQ%3D%3D';
const SMALL_URLSAFE = 'eyJjaGFubmVsIjoiMSIsImN1cnJlbmN5U3ltYm9sIjoiUiQifQ';

describe('decodeSegment', () => {
  it('lê o segmento de uma loja BR', () => {
    const payload = decodeSegment(REAL);

    expect(payload?.channel).toBe('1');
    expect(payload?.cultureInfo).toBe('pt-BR');
    expect(payload?.currencyCode).toBe('BRL');
    expect(payload?.regionId).toBeNull();
  });

  it('preserva UTF-8 no símbolo da moeda', () => {
    expect(decodeSegment(REAL)?.currencySymbol).toBe('R$');
  });

  it('aceita o valor percent-encoded, que é como o cookie costuma vir', () => {
    expect(decodeSegment(SMALL_PCT)).toEqual(decodeSegment(SMALL));
  });

  it('aceita base64url sem padding', () => {
    expect(decodeSegment(SMALL_URLSAFE)).toEqual(decodeSegment(SMALL));
  });

  it('devolve null em vez de estourar quando o valor não presta', () => {
    expect(decodeSegment('')).toBeNull();
    expect(decodeSegment('não é base64 %%%')).toBeNull();
    expect(decodeSegment(btoa('isto não é json'))).toBeNull();
  });

  it('exige um objeto: array e escalar não são segmento', () => {
    expect(decodeSegment(btoa('[1,2]'))).toBeNull();
    expect(decodeSegment(btoa('"texto"'))).toBeNull();
    expect(decodeSegment(btoa('null'))).toBeNull();
  });
});

describe('encodeSegment', () => {
  it('fecha o ciclo com decodeSegment', () => {
    const payload = decodeSegment(REAL)!;
    expect(decodeSegment(encodeSegment(payload))).toEqual(payload);
  });

  it('não quebra o UTF-8 na volta', () => {
    const encoded = encodeSegment({ channel: '1', currencySymbol: 'R$' });
    expect(decodeSegment(encoded)?.currencySymbol).toBe('R$');
  });
});

describe('applyEdits', () => {
  const payload = decodeSegment(REAL)!;

  it('troca o campo pedido e preserva o resto', () => {
    const next = applyEdits(payload, { channel: '2' });

    expect(next.channel).toBe('2');
    expect(next.cultureInfo).toBe('pt-BR');
    expect(next.channelPrivacy).toBe('public');
  });

  it('não mexe em campo que não foi informado', () => {
    expect(applyEdits(payload, {})).toEqual(payload);
  });

  it('grava null no campo esvaziado, que é o que a VTEX guarda', () => {
    const next = applyEdits({ ...payload, regionId: 'v2.7B1A0' }, {
      regionId: '',
    });

    expect(next.regionId).toBeNull();
  });

  it('apara o que o usuário colou com espaço em volta', () => {
    expect(applyEdits(payload, { channel: ' 3 ' }).channel).toBe('3');
  });

  it('preserva chave que a VTEX inventou depois', () => {
    const next = applyEdits({ ...payload, novoCampo: 'x' }, { channel: '2' });
    expect(next.novoCampo).toBe('x');
  });
});

describe('parseSegmentJson', () => {
  it('aceita um objeto', () => {
    const parsed = parseSegmentJson('{"channel":"2"}');
    expect(parsed.ok && parsed.payload.channel).toBe('2');
  });

  it('recusa JSON inválido dizendo o motivo', () => {
    const parsed = parseSegmentJson('{channel:2}');
    expect(parsed.ok).toBe(false);
    expect(parsed.ok === false && parsed.error).toBeTruthy();
  });

  it('recusa o que não é objeto', () => {
    expect(parseSegmentJson('[1,2]').ok).toBe(false);
    expect(parseSegmentJson('"texto"').ok).toBe(false);
    expect(parseSegmentJson('null').ok).toBe(false);
  });
});

describe('SEGMENT_FIELDS', () => {
  it('lista os campos guiados da interface', () => {
    expect(SEGMENT_FIELDS.map((field) => field.key)).toEqual([
      'channel',
      'cultureInfo',
      'currencyCode',
      'regionId',
    ]);
  });
});
