import { useEffect, useState } from 'react';
import type { TabContext } from '@/lib/collect';
import type { DetectionResult } from '@/lib/detect/signals';
import { recentWorkspaces } from '@/lib/settings';
import { URL_FLAGS, clearFlags, readFlags, setFlag } from '@/lib/url/flags';
import {
  MASTER,
  currentWorkspace,
  rememberWorkspace,
  switchWorkspace,
} from '@/lib/url/workspace';
import { Empty, Row } from './Row';

// O workspace tem controle próprio logo acima, com recentes e volta ao master.
// Ele continua na lista do módulo porque `clearFlags` precisa removê-lo.
const FLAGS = URL_FLAGS.filter((flag) => flag.key !== 'workspace');

/** Tooltip: o parâmetro que a flag escreve, e o que ele faz. */
function flagTitle(flag: (typeof FLAGS)[number]): string {
  const param = flag.kind === 'toggle' ? `${flag.key}=${flag.on}` : `${flag.key}=`;
  return `${param} — ${flag.hint}`;
}

export function UrlSection({
  context,
  result,
  onNavigate,
}: {
  context: TabContext;
  result: DetectionResult;
  onNavigate: (url: string) => void;
}) {
  const [recent, setRecent] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void recentWorkspaces.getValue().then(setRecent);
  }, []);

  if (!result.isVtex) return null;

  const flags = readFlags(context.url);
  const workspace = currentWorkspace(context.url);

  // Fora do IO, as flags do render-runtime não fazem nada: um botão que não
  // muda a página é pior do que botão nenhum.
  const isIo = result.platform === 'io';
  const visible = FLAGS.filter((flag) => !flag.io || isIo);

  const goWorkspace = (name: string) => {
    const url = switchWorkspace(context.url, name);
    if (!url) {
      setError(`"${name}" não serve como nome de workspace.`);
      return;
    }

    const next = rememberWorkspace(recent, name);
    setRecent(next);
    void recentWorkspaces.setValue(next);
    setDraft('');
    setError(null);
    onNavigate(url);
  };

  const toggleFlag = (key: string, on: string, isOn: boolean) => {
    const url = setFlag(context.url, key, isOn ? null : on);
    if (url) onNavigate(url);
  };

  const applyValues = () => {
    let url: string | null = context.url;
    for (const [key, value] of Object.entries(values)) {
      url = url === null ? null : setFlag(url, key, value);
    }
    if (url) onNavigate(url);
  };

  const dirty = Object.keys(values).length > 0;
  const hasFlags = Object.keys(flags).length > 0;

  return (
    <section>
      <h2>URL</h2>

      <Row
        label="Workspace"
        value={workspace === MASTER ? 'master' : workspace}
        copy={workspace}
      />

      <div className="actions">
        <input
          type="text"
          spellCheck={false}
          placeholder="dev"
          aria-label="Abrir noutro workspace"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && draft.trim()) goWorkspace(draft);
          }}
        />
        <button
          type="button"
          disabled={!draft.trim()}
          onClick={() => goWorkspace(draft)}
        >
          Abrir
        </button>
      </div>

      {(recent.length > 0 || workspace !== MASTER) && (
        <div className="actions chips">
          <span className="row-label">Recentes</span>
          {workspace !== MASTER && (
            <button
              type="button"
              className="btn-secondary chip"
              onClick={() => goWorkspace(MASTER)}
            >
              master
            </button>
          )}
          {recent
            .filter((name) => name !== workspace)
            .map((name) => (
              <button
                key={name}
                type="button"
                className="btn-secondary chip"
                onClick={() => goWorkspace(name)}
              >
                {name}
              </button>
            ))}
        </div>
      )}

      {error && <Empty tone="error">{error}</Empty>}

      {visible.filter((flag) => flag.kind === 'toggle').map((flag) => {
        const isOn = flags[flag.key] !== undefined;
        return (
          <label className="toggle" key={flag.key} title={flagTitle(flag)}>
            <input
              type="checkbox"
              checked={isOn}
              onChange={() => toggleFlag(flag.key, flag.on!, isOn)}
            />
            <span>{flag.label}</span>
          </label>
        );
      })}

      {visible.filter((flag) => flag.kind === 'value').map((flag) => (
        <label className="field" key={flag.key} title={flagTitle(flag)}>
          <span>{flag.label}</span>
          <input
            type="text"
            spellCheck={false}
            placeholder={flag.placeholder}
            value={values[flag.key] ?? flags[flag.key] ?? ''}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                [flag.key]: event.target.value,
              }))
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') applyValues();
            }}
          />
        </label>
      ))}

      <div className="actions">
        <button type="button" disabled={!dirty} onClick={applyValues}>
          Aplicar
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={!hasFlags}
          onClick={() => {
            const url = clearFlags(context.url);
            if (url) onNavigate(url);
          }}
        >
          Limpar flags
        </button>
      </div>

      <Empty>
        Ligar uma flag navega na hora e preserva o resto da query. Campo vazio
        remove a flag.
        {!isIo && ' As flags do render-runtime só aparecem em loja VTEX IO.'}
      </Empty>

      <details className="advanced">
        <summary>O que cada flag faz</summary>
        {visible.map((flag) => (
          <Row
            key={flag.key}
            label={flag.label}
            value={
              <>
                <code>{flag.key}</code> — {flag.hint}
              </>
            }
          />
        ))}
      </details>
    </section>
  );
}
