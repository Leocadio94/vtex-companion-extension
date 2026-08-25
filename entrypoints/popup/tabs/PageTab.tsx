import type { DetectionResult, PageTemplate } from '@/lib/detect/signals';
import type { TabContext } from '@/lib/collect';
import { Empty, Row } from '../components/Row';

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

export function PageTab({
  context,
  result,
}: {
  context: TabContext | null;
  result: DetectionResult | null;
}) {
  if (!context || !result) {
    return <Empty>Nada para ler nesta aba.</Empty>;
  }

  return (
    <section>
      <Row label="Template" value={TEMPLATE_LABELS[result.template]} />
      {result.templateReason && (
        <Row label="Por quê" value={<code>{result.templateReason}</code>} />
      )}
      <Row label="Origem" value={<code>{context.origin}</code>} />
    </section>
  );
}
