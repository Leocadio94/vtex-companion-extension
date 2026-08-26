import type { PixelReport } from '@/lib/pixels/signals';
import { Empty } from '@/ui/components/Row';

export function PixelsSection({ report }: { report: PixelReport | null }) {
  // A seção aparece mesmo sem resultado. Escondê-la fazia uma falha de leitura
  // ficar indistinguível de uma página sem scripts — foi assim que um
  // ReferenceError na sonda passou despercebido.
  if (!report) {
    return (
      <section>
        <h2>Scripts de terceiros</h2>
        <Empty>Não foi possível ler os scripts desta página.</Empty>
      </section>
    );
  }

  const { vendors, others } = report;

  return (
    <section>
      <h2>
        Scripts de terceiros{' '}
        <span className="pill pill-info">{vendors.length}</span>
      </h2>

      {vendors.length === 0 ? (
        <Empty>Nenhum vendor conhecido detectado nesta página.</Empty>
      ) : (
        <ul className="vendors">
          {vendors.map((vendor) => (
            <li key={vendor.id}>
              <span className="vendor-name">{vendor.name}</span>
              {vendor.ids.length > 0 && <code>{vendor.ids.join(' · ')}</code>}
              <span className="vendor-evidence">
                {vendor.evidence.join(' + ')}
              </span>
            </li>
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <details className="frames">
          <summary>Outras origens de terceiros ({others.length})</summary>
          <ul>
            {others.map((entry) => (
              <li key={entry.origin}>
                <code>{entry.origin}</code>
                <span>
                  {entry.requests}{' '}
                  {entry.requests === 1 ? 'requisição' : 'requisições'}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
