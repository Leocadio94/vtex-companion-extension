import { describe, expect, it } from 'vitest';
import { sessionRisk } from './risk';
import type { DetectionResult } from './signals';

function result(overrides: Partial<DetectionResult> = {}): DetectionResult {
  return {
    isVtex: true,
    confidence: 'high',
    platform: 'io',
    reasons: [],
    account: 'storetheme',
    environment: 'storefront',
    isWorkspace: false,
    template: 'home',
    auth: { storefront: false, admin: true },
    ...overrides,
  };
}

describe('sessionRisk', () => {
  it('avisa na loja publicada com cookie de admin', () => {
    const risk = sessionRisk(result(), 'storetheme.vtex.com');

    expect(risk.level).toBe('warn');
    expect(risk.message).toContain('produção');
  });

  it('trata master explícito como produção', () => {
    expect(sessionRisk(result({ workspace: 'master' }), 'loja.com.br').level).toBe(
      'warn',
    );
  });

  it('não avisa sem cookie de admin', () => {
    const quiet = result({ auth: { storefront: false, admin: false } });

    expect(sessionRisk(quiet, 'storetheme.vtex.com')).toEqual({ level: 'none' });
  });

  it('não avisa no admin, que é onde o cookie deve estar', () => {
    expect(
      sessionRisk(result({ environment: 'admin' }), 'storetheme.myvtex.com')
        .level,
    ).toBe('none');
  });

  it('não avisa em workspace de desenvolvimento', () => {
    expect(
      sessionRisk(
        result({ isWorkspace: true, workspace: 'dev' }),
        'dev--storetheme.myvtex.com',
      ).level,
    ).toBe('none');
  });

  it('não avisa quando o runtime reporta workspace sem a URL carregar', () => {
    expect(sessionRisk(result({ workspace: 'dev' }), 'storetheme.vtex.com').level).toBe(
      'none',
    );
  });

  it('não avisa no localhost', () => {
    expect(sessionRisk(result(), 'localhost').level).toBe('none');
  });

  it('não avisa fora da VTEX', () => {
    expect(sessionRisk(result({ isVtex: false }), 'exemplo.com').level).toBe(
      'none',
    );
  });
});
