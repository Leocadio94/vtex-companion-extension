import { useCallback, useEffect, useState } from 'react';
import {
  collectDetection,
  getActiveTabContext,
  toUrlSignals,
  type TabContext,
} from '@/lib/collect';
import { collectCatalog } from '@/lib/catalog/probe';
import type { CatalogSnapshot } from '@/lib/catalog/signals';
import { resolveCatalogTarget } from '@/lib/catalog/target';
import { sessionRisk } from '@/lib/detect/risk';
import type { DetectionResult } from '@/lib/detect/signals';
import {
  isDevModeOn,
  readDevMode,
  writeDevMode,
  type FrameDevMode,
} from '@/lib/preview/dev-mode';
import { inspectAdminFrames, type FrameInspection } from '@/lib/preview/inspect';
import { rewritePreviewUrl } from '@/lib/preview/rewrite';
import { findPreviewForTab } from '@/lib/preview/store';
import { collectPixelSignals } from '@/lib/pixels/probe';
import type { PixelReport } from '@/lib/pixels/signals';
import { classifyPixels } from '@/lib/pixels/vendors';
import { collectSeoSignals } from '@/lib/seo/probe';
import type { SeoSignals } from '@/lib/seo/signals';
import { activeTab, previewPort, previews, redirectPreview } from '@/lib/settings';
import { ApiIcon, PageIcon, PreviewIcon, StoreIcon } from './components/icons';
import { identityLine, PLATFORM_SHORT } from '@/ui/labels';
import { PageTab } from './tabs/PageTab';
import { PreviewTab } from './tabs/PreviewTab';
import { StoreTab } from './tabs/StoreTab';
import { ApiPanel } from '@/ui/ApiPanel';
import { useRunner } from '@/ui/useRunner';
import '@/ui/styles.css';
import './popup.css';

const TABS = [
  { id: 'store', label: 'Loja', Icon: StoreIcon },
  { id: 'page', label: 'Página', Icon: PageIcon },
  { id: 'preview', label: 'Preview', Icon: PreviewIcon },
  { id: 'api', label: 'API', Icon: ApiIcon },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** `idle` é o que faz a sonda rodar só quando a aba dela é aberta. */
type ProbeState = 'idle' | 'loading' | 'done';

export default function App() {
  const [tab, setTab] = useState<TabId>('store');
  const [context, setContext] = useState<TabContext | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const runner = useRunner(context);
  const [port, setPort] = useState(3000);
  const [redirect, setRedirect] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [frames, setFrames] = useState<FrameDevMode[]>([]);
  const [injection, setInjection] = useState<FrameInspection[]>([]);
  const [seo, setSeo] = useState<SeoSignals | null>(null);
  const [catalog, setCatalog] = useState<CatalogSnapshot | null>(null);
  const [pixels, setPixels] = useState<PixelReport | null>(null);
  const [pageProbe, setPageProbe] = useState<ProbeState>('idle');
  const [previewProbe, setPreviewProbe] = useState<ProbeState>('idle');

  /**
   * Só o que o painel precisa para pintar: contexto, preferências e detecção.
   * Catálogo, SEO, scripts e frames são caros — inclusive uma chamada de rede —
   * e ficam para os efeitos de cada aba.
   */
  const load = useCallback(async () => {
    setLoading(true);
    setPageProbe('idle');
    setPreviewProbe('idle');

    const [tabContext, storedPort, storedRedirect, storedPreviews, storedTab] =
      await Promise.all([
        getActiveTabContext(),
        previewPort.getValue(),
        redirectPreview.getValue(),
        previews.getValue(),
        activeTab.getValue(),
      ]);

    setPort(storedPort);
    setRedirect(storedRedirect);
    setContext(tabContext);
    if (TABS.some((entry) => entry.id === storedTab)) setTab(storedTab as TabId);

    // O preview só vale para a aba do admin que o abriu, ou para a aba do
    // próprio preview.
    setPreviewUrl(
      tabContext
        ? (findPreviewForTab(storedPreviews, tabContext.tabId)?.url ?? null)
        : null,
    );

    setResult(tabContext ? await collectDetection(tabContext) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!context || !result || tab !== 'page' || pageProbe !== 'idle') return;

    setPageProbe('loading');
    void (async () => {
      const [seoSignals, pixelSignals, snapshot] = await Promise.all([
        collectSeoSignals(context.tabId),
        collectPixelSignals(context.tabId),
        collectCatalog(
          context.tabId,
          resolveCatalogTarget(
            toUrlSignals(context.url),
            result.template,
            result.entityId,
          ),
        ),
      ]);

      setSeo(seoSignals);
      setPixels(
        pixelSignals ? classifyPixels(pixelSignals, context.origin) : null,
      );
      setCatalog(snapshot);
      setPageProbe('done');
    })();
  }, [context, result, tab, pageProbe]);

  useEffect(() => {
    if (!context || !result || tab !== 'preview' || previewProbe !== 'idle')
      return;

    setPreviewProbe('loading');
    void (async () => {
      setFrames(await readDevMode(context.tabId));
      setInjection(
        result.environment === 'admin'
          ? await inspectAdminFrames(context.tabId)
          : [],
      );
      setPreviewProbe('done');
    })();
  }, [context, result, tab, previewProbe]);

  const selectTab = (next: TabId) => {
    setTab(next);
    void activeTab.setValue(next);
  };

  const grantPermission = async () => {
    if (!context) return;
    const granted = await browser.permissions.request({
      origins: [`${context.origin}/*`],
    });
    if (granted) await load();
  };

  const savePort = (value: number) => {
    setPort(value);
    void previewPort.setValue(value);
  };

  const toggleRedirect = (value: boolean) => {
    setRedirect(value);
    void redirectPreview.setValue(value);
  };

  const toggleDevMode = async () => {
    if (!context) return;
    setFrames(await writeDevMode(context.tabId, !isDevModeOn(frames)));
    await browser.tabs.reload(context.tabId);
  };

  const localPreviewUrl = previewUrl
    ? rewritePreviewUrl(previewUrl, { port })
    : null;

  // O formulário de produto do admin continua sendo a rota legacy, e é a mesma
  // para loja em IO, FastStore ou portal.
  const adminProductUrl =
    result?.account && catalog?.product
      ? `https://${result.account}.myvtex.com/admin/Site/ProdutoForm.aspx?id=${catalog.product.productId}`
      : null;

  const identity = identityLine(context, result);
  const risk =
    result && context
      ? sessionRisk(result, new URL(context.url).hostname)
      : { level: 'none' as const };

  return (
    <main>
      <header>
        <div className="identity">
          <h1>VTEX Companion</h1>
          {identity && <p className="identity-line">{identity}</p>}
        </div>
        {result && (
          <span className={`badge badge-${result.platform}`}>
            {PLATFORM_SHORT[result.platform]}
          </span>
        )}
      </header>

      {risk.level === 'warn' && (
        <p className="risk">
          <span aria-hidden="true">⚠</span>
          {risk.message}
        </p>
      )}

      <div className="content">
        {loading ? (
          <p className="muted">Lendo a página…</p>
        ) : tab === 'store' ? (
          <StoreTab
            context={context}
            result={result}
            onGrantPermission={grantPermission}
            onSessionChanged={() => {
              if (context) void browser.tabs.reload(context.tabId);
              void load();
            }}
          />
        ) : tab === 'page' ? (
          <PageTab
            context={context}
            result={result}
            seo={seo}
            catalog={catalog}
            adminProductUrl={adminProductUrl}
            pixels={pixels}
            probing={pageProbe !== 'done'}
          />
        ) : tab === 'api' ? (
          <ApiPanel
            context={context}
            input={runner.input}
            response={runner.response}
            history={runner.history}
            running={runner.running}
            onChange={runner.change}
            onSend={() => void runner.send()}
            onReplay={(entry) => runner.change(entry.input)}
          />
        ) : (
          <PreviewTab
            context={context}
            result={result}
            port={port}
            redirect={redirect}
            localPreviewUrl={localPreviewUrl}
            frames={frames}
            injection={injection}
            probing={previewProbe !== 'done'}
            onPortChange={savePort}
            onRedirectChange={toggleRedirect}
            onToggleDevMode={toggleDevMode}
          />
        )}
      </div>

      <nav>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={id === tab ? 'active' : undefined}
            aria-current={id === tab}
            onClick={() => selectTab(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
