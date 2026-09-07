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
        <div className="actions">
          {workspace !== MASTER && (
            <button type="button" onClick={() => goWorkspace(MASTER)}>
              master
            </button>
          )}
          {recent
            .filter((name) => name !== workspace)
            .map((name) => (
              <button key={name} type="button" onClick={() => goWorkspace(name)}>
                {name}
              </button>
            ))}
        </div>
      )}

      {error && <Empty tone="error">{error}</Empty>}

      {FLAGS.filter((flag) => flag.kind === 'toggle').map((flag) => {
        const isOn = flags[flag.key] !== undefined;
        return (
          <label className="toggle" key={flag.key}>
            <input
              type="checkbox"
              checked={isOn}
              onChange={() => toggleFlag(flag.key, flag.on!, isOn)}
            />
            <span>{flag.label}</span>
          </label>
        );
      })}

      {FLAGS.filter((flag) => flag.kind === 'value').map((flag) => (
        <label className="field" key={flag.key}>
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
      </Empty>

      <details className="advanced">
        <summary>O que cada flag faz</summary>
        {FLAGS.map((flag) => (
          <Row key={flag.key} label={flag.label} value={flag.hint} />
        ))}
      </details>
    </section>
  );
}
