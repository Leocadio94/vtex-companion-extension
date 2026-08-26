import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('converte lista de objetos usando a união das chaves', () => {
    expect(toCsv([{ id: 1, nome: 'a' }, { id: 2, ean: '789' }])).toBe(
      ['id,nome,ean', '1,a,', '2,,789'].join('\n'),
    );
  });

  it('achata objeto aninhado em coluna pontuada', () => {
    expect(toCsv([{ id: 1, oferta: { preco: 1990, disponivel: true } }])).toBe(
      ['id,oferta.preco,oferta.disponivel', '1,1990,true'].join('\n'),
    );
  });

  it('serializa lista dentro da célula', () => {
    expect(toCsv([{ id: 1, skus: [1, 2] }])).toBe(
      ['id,skus', '1,"[1,2]"'].join('\n'),
    );
  });

  it('escapa vírgula, aspas e quebra de linha', () => {
    expect(toCsv([{ nome: 'Camiseta, preta' }])).toBe(
      ['nome', '"Camiseta, preta"'].join('\n'),
    );
    expect(toCsv([{ nome: 'aspas "aqui"' }])).toBe(
      ['nome', '"aspas ""aqui"""'].join('\n'),
    );
  });

  it('trata objeto solto como uma linha', () => {
    expect(toCsv({ id: 1 })).toBe(['id', '1'].join('\n'));
  });

  it('devolve vazio para lista vazia', () => {
    expect(toCsv([])).toBe('');
  });

  it('representa null e undefined como célula vazia', () => {
    expect(toCsv([{ a: null, b: undefined, c: 0 }])).toBe(
      ['a,b,c', ',,0'].join('\n'),
    );
  });
});
