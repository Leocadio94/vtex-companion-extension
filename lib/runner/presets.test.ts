import { describe, expect, it } from 'vitest';
import { groupPresets, PRESETS, type Preset } from './presets';

const preset = (id: string, group: string): Preset => ({
  id,
  group,
  label: id,
  method: 'GET',
  url: `/${id}`,
  headers: '',
  body: '',
});

describe('groupPresets', () => {
  it('junta os presets do mesmo grupo', () => {
    const groups = groupPresets([
      preset('a', 'Sessão'),
      preset('b', 'Checkout'),
      preset('c', 'Sessão'),
    ]);

    expect(groups).toEqual([
      { group: 'Sessão', presets: [preset('a', 'Sessão'), preset('c', 'Sessão')] },
      { group: 'Checkout', presets: [preset('b', 'Checkout')] },
    ]);
  });

  it('preserva a ordem de primeira aparição do grupo', () => {
    expect(
      groupPresets([
        preset('a', 'Catálogo'),
        preset('b', 'OMS'),
        preset('c', 'Catálogo'),
      ]).map((entry) => entry.group),
    ).toEqual(['Catálogo', 'OMS']);
  });

  it('não perde nenhum preset do catálogo real', () => {
    const total = groupPresets(PRESETS).reduce(
      (count, entry) => count + entry.presets.length,
      0,
    );

    expect(total).toBe(PRESETS.length);
  });

  it('devolve lista vazia sem presets', () => {
    expect(groupPresets([])).toEqual([]);
  });
});
