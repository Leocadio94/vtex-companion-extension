import { describe, expect, it } from 'vitest';
import {
  findPreviewForTab,
  forgetTab,
  MAX_REMEMBERED,
  rememberPreview,
  type CapturedPreview,
  type PreviewsByTab,
} from './store';

function preview(overrides: Partial<CapturedPreview> = {}): CapturedPreview {
  return {
    url: 'https://acme.vtex.app/api/preview?entryId=x',
    capturedAt: 1,
    redirected: false,
    tabId: 2,
    openerTabId: 1,
    ...overrides,
  };
}

describe('rememberPreview', () => {
  it('indexa pela aba do admin que abriu o preview', () => {
    const previews = rememberPreview({}, preview());
    expect(Object.keys(previews)).toEqual(['1']);
  });

  it('cai para a aba do preview quando não há opener', () => {
    const previews = rememberPreview(
      {},
      preview({ openerTabId: undefined, tabId: 7 }),
    );
    expect(Object.keys(previews)).toEqual(['7']);
  });

  it('substitui o preview anterior da mesma aba de admin', () => {
    const first = rememberPreview({}, preview({ url: 'https://a.vtex.app/api/preview' }));
    const second = rememberPreview(
      first,
      preview({ url: 'https://b.vtex.app/api/preview', capturedAt: 2 }),
    );

    expect(Object.keys(second)).toEqual(['1']);
    expect(second['1']?.url).toBe('https://b.vtex.app/api/preview');
  });

  it('descarta os mais antigos ao passar do limite', () => {
    let previews: PreviewsByTab = {};
    for (let i = 0; i < MAX_REMEMBERED + 5; i += 1) {
      previews = rememberPreview(
        previews,
        preview({ openerTabId: i, tabId: 100 + i, capturedAt: i }),
      );
    }

    expect(Object.keys(previews)).toHaveLength(MAX_REMEMBERED);
    expect(previews['0']).toBeUndefined();
    expect(previews[String(MAX_REMEMBERED + 4)]).toBeDefined();
  });
});

describe('findPreviewForTab', () => {
  const previews = rememberPreview({}, preview({ openerTabId: 1, tabId: 2 }));

  it('encontra a partir da aba do admin', () => {
    expect(findPreviewForTab(previews, 1)?.tabId).toBe(2);
  });

  it('encontra a partir da própria aba de preview', () => {
    expect(findPreviewForTab(previews, 2)?.tabId).toBe(2);
  });

  it('não oferece nada para uma aba sem relação', () => {
    expect(findPreviewForTab(previews, 99)).toBeNull();
  });
});

describe('forgetTab', () => {
  it('remove tanto pela aba do admin quanto pela do preview', () => {
    const previews = rememberPreview({}, preview({ openerTabId: 1, tabId: 2 }));
    expect(forgetTab(previews, 1)).toEqual({});
    expect(forgetTab(previews, 2)).toEqual({});
    expect(forgetTab(previews, 3)).toEqual(previews);
  });
});
