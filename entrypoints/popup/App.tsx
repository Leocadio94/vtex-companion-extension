import { useCallback, useEffect, useState } from 'react';
import type { DetectionResult } from '@/lib/detect/signals';
import {
  collectDetection,
  getActiveTabContext,
  type TabContext,
} from '@/lib/collect';
import {
  isDevModeOn,
  readDevMode,
  writeDevMode,
  type FrameDevMode,
} from '@/lib/preview/dev-mode';
import { rewritePreviewUrl } from '@/lib/preview/rewrite';
import {
  lastPreview,
  previewPort,
  redirectPreview,
  type CapturedPreview,
} from '@/lib/settings';
import './App.css';

const PLATFORM_LABELS: Record<DetectionResult['platform'], string> = {
  io: 'VTEX IO — Store Framework',
  faststore: 'FastStore',
  'cms-legacy': 'CMS Legacy Portal',
  headless: 'Headless (VTEX sem storefront conhecido)',
  'not-vtex': 'Não é VTEX',
  unknown: 'Indeterminado',
};

const TEMPLATE_LABELS: Record<DetectionResult['template'], string> = {
  home: 'Home',
  pdp: 'PDP — página de produto',
  plp: 'PLP — listagem',
  search: 'Busca',
  checkout: 'Checkout',
  'order-placed': 'Order placed',
  login: 'Login',
  account: 'Minha conta',
  custom: 'Página custom',
  admin: 'Admin VTEX',
  unknown: 'Indeterminado',
};

const CONFIDENCE_LABELS: Record<DetectionResult['confidence'], string> = {
  high: 'confiança alta',
  medium: 'confiança média',
  low: 'confiança baixa',
  none: 'sem sinais',
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="row">
      <span className="row-label">{label}</span>
      <span className="row-value">{value}</span>
    </div>
  );
}

function authLabel(auth: DetectionResult['auth']): string {
  if (auth.storefront === 'unknown') return 'desconhecido';
  if (!auth.storefront) return 'anônimo';
  return auth.storefrontEmail ?? 'autenticado';
}

export default function App() {
  const [context, setContext] = useState<TabContext | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [port, setPort] = useState(3000);
  const [redirect, setRedirect] = useState(false);
  const [preview, setPreview] = useState<CapturedPreview | null>(null);
  const [frames, setFrames] = useState<FrameDevMode[]>([]);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    const [tabContext, storedPort, storedRedirect, storedPreview] =
      await Promise.all([
        getActiveTabContext(),
        previewPort.getValue(),
        redirectPreview.getValue(),
        lastPreview.getValue(),
      ]);

    setPort(storedPort);
    setRedirect(storedRedirect);
    setPreview(storedPreview);
    setContext(tabContext);

    if (tabContext) {
      setResult(await collectDetection(tabContext));
      setFrames(await readDevMode(tabContext.tabId));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grantPermission = async () => {
    if (!context) return;
    const granted = await browser.permissions.request({
      origins: [`${context.origin}/*`],
    });
    if (granted) await load();
  };

  const savePort = async (value: number) => {
    setPort(value);
    await previewPort.setValue(value);
  };

  const toggleRedirect = async (value: boolean) => {
    setRedirect(value);
    await redirectPreview.setValue(value);
  };

  const toggleDevMode = async () => {
    if (!context) return;
    const next = !isDevModeOn(frames);
    setFrames(await writeDevMode(context.tabId, next));
    await browser.tabs.reload(context.tabId);
  };

  const localPreviewUrl = preview
    ? rewritePreviewUrl(preview.url, { port })
    : null;

  const copyPreview = async () => {
    if (!localPreviewUrl) return;
    await navigator.clipboard.writeText(localPreviewUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const isAdmin = result?.environment === 'admin';

  return (
    <main>
      <header>
        <h1>VTEX Companion</h1>
        {result && (
          <span className={`badge badge-${result.platform}`}>
            {PLATFORM_LABELS[result.platform]}
          </span>
        )}
      </header>

      {loading && <p className="muted">Lendo a página…</p>}

      {!loading && !context && (
        <p className="muted">
          Esta aba não é uma página web comum. Abra uma loja ou o admin da VTEX.
        </p>
      )}

      {!loading && context && !context.hasHostPermission && (
        <section className="notice">
          <p>
            Sem permissão para ler <strong>{context.origin}</strong>. A detecção
            fica incompleta: cookies e estado de login não são lidos.
          </p>
          <button type="button" onClick={grantPermission}>
            Conceder acesso a este site
          </button>
        </section>
      )}

      {!loading && result && (
        <section>
          <Row
            label="Detecção"
            value={`${result.isVtex ? 'VTEX' : 'não é VTEX'} — ${CONFIDENCE_LABELS[result.confidence]}`}
          />
          {result.account && <Row label="Account" value={result.account} />}
          {result.workspace && (
            <Row
              label="Workspace"
              value={`${result.workspace}${result.isWorkspace ? ' (na URL)' : ''}`}
            />
          )}
          {result.binding && <Row label="Binding" value={result.binding} />}
          <Row
            label="Ambiente"
            value={isAdmin ? 'Admin VTEX' : 'Loja final'}
          />
          <Row label="Template" value={TEMPLATE_LABELS[result.template]} />
          {result.templateReason && (
            <Row label="Por quê" value={<code>{result.templateReason}</code>} />
          )}
          <Row label="Login na loja" value={authLabel(result.auth)} />
          <Row
            label="Sessão de admin"
            value={result.auth.admin ? 'cookie presente' : 'ausente'}
          />
          {result.reasons.length > 0 && (
            <Row label="Sinais" value={result.reasons.join(' · ')} />
          )}
        </section>
      )}

      <section>
        <h2>Preview no localhost</h2>

        <label className="field">
          <span>Porta do dev server</span>
          <input
            type="number"
            min={1}
            max={65535}
            value={port}
            onChange={(event) => void savePort(Number(event.target.value))}
          />
        </label>

        <label className="toggle">
          <input
            type="checkbox"
            checked={redirect}
            onChange={(event) => void toggleRedirect(event.target.checked)}
          />
          <span>
            Redirecionar automaticamente a aba de preview para o localhost
          </span>
        </label>

        {localPreviewUrl ? (
          <div className="preview">
            <code>{localPreviewUrl}</code>
            <div className="actions">
              <button
                type="button"
                onClick={() => void browser.tabs.create({ url: localPreviewUrl })}
              >
                Abrir
              </button>
              <button type="button" onClick={copyPreview}>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        ) : (
          <p className="muted">
            Nenhum preview capturado ainda. Clique em{' '}
            <strong>Pré-visualização</strong> no CMS e reabra este painel.
          </p>
        )}
      </section>

      {isAdmin && (
        <section>
          <h2>Development Mode do CMS</h2>
          <Row
            label="Status"
            value={isDevModeOn(frames) ? 'ligado' : 'desligado'}
          />
          <Row
            label="Frames lidos"
            value={
              frames.length === 0
                ? 'nenhum (permissão ou página sem iframe)'
                : `${frames.length} — ${frames.filter((f) => f.enabled === null).length} sem acesso a localStorage`
            }
          />
          <button type="button" onClick={toggleDevMode}>
            {isDevModeOn(frames)
              ? 'Desligar cmsDevMode e recarregar'
              : 'Ligar cmsDevMode e recarregar'}
          </button>
          <p className="muted">
            O CMS novo (Storefront &gt; Content) pode não usar essa flag. O
            redirecionamento e o link acima funcionam sem ela.
          </p>
        </section>
      )}
    </main>
  );
}
