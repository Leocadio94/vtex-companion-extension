import type { DetectionResult } from '@/lib/detect/signals';
import type { TabContext } from '@/lib/collect';
import { Empty, Row } from '@/ui/components/Row';
import { SessionSection } from '@/ui/components/SessionSection';
import { PLATFORM_FULL } from '@/ui/labels';

function authLabel(auth: DetectionResult['auth']): string {
  if (auth.storefront === 'unknown') return 'desconhecido';
  if (!auth.storefront) return 'anônimo';
  return auth.storefrontEmail ?? 'autenticado';
}

export function StoreTab({
  context,
  result,
  onGrantPermission,
  onSessionChanged,
}: {
  context: TabContext | null;
  result: DetectionResult | null;
  onGrantPermission: () => void;
  onSessionChanged: () => void;
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
          {/* Repete o badge do cabeçalho de propósito: por extenso, e ao lado
              dos outros dados da loja, é onde se lê sem procurar. */}
          <Row label="Tecnologia" value={PLATFORM_FULL[result.platform]} />
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

      {result && (
        <SessionSection
          context={context}
          result={result}
          onChanged={onSessionChanged}
        />
      )}
    </>
  );
}
