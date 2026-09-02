import { describe, expect, it } from 'vitest';
import { previewFit } from './scope';
import type { DetectionResult } from '../detect/signals';

function result(overrides: Partial<DetectionResult> = {}): DetectionResult {
  return {
    isVtex: true,
    confidence: 'high',
    platform: 'faststore',
    reasons: [],
    environment: 'storefront',
    isWorkspace: false,
    template: 'home',
    auth: { storefront: false, admin: false, cookies: [] },
    ...overrides,
  };
}

describe('previewFit', () => {
  it('reconhece a loja em FastStore', () => {
    expect(previewFit(result())).toBe('faststore');
  });

  it('o admin vem antes da plataforma', () => {
    expect(
      previewFit(result({ environment: 'admin', platform: 'io' })),
    ).toBe('admin');
  });

  it('aponta as plataformas que previsualizam por workspace', () => {
    expect(previewFit(result({ platform: 'io' }))).toBe('other-platform');
    expect(previewFit(result({ platform: 'cms-legacy' }))).toBe(
      'other-platform',
    );
  });

  it('não chuta em headless nem fora da VTEX', () => {
    expect(previewFit(result({ platform: 'headless' }))).toBe('unknown');
    expect(previewFit(result({ platform: 'not-vtex', isVtex: false }))).toBe(
      'unknown',
    );
    expect(previewFit(result({ platform: 'unknown' }))).toBe('unknown');
  });

  it('sem detecção, não afirma nada', () => {
    expect(previewFit(null)).toBe('unknown');
  });
});
