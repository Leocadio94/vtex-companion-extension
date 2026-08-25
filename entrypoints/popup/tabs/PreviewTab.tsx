import { useState } from 'react';
import type { TabContext } from '@/lib/collect';
import type { DetectionResult } from '@/lib/detect/signals';
import {
  isDevModeOn,
  type FrameDevMode,
} from '@/lib/preview/dev-mode';
import {
  shortUrl,
  summarizeInjection,
  type FrameInspection,
} from '@/lib/preview/inspect';
import { Empty, Row } from '../components/Row';

export function PreviewTab({
  result,
  port,
  redirect,
  localPreviewUrl,
  frames,
  injection,
  onPortChange,
  onRedirectChange,
  onToggleDevMode,
}: {
  context: TabContext | null;
  result: DetectionResult | null;
  port: number;
  redirect: boolean;
  localPreviewUrl: string | null;
  frames: FrameDevMode[];
  injection: FrameInspection[];
  onPortChange: (value: number) => void;
  onRedirectChange: (value: boolean) => void;
  onToggleDevMode: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isAdmin = result?.environment === 'admin';

  const copy = async () => {
    if (!localPreviewUrl) return;
    await navigator.clipboard.writeText(localPreviewUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <section>
        <h2>Dev server</h2>

        <label className="field">
          <span>Porta</span>
          <input
            type="number"
            min={1}
            max={65535}
            value={port}
            onChange={(event) => onPortChange(Number(event.target.value))}
          />
        </label>

        <label className="toggle">
          <input
            type="checkbox"
            checked={redirect}
            onChange={(event) => onRedirectChange(event.target.checked)}
          />
          <span>Redirecionar a aba de preview para o localhost</span>
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
              <button type="button" onClick={copy}>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        ) : (
          <Empty>
            Nenhum preview desta aba. Clique em{' '}
            <strong>Pré-visualização</strong> no CMS e reabra este painel.
          </Empty>
        )}
      </section>

      {isAdmin ? (
        <section>
          <h2>Development Mode do CMS</h2>
          <Row
            label="Status"
            value={isDevModeOn(frames) ? 'ligado' : 'desligado'}
          />
          <Row label="Botão Localhost" value={summarizeInjection(injection)} />
          {injection.length > 0 && (
            <details className="frames">
              <summary>Frames ({injection.length})</summary>
              <ul>
                {injection.map((frame) => (
                  <li key={frame.frameId}>
                    <code>{shortUrl(frame.url)}</code>
                    <span>
                      {frame.ready ? 'script ativo' : 'script ausente'} ·{' '}
                      {frame.state}
                    </span>
                    {frame.candidates.map((candidate) => (
                      <code key={candidate} className="candidate">
                        {candidate}
                      </code>
                    ))}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <button type="button" onClick={onToggleDevMode}>
            {isDevModeOn(frames)
              ? 'Desligar cmsDevMode e recarregar'
              : 'Ligar cmsDevMode e recarregar'}
          </button>
          <Empty>
            O CMS novo (Storefront &gt; Content) pode não usar essa flag. O
            redirecionamento e o link acima funcionam sem ela.
          </Empty>
        </section>
      ) : (
        <Empty>
          O controle do <code>cmsDevMode</code> aparece quando a aba está no
          admin da VTEX.
        </Empty>
      )}
    </>
  );
}
