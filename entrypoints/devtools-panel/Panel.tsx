import { useCallback, useEffect, useState } from 'react';
import { collectDetection, getTabContext, type TabContext } from '@/lib/collect';
import type { DetectionResult } from '@/lib/detect/signals';
import { ApiPanel } from '@/ui/ApiPanel';
import { Empty } from '@/ui/components/Row';
import { useRunner } from '@/ui/useRunner';
import { PLATFORM_SHORT } from '@/ui/labels';
import '@/ui/styles.css';
import './panel.css';

export default function Panel() {
  const [context, setContext] = useState<TabContext | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const runner = useRunner(context);

  const load = useCallback(async () => {
    setLoading(true);

    const tabContext = await getTabContext(browser.devtools.inspectedWindow.tabId);
    setContext(tabContext);
    setResult(tabContext?.hasHostPermission ? await collectDetection(tabContext) : null);

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    // O painel sobrevive à navegação da aba; o contexto precisa acompanhar.
    browser.devtools.network.onNavigated.addListener(load);
    return () => browser.devtools.network.onNavigated.removeListener(load);
  }, [load]);

  const grantPermission = async () => {
    if (!context) return;
    try {
      const granted = await browser.permissions.request({
        origins: [`${context.origin}/*`],
      });
      if (granted) await load();
    } catch {
      // Alguns navegadores recusam `permissions.request` fora de uma janela
      // normal. O popup continua sendo um caminho que sempre funciona.
      await load();
    }
  };

  return (
    <main className="devtools-shell">
      <header>
        <h1>VTEX Companion</h1>
        <span className="header-context">
          {loading
            ? 'lendo…'
            : result
              ? `${PLATFORM_SHORT[result.platform]}${result.account ? ` · ${result.account}` : ''}`
              : (context?.origin ?? 'sem aba')}
        </span>
      </header>

      {/* Fora do `.content` porque lá as colunas do grid são posições
          nomeadas: um aviso solto cairia numa linha implícita e sumiria
          debaixo do `overflow: hidden`. */}
      {!loading && context && !context.hasHostPermission && (
        <section className="notice banner">
          <p>
            O painel de DevTools não tem o acesso temporário que o popup recebe
            ao ser aberto, então precisa de permissão para{' '}
            <strong>{context.origin}</strong>.
          </p>
          <button type="button" onClick={grantPermission}>
            Conceder acesso a este site
          </button>
          <p className="muted">
            Se o navegador recusar o pedido aqui, abra o popup da extensão nesta
            aba e conceda por lá — depois recarregue o DevTools.
          </p>
        </section>
      )}

      <div className="content">
        {!loading && !context && (
          <Empty tone="empty">
            Esta aba não é uma página web comum. Inspecione uma loja ou o admin
            da VTEX.
          </Empty>
        )}

        {!loading && context && (
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
        )}
      </div>
    </main>
  );
}
