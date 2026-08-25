/** O que se lê da página para avaliar SEO. Tudo vem do DOM, nada da rede. */

export interface HreflangEntry {
  lang: string;
  href: string;
}

export interface SeoSignals {
  url: string;
  lang: string | null;
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  googlebot: string | null;
  viewport: string | null;
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
  hreflang: HreflangEntry[];
  headings: { h1: string[]; h2: number; h3: number };
  images: { total: number; withoutAlt: number };
  jsonLdTypes: string[];
}

export type Severity = 'error' | 'warn' | 'info';

export interface SeoFinding {
  id: string;
  severity: Severity;
  message: string;
}
