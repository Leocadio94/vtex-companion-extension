import { describe, expect, it } from 'vitest';
import { MAX_HISTORY, remember, type HistoryEntry } from './history';

const entry = (url: string, method = 'GET', at = 1): HistoryEntry => ({
  at,
  status: 200,
  durationMs: 10,
  input: { method, url, headers: '', body: '' },
});

describe('remember', () => {
  it('põe a mais recente no topo', () => {
    const history = remember([entry('/a')], entry('/b', 'GET', 2));
    expect(history.map((item) => item.input.url)).toEqual(['/b', '/a']);
  });

  it('promove a repetição em vez de duplicar a linha', () => {
    const history = remember(
      [entry('/a'), entry('/b')],
      entry('/b', 'GET', 2),
    );

    expect(history.map((item) => item.input.url)).toEqual(['/b', '/a']);
    expect(history[0]?.at).toBe(2);
  });

  it('trata mesma URL com método diferente como outra entrada', () => {
    const history = remember([entry('/a', 'GET')], entry('/a', 'POST', 2));
    expect(history).toHaveLength(2);
  });

  it('corta no limite', () => {
    let history: HistoryEntry[] = [];
    for (let i = 0; i < MAX_HISTORY + 5; i += 1) {
      history = remember(history, entry(`/${i}`, 'GET', i));
    }

    expect(history).toHaveLength(MAX_HISTORY);
    expect(history[0]?.input.url).toBe(`/${MAX_HISTORY + 4}`);
  });
});
