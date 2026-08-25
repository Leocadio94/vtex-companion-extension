/**
 * Leitura dos sinais de SEO da aba ativa.
 *
 * `readSeo` roda dentro da página via `scripting.executeScript`, no mundo
 * isolado: só o DOM interessa aqui, nenhum global da página. Como é injetada,
 * precisa ser autocontida — sem import, sem closure.
 */

import type { SeoSignals } from './signals';

export function readSeo(): SeoSignals {
  const meta = (name: string) =>
    document
      .querySelector<HTMLMetaElement>(`meta[name="${name}" i]`)
      ?.content?.trim() || null;

  const prefixed = (attribute: string, prefix: string) => {
    const found: Record<string, string> = {};
    const tags = document.querySelectorAll<HTMLMetaElement>(
      `meta[${attribute}^="${prefix}" i]`,
    );
    for (const tag of tags) {
      const key = tag.getAttribute(attribute)?.slice(prefix.length).trim();
      const value = tag.content?.trim();
      if (key && value) found[key] = value;
    }
    return found;
  };

  const images = document.querySelectorAll('img');
  let withoutAlt = 0;
  for (const image of images) {
    if (!image.getAttribute('alt')?.trim()) withoutAlt += 1;
  }

  const jsonLdTypes = new Set<string>();
  const blocks = document.querySelectorAll('script[type="application/ld+json"]');
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block.textContent ?? '');
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        const type = item?.['@type'];
        if (typeof type === 'string') jsonLdTypes.add(type);
        else if (Array.isArray(type)) type.forEach((t) => jsonLdTypes.add(String(t)));
      }
    } catch {
      // JSON-LD malformado é comum em produção; não invalida o resto.
    }
  }

  return {
    url: window.location.href,
    lang: document.documentElement.getAttribute('lang')?.trim() || null,
    title: document.title?.trim() || null,
    description: meta('description'),
    canonical:
      document
        .querySelector<HTMLLinkElement>('link[rel="canonical" i]')
        ?.href?.trim() || null,
    robots: meta('robots'),
    googlebot: meta('googlebot'),
    viewport: meta('viewport'),
    openGraph: prefixed('property', 'og:'),
    twitter: prefixed('name', 'twitter:'),
    hreflang: [
      ...document.querySelectorAll<HTMLLinkElement>('link[rel="alternate" i][hreflang]'),
    ]
      .map((link) => ({
        lang: link.getAttribute('hreflang') ?? '',
        href: link.href,
      }))
      .filter((entry) => entry.lang),
    headings: {
      h1: [...document.querySelectorAll('h1')].map(
        (heading) => heading.textContent?.trim().slice(0, 80) ?? '',
      ),
      h2: document.querySelectorAll('h2').length,
      h3: document.querySelectorAll('h3').length,
    },
    images: { total: images.length, withoutAlt },
    jsonLdTypes: [...jsonLdTypes],
  };
}

export async function collectSeoSignals(
  tabId: number,
): Promise<SeoSignals | null> {
  try {
    const [result] = await browser.scripting.executeScript({
      target: { tabId },
      func: readSeo,
    });
    return (result?.result as SeoSignals | undefined) ?? null;
  } catch {
    return null;
  }
}
