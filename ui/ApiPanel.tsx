import { useState } from 'react';
import type { TabContext } from '@/lib/collect';
import { toCsv } from '@/lib/runner/csv';
import { prettyJson } from '@/lib/runner/format';
import type { HistoryEntry } from '@/lib/runner/history';
import { groupPresets, PRESETS } from '@/lib/runner/presets';
import type { RunnerResponse } from '@/lib/runner/probe';
import {
  acceptsBody,
  buildRequest,
  isUnsafeMethod,
  METHODS,
  type RunnerInput,
} from '@/lib/runner/request';
import { JsonView } from './components/JsonView';
import { Empty } from './components/Row';
import { useCopy } from './useCopy';

const GROUPS = groupPresets(PRESETS);

function statusTone(response: RunnerResponse): string {
  if (response.error || response.status === 0) return 'error';
  if (response.status >= 500) return 'error';
  if (response.status >= 400) return 'warn';
  return 'ok';
}

export function ApiPanel({
  context,
  isVtex,
  input,
  response,
  history,
  running,
  onChange,
  onSend,
  onReplay,
}: {
  context: TabContext | null;
  /** Fora de um domínio VTEX os presets não têm onde bater. */
  isVtex: boolean;
  input: RunnerInput;
  response: RunnerResponse | null;
  history: HistoryEntry[];
  running: boolean;
  onChange: (next: RunnerInput) => void;
  onSend: () => void;
  onReplay: (entry: HistoryEntry) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [raw, setRaw] = useState(false);
  const clipboard = useCopy();

  if (!context) {
    return (
      <Empty tone="empty">
        Abra uma aba de loja ou do admin para usar o runner.
      </Empty>
    );
  }

  const built = buildRequest(input, context.origin);
  const unsafe = isUnsafeMethod(input.method);
  // `null` quando a resposta não é JSON: aí só existe o cru, e o alternador
  // some em vez de oferecer uma leitura que não pode entregar.
  const pretty = response?.body ? prettyJson(response.body) : null;

  const patch = (part: Partial<RunnerInput>) => {
    onChange({ ...input, ...part });
    setConfirming(false);
  };

  const applyPreset = (id: string) => {
    const preset = PRESETS.find((entry) => entry.id === id);
    if (!preset) return;
    onChange({
      method: preset.method,
      url: preset.url,
      headers: preset.headers,
      body: preset.body,
    });
    setConfirming(false);
  };

  const send = () => {
    if (unsafe && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    onSend();
  };

  const copyCsv = async () => {
    try {
      await clipboard.copy(toCsv(JSON.parse(response?.body ?? '')), 'csv');
    } catch {
      await clipboard.copy('resposta não é JSON', 'csv');
    }
  };

  return (
    <>
      <section className="panel-request">
        <h2>Requisição</h2>

        {isVtex ? (
          <label className="field">
            <span>Preset</span>
            <select
              value=""
              onChange={(event) => applyPreset(event.target.value)}
            >
              <option value="">escolher…</option>
              {GROUPS.map(({ group, presets }) => (
                <optgroup key={group} label={group}>
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        ) : (
          <Empty tone="empty">
            Os presets são caminhos da VTEX e esta página não foi reconhecida
            como uma. O runner continua valendo para qualquer URL da origem.
          </Empty>
        )}

        <div className="request-line">
          <select
            value={input.method}
            onChange={(event) => patch({ method: event.target.value })}
          >
            {METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={input.url}
            spellCheck={false}
            placeholder="/api/sessions?items=*"
            onChange={(event) => patch({ url: event.target.value })}
          />
        </div>

        <details className="frames">
          <summary>Cabeçalhos</summary>
          <textarea
            rows={3}
            spellCheck={false}
            placeholder="REST-Range: resources=0-9"
            value={input.headers}
            onChange={(event) => patch({ headers: event.target.value })}
          />
        </details>

        {acceptsBody(input.method) && (
          <textarea
            rows={4}
            spellCheck={false}
            placeholder="corpo da requisição"
            value={input.body}
            onChange={(event) => patch({ body: event.target.value })}
          />
        )}

        {/* Campo vazio é o estado inicial, não um erro do usuário. */}
        {!built.ok && input.url.trim() !== '' && (
          <Empty tone="error">{built.error}</Empty>
        )}

        {built.ok && !built.request.sameOrigin && (
          <p className="muted">
            A requisição sai da aba atual (<code>{context.origin}</code>), então
            essa URL vai bater em CORS. Abra uma aba nesse domínio.
          </p>
        )}

        <div className="actions">
          <button
            type="button"
            className={confirming ? 'btn-danger' : undefined}
            disabled={!built.ok || running}
            onClick={send}
          >
            {running
              ? 'Enviando…'
              : confirming
                ? `Confirmar ${input.method}`
                : 'Enviar'}
          </button>
          {confirming && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </button>
          )}
        </div>

        {confirming && (
          <p className="muted">
            <strong>{input.method}</strong> altera dados da loja. Confirme para
            enviar.
          </p>
        )}
      </section>

      {response && (
        <section className="panel-response">
          <h2>
            Resposta{' '}
            <span className={`pill pill-${statusTone(response)}`}>
              {response.error ? 'falhou' : `${response.status}`}
            </span>
          </h2>

          {response.error ? (
            <Empty tone="error">{response.error}</Empty>
          ) : (
            <>
              <p className="muted">
                {response.durationMs} ms · {response.body.length} bytes
                {response.truncated ? ' (truncado)' : ''}
                {response.contentType ? ` · ${response.contentType.split(';')[0]}` : ''}
              </p>
              {pretty && (
                <div className="segmented">
                  <button
                    type="button"
                    className={raw ? undefined : 'active'}
                    onClick={() => setRaw(false)}
                  >
                    Formatado
                  </button>
                  <button
                    type="button"
                    className={raw ? 'active' : undefined}
                    onClick={() => setRaw(true)}
                  >
                    Raw
                  </button>
                </div>
              )}

              {pretty && !raw ? (
                <JsonView text={pretty} />
              ) : (
                <pre className="response">{response.body || '(vazio)'}</pre>
              )}

              <div className="actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    void clipboard.copy(pretty ?? response.body, 'json')
                  }
                >
                  {clipboard.isCopied('json') ? 'Copiado' : 'Copiar JSON'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={copyCsv}
                >
                  {clipboard.isCopied('csv') ? 'Copiado' : 'Copiar CSV'}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {history.length > 0 && (
        <section className="panel-history">
          <h2>Histórico</h2>
          <ul className="history">
            {history.map((entry) => (
              <li key={`${entry.at}-${entry.input.url}`}>
                <button type="button" onClick={() => onReplay(entry)}>
                  {entry.input.method}
                </button>
                <code>{entry.input.url}</code>
                <span>
                  {entry.status || '—'} · {entry.durationMs} ms
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
