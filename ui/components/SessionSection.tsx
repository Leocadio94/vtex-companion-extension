import { useState } from 'react';
import type { TabContext } from '@/lib/collect';
import {
  AUTH_COOKIE,
  clearAuthCookie,
  cloneAuthCookie,
  writeAuthCookie,
  type CookieResult,
} from '@/lib/auth/cookie';
import type { DetectionResult } from '@/lib/detect/signals';
import { Empty, Row } from './Row';

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
        label="Cookie de admin"
        value={result.auth.admin ? 'presente nesta origem' : 'ausente'}
      />
      <Row label="Origem" value={<code>{context.origin}</code>} />

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
            void run(() => writeAuthCookie(context.url, name.trim(), token.trim()))
          }
        >
          Entrar com o token
        </button>

        <button
          type="button"
          disabled={busy || !result.account || !name.trim()}
          onClick={() =>
            void run(() =>
              cloneAuthCookie(result.account!, context.url, name.trim()),
            )
          }
        >
          Clonar do admin
        </button>

        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={() => void run(() => clearAuthCookie(context.url, name.trim()))}
        >
          Limpar
        </button>
      </div>

      {status && <Empty>{status.message}</Empty>}

      {result.account ? (
        <Empty>
          <strong>Clonar do admin</strong> copia a sessão de{' '}
          <code>{result.account}.myvtex.com</code> para esta origem, sem o token
          passar pela área de transferência.
        </Empty>
      ) : (
        <Empty>
          Sem account detectada nesta página, então só a colagem manual está
          disponível.
        </Empty>
      )}

      <Empty>
        O token dá acesso completo à sessão nesta origem. Ele não é guardado
        pela extensão — some quando o painel fecha.
      </Empty>
    </section>
  );
}
