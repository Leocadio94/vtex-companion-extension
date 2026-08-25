/**
 * Regras de SEO aplicadas aos sinais da página.
 *
 * Função pura sobre `SeoSignals` — é o que permite testar cada regra sem
 * navegador. As faixas seguem o que Google e as ferramentas de mercado usam na
 * prática, não um padrão formal: title costuma ser cortado perto de 60
 * caracteres e description perto de 160.
 */

import type { PageTemplate } from '../detect/signals';
import type { SeoFinding, SeoSignals } from './signals';

const TITLE_MIN = 15;
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 160;

/** Compara URLs ignorando query e barra final. */
function samePage(a: string, b: string): boolean {
  try {
    const left = new URL(a);
    const right = new URL(b);
    const strip = (url: URL) =>
      `${url.origin}${url.pathname.replace(/\/+$/, '')}`.toLowerCase();
    return strip(left) === strip(right);
  } catch {
    return false;
  }
}

export function analyzeSeo(
  seo: SeoSignals,
  template: PageTemplate,
): SeoFinding[] {
  const findings: SeoFinding[] = [];
  const add = (
    id: string,
    severity: SeoFinding['severity'],
    message: string,
  ) => {
    findings.push({ id, severity, message });
  };

  // Indexação primeiro: é o achado que muda o peso de todos os outros.
  const robots = `${seo.robots ?? ''} ${seo.googlebot ?? ''}`.toLowerCase();
  if (robots.includes('noindex')) {
    add('noindex', 'error', 'Página marcada como noindex — fora do índice.');
  }
  if (robots.includes('nofollow')) {
    add('nofollow', 'warn', 'Links da página marcados como nofollow.');
  }

  if (!seo.title) {
    add('title-missing', 'error', 'Sem <title>.');
  } else if (seo.title.length < TITLE_MIN) {
    add('title-short', 'warn', `Title com ${seo.title.length} caracteres — curto.`);
  } else if (seo.title.length > TITLE_MAX) {
    add(
      'title-long',
      'warn',
      `Title com ${seo.title.length} caracteres — deve ser cortado na SERP.`,
    );
  }

  if (!seo.description) {
    add('description-missing', 'warn', 'Sem meta description.');
  } else if (seo.description.length < DESCRIPTION_MIN) {
    add(
      'description-short',
      'info',
      `Description com ${seo.description.length} caracteres — curta.`,
    );
  } else if (seo.description.length > DESCRIPTION_MAX) {
    add(
      'description-long',
      'info',
      `Description com ${seo.description.length} caracteres — deve ser cortada.`,
    );
  }

  if (!seo.canonical) {
    add('canonical-missing', 'warn', 'Sem link canonical.');
  } else if (!samePage(seo.canonical, seo.url)) {
    add(
      'canonical-elsewhere',
      'info',
      `Canonical aponta para outra página: ${seo.canonical}`,
    );
  }

  if (seo.headings.h1.length === 0) {
    add('h1-missing', 'warn', 'Sem H1.');
  } else if (seo.headings.h1.length > 1) {
    add('h1-multiple', 'info', `${seo.headings.h1.length} H1 na página.`);
  }

  if (!seo.lang) {
    add('lang-missing', 'warn', 'Sem atributo lang no <html>.');
  }

  if (!seo.openGraph['title'] || !seo.openGraph['image']) {
    add(
      'og-incomplete',
      'info',
      'Open Graph incompleto — compartilhamento fica sem título ou imagem.',
    );
  }

  if (seo.images.withoutAlt > 0) {
    add(
      'img-alt',
      'info',
      `${seo.images.withoutAlt} de ${seo.images.total} imagens sem alt.`,
    );
  }

  // Dados estruturados por tipo de página: é o que o Google usa para rich
  // results de ecommerce, e o que mais falta em storefront customizado.
  if (template === 'pdp' && !seo.jsonLdTypes.includes('Product')) {
    add('jsonld-product', 'warn', 'PDP sem JSON-LD de Product.');
  }
  if (template === 'plp' && !seo.jsonLdTypes.includes('ItemList')) {
    add('jsonld-itemlist', 'info', 'Listagem sem JSON-LD de ItemList.');
  }
  if (
    (template === 'pdp' || template === 'plp') &&
    !seo.jsonLdTypes.includes('BreadcrumbList')
  ) {
    add('jsonld-breadcrumb', 'info', 'Sem JSON-LD de BreadcrumbList.');
  }

  return findings;
}

/** Pior severidade encontrada, para o resumo da aba. */
export function worstSeverity(
  findings: SeoFinding[],
): SeoFinding['severity'] | null {
  if (findings.some((finding) => finding.severity === 'error')) return 'error';
  if (findings.some((finding) => finding.severity === 'warn')) return 'warn';
  if (findings.length > 0) return 'info';
  return null;
}
