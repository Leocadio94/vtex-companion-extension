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
import { remember, type HistoryEntry } from '@/lib/runner/history';
import { runRequest, type RunnerResponse } from '@/lib/runner/probe';
import { buildRequest, type RunnerInput } from '@/lib/runner/request';
import { collectSeoSignals } from '@/lib/seo/probe';
import type { SeoSignals } from '@/lib/seo/signals';
import {
  activeTab,
  previewPort,
  previews,
  redirectPreview,
  runnerHistory,
  runnerInput,
} from '@/lib/settings';
import { ApiIcon, PageIcon, PreviewIcon, StoreIcon } from './components/icons';
import { PLATFORM_SHORT } from './labels';
import { ApiTab } from './tabs/ApiTab';
import { PageTab } from './tabs/PageTab';
import { PreviewTab } from './tabs/PreviewTab';
import { StoreTab } from './tabs/StoreTab';
import './App.css';

const TABS = [
  { id: 'store', label: 'Loja', Icon: StoreIcon },
  { id: 'page', label: 'Página', Icon: PageIcon },
  { id: 'preview', label: 'Preview', Icon: PreviewIcon },
  { id: 'api', label: 'API', Icon: ApiIcon },
] as const;

const EMPTY_REQUEST: RunnerInput = {
  method: 'GET',
  url: '/api/sessions?items=*',
  headers: '',
  body: '',
};

type TabId = (typeof TABS)[number]['id'];

export default function App() {
  const [tab, setTab] = useState<TabId>('store');
  const [context, setContext] = useState<TabContext | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [port, setPort] = useState(3000);
  const [redirect, setRedirect] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [frames, setFrames] = useState<FrameDevMode[]>([]);
  const [injection, setInjection] = useState<FrameInspection[]>([]);
  const [seo, setSeo] = useState<SeoSignals | null>(null);
  const [catalog, setCatalog] = useState<CatalogSnapshot | null>(null);
  const [pixels, setPixels] = useState<PixelReport | null>(null);
  const [request, setRequest] = useState<RunnerInput>(EMPTY_REQUEST);
  const [response, setResponse] = useState<RunnerResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    const [
      tabContext,
      storedPort,
      storedRedirect,
      storedPreviews,
      storedTab,
      storedRequest,
      storedHistory,
    ] = await Promise.all([
      getActiveTabContext(),
      previewPort.getValue(),
      redirectPreview.getValue(),
      previews.getValue(),
      activeTab.getValue(),
      runnerInput.getValue(),
      runnerHistory.getValue(),
    ]);

    setPort(storedPort);
    setRedirect(storedRedirect);
    setContext(tabContext);
    if (TABS.some((entry) => entry.id === storedTab)) setTab(storedTab as TabId);
    if (storedRequest) setRequest(storedRequest);
    setHistory(storedHistory);

    // O preview só vale para a aba do admin que o abriu, ou para a aba do
    // próprio preview.
    setPreviewUrl(
      tabContext
        ? (findPreviewForTab(storedPreviews, tabContext.tabId)?.url ?? null)
        : null,
    );

    if (tabContext) {
      const detection = await collectDetection(tabContext);
      setResult(detection);
      setSeo(await collectSeoSignals(tabContext.tabId));

      const pixelSignals = await collectPixelSignals(tabContext.tabId);
      setPixels(
        pixelSignals ? classifyPixels(pixelSignals, tabContext.origin) : null,
      );

      setCatalog(
        await collectCatalog(
          tabContext.tabId,
          resolveCatalogTarget(
            toUrlSignals(tabContext.url),
            detection.template,
            detection.entityId,
          ),
        ),
      );
      setFrames(await readDevMode(tabContext.tabId));
      setInjection(
        detection.environment === 'admin'
          ? await inspectAdminFrames(tabContext.tabId)
          : [],
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changeRequest = (next: RunnerInput) => {
    setRequest(next);
    void runnerInput.setValue(next);
  };

  const sendRequest = async () => {
    if (!context) return;

    const built = buildRequest(request, context.origin);
    if (!built.ok) return;

    setRunning(true);
    const result = await runRequest(context.tabId, built.request);
    setResponse(result);
    setRunning(false);

    const next = remember(history, {
      at: Date.now(),
      status: result.status,
      durationMs: result.durationMs,
      input: request,
    });
    setHistory(next);
    void runnerHistory.setValue(next);
  };

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

  return (
    <main>
      <header>
        <h1>VTEX Companion</h1>
        {result && (
          <span className={`badge badge-${result.platform}`}>
            {PLATFORM_SHORT[result.platform]}
          </span>
        )}
      </header>

      <div className="content">
        {loading ? (
          <p className="muted">Lendo a página…</p>
        ) : tab === 'store' ? (
          <StoreTab
            context={context}
            result={result}
            onGrantPermission={grantPermission}
          />
        ) : tab === 'page' ? (
          <PageTab
            context={context}
            result={result}
            seo={seo}
            catalog={catalog}
            adminProductUrl={adminProductUrl}
            pixels={pixels}
          />
        ) : tab === 'api' ? (
          <ApiTab
            context={context}
            input={request}
            response={response}
            history={history}
            running={running}
            onChange={changeRequest}
            onSend={() => void sendRequest()}
            onReplay={(entry) => changeRequest(entry.input)}
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
