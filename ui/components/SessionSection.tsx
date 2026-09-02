import { useState } from 'react';
import type { TabContext } from '@/lib/collect';
import {
  AUTH_COOKIE,
  clearSession,
  cloneAuthCookie,
  writeAuthCookie,
  type CookieResult,
} from '@/lib/auth/cookie';
import type { DetectionResult } from '@/lib/detect/signals';
import { Empty, Row } from './Row';

const SCOPE_LABEL = {
  admin: 'admin',
  store: 'loja',
} as const;

export function SessionSection({
  context,
  result,
  onChanged,
}: {
  context: TabContext;
  result: DetectionResult;
  onChanged: () => void;
}) {
  const [token, setToken] = useState('');
  const [name, setName] = useState(AUTH_COOKIE);
  const [status, setStatus] = useState<CookieResult | null>(null);
  const [busy, setBusy] = useState(false);

  // Escrever um cookie de sessão VTEX só faz sentido em domínio VTEX, e
  // oferecer o campo em qualquer página seria um convite a colar um token de
  // admin onde ele não deveria ir.
  if (!result.isVtex) {
    return null;
  }

  const cookies = result.auth.cookies;

  const run = async (action: () => Promise<CookieResult>) => {
    setBusy(true);
    const outcome = await action();
    setStatus(outcome);
    setBusy(false);
    if (outcome.ok) {
      setToken('');
      onChanged();
    }
  };

  return (
    <section>
      <h2>Sessão</h2>

      <Row
        label="Origem"
        value={<code>{context.origin}</code>}
        copy={context.origin}
      />

      {cookies.length === 0 ? (
        <Empty tone="empty">Nenhuma sessão VTEX nesta origem.</Empty>
      ) : (
        <ul className="vendors">
          {cookies.map((cookie) => (
            <li key={cookie.name}>
              <code>{cookie.name}</code>
              <span className="vendor-evidence">
                {SCOPE_LABEL[cookie.scope]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="actions">
        <button
          type="button"
          disabled={busy || !result.account}
          onClick={() =>
            void run(() =>
              cloneAuthCookie(result.account!, context.url, AUTH_COOKIE),
            )
          }
        >
          Clonar do admin
        </button>

        <button
          type="button"
          className="btn-danger"
          disabled={busy || cookies.length === 0}
          onClick={() => void run(() => clearSession(context.url))}
        >
          Limpar sessão
        </button>
      </div>

      {status && (
        <Empty tone={status.ok ? 'hint' : 'error'}>{status.message}</Empty>
      )}

      {result.account ? (
        <Empty>
          <strong>Clonar do admin</strong> copia a sessão de{' '}
          <code>{result.account}.myvtex.com</code> para esta origem, sem o token
          passar pela área de transferência. <strong>Limpar sessão</strong>{' '}
          apaga todos os cookies acima — a sessão de admin e a da loja.
        </Empty>
      ) : (
        <Empty>
          Sem account detectada nesta página, então só a colagem manual está
          disponível.
        </Empty>
      )}

      <details className="advanced">
        <summary>Colar um token</summary>

        <label className="field">
          <span>Nome</span>
          <input
            type="text"
            value={name}
            spellCheck={false}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <textarea
          rows={3}
          spellCheck={false}
          placeholder="cole aqui o VtexIdclientAutCookie"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />

        <div className="actions">
          <button
            type="button"
            disabled={busy || !token.trim() || !name.trim()}
            onClick={() =>
              void run(() =>
                writeAuthCookie(context.url, name.trim(), token.trim()),
              )
            }
          >
            Entrar com o token
          </button>
        </div>

        <Empty>
          O token dá acesso completo à sessão nesta origem. Ele não é guardado
          pela extensão — some quando o painel fecha.
        </Empty>
      </details>
    </section>
  );
}
