import type { DetectionResult } from '@/lib/detect/signals';
import type { TabContext } from '@/lib/collect';
import { Empty, Row } from '../components/Row';

function authLabel(auth: DetectionResult['auth']): string {
  if (auth.storefront === 'unknown') return 'desconhecido';
  if (!auth.storefront) return 'anônimo';
  return auth.storefrontEmail ?? 'autenticado';
}

export function StoreTab({
  context,
  result,
  onGrantPermission,
}: {
  context: TabContext | null;
  result: DetectionResult | null;
  onGrantPermission: () => void;
}) {
  if (!context) {
    return (
      <Empty>
        Esta aba não é uma página web comum. Abra uma loja ou o admin da VTEX.
      </Empty>
    );
  }

  return (
    <>
      {!context.hasHostPermission && (
        <section className="notice">
          <p>
            Sem permissão para ler <strong>{context.origin}</strong>. Cookies e
            estado de login ficam de fora da detecção.
          </p>
          <button type="button" onClick={onGrantPermission}>
            Conceder acesso a este site
          </button>
        </section>
      )}

      {result && (
        <section>
          <Row label="Detecção" value={result.isVtex ? 'VTEX' : 'não é VTEX'} />
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
            value={result.environment === 'admin' ? 'Admin VTEX' : 'Loja final'}
          />
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
    </>
  );
}
