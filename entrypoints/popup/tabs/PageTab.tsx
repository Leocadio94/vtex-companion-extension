import type { TabContext } from '@/lib/collect';
import type { DetectionResult, PageTemplate } from '@/lib/detect/signals';
import type { CatalogSnapshot } from '@/lib/catalog/signals';
import type { PixelReport } from '@/lib/pixels/signals';
import { analyzeSeo, worstSeverity } from '@/lib/seo/analyze';
import type { SeoSignals } from '@/lib/seo/signals';
import { CatalogSection } from '../components/CatalogSection';
import { PixelsSection } from '../components/PixelsSection';
import { Empty, Row } from '@/ui/components/Row';

const TEMPLATE_LABELS: Record<PageTemplate, string> = {
  home: 'Home',
  pdp: 'PDP — página de produto',
  plp: 'PLP — listagem',
  search: 'Busca',
  checkout: 'Checkout',
  'order-placed': 'Order placed',
  login: 'Login',
  account: 'Minha conta',
  custom: 'Página custom',
  admin: 'Admin VTEX',
  unknown: 'Indeterminado',
};

const SEVERITY_LABELS = {
  error: 'erro',
  warn: 'alerta',
  info: 'nota',
} as const;

function length(value: string | null): string {
  return value ? `${value.length} caracteres` : '—';
}

export function PageTab({
  context,
  result,
  seo,
  catalog,
  adminProductUrl,
  pixels,
}: {
  context: TabContext | null;
  result: DetectionResult | null;
  seo: SeoSignals | null;
  catalog: CatalogSnapshot | null;
  adminProductUrl: string | null;
  pixels: PixelReport | null;
}) {
  if (!context || !result) {
    return <Empty>Nada para ler nesta aba.</Empty>;
  }

  const findings = seo ? analyzeSeo(seo, result.template) : [];
  const worst = worstSeverity(findings);

  return (
    <>
      <section>
        <h2>Template</h2>
        <Row label="Tipo" value={TEMPLATE_LABELS[result.template]} />
        {result.templateReason && (
          <Row label="Por quê" value={<code>{result.templateReason}</code>} />
        )}
      </section>

      {catalog && (
        <CatalogSection snapshot={catalog} adminUrl={adminProductUrl} />
      )}

      {!seo ? (
        <Empty>Não foi possível ler o SEO desta página.</Empty>
      ) : (
        <>
          <section>
            <h2>
              SEO{' '}
              {worst ? (
                <span className={`pill pill-${worst}`}>
                  {findings.length}{' '}
                  {findings.length === 1 ? 'achado' : 'achados'}
                </span>
              ) : (
                <span className="pill pill-ok">sem achados</span>
              )}
            </h2>

            {findings.length === 0 ? (
              <Empty>Nenhuma regra disparou nesta página.</Empty>
            ) : (
              <ul className="findings">
                {findings.map((finding) => (
                  <li key={finding.id}>
                    <span className={`pill pill-${finding.severity}`}>
                      {SEVERITY_LABELS[finding.severity]}
                    </span>
                    <span>{finding.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>Tags</h2>
            <Row
              label="Title"
              value={seo.title ? `${seo.title} (${length(seo.title)})` : '—'}
            />
            <Row
              label="Description"
              value={
                seo.description
                  ? `${seo.description} (${length(seo.description)})`
                  : '—'
              }
            />
            <Row
              label="Canonical"
              value={seo.canonical ? <code>{seo.canonical}</code> : '—'}
            />
            <Row label="Robots" value={seo.robots ?? 'padrão (index, follow)'} />
            <Row label="Lang" value={seo.lang ?? '—'} />
            <Row
              label="H1"
              value={
                seo.headings.h1.length > 0
                  ? seo.headings.h1.join(' · ')
                  : 'nenhum'
              }
            />
            <Row
              label="Headings"
              value={`${seo.headings.h1.length} H1 · ${seo.headings.h2} H2 · ${seo.headings.h3} H3`}
            />
            <Row
              label="Imagens"
              value={`${seo.images.total} (${seo.images.withoutAlt} sem alt)`}
            />
            <Row
              label="JSON-LD"
              value={
                seo.jsonLdTypes.length > 0 ? seo.jsonLdTypes.join(', ') : 'nenhum'
              }
            />
            <Row
              label="Open Graph"
              value={
                Object.keys(seo.openGraph).length > 0
                  ? Object.keys(seo.openGraph).join(', ')
                  : 'nenhum'
              }
            />
            {seo.hreflang.length > 0 && (
              <Row
                label="hreflang"
                value={seo.hreflang.map((entry) => entry.lang).join(', ')}
              />
            )}
          </section>
        </>
      )}

      <PixelsSection report={pixels} />
    </>
  );
}
