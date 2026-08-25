/**
 * Catálogo de scripts de terceiros e a classificação dos recursos da página.
 *
 * `classifyPixels` é pura: recebe o que a sonda leu e devolve o relatório. As
 * regras casam por URL, por global de `window` ou por id em script inline — o
 * GTM injetado por tag manager, por exemplo, aparece sem `<script src>`.
 */

import type {
  DetectedVendor,
  PixelReport,
  PixelSignals,
  ThirdPartyOrigin,
} from './signals';

export interface VendorRule {
  id: string;
  name: string;
  /** Casa contra a URL do recurso. */
  match?: RegExp;
  /** Grupo 1 vira o id da conta/container, lido da URL. */
  extractId?: RegExp;
  /**
   * Id lido de script inline. A sonda já entrega ids isolados, sem o `?id=`
   * que a URL carrega, então o padrão da URL não serve aqui.
   */
  inlineId?: RegExp;
  /** Globais de `window` que denunciam o vendor. */
  globals?: string[];
}

/** Domínios da própria infraestrutura VTEX — nunca contam como terceiros. */
const VTEX_INFRA =
  /(vtexassets\.com|vteximg\.com\.br|vtexcommercestable\.com\.br|vtexcommercebeta\.com\.br|myvtex\.com|vtex\.app|vtexpayments\.com\.br|vtexcrm\.com\.br)$/i;

export const VENDOR_RULES: VendorRule[] = [
  {
    id: 'gtm',
    name: 'Google Tag Manager',
    match: /googletagmanager\.com\/gtm\.js/i,
    extractId: /[?&]id=(GTM-[A-Z0-9]+)/i,
    inlineId: /^(GTM-[A-Z0-9]+)$/i,
    globals: ['google_tag_manager'],
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    match: /googletagmanager\.com\/gtag\/js/i,
    extractId: /[?&]id=(G-[A-Z0-9]+)/i,
    inlineId: /^(G-[A-Z0-9]+)$/i,
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    match: /googleadservices\.com|googletagmanager\.com\/gtag\/js\?id=AW-/i,
    extractId: /(AW-[A-Z0-9]+)/i,
    inlineId: /^(AW-[A-Z0-9]+)$/i,
  },
  {
    id: 'ua',
    name: 'Universal Analytics (legado)',
    match: /google-analytics\.com\/(analytics|ga)\.js/i,
    extractId: /(UA-\d+-\d+)/i,
    inlineId: /^(UA-\d+-\d+)$/i,
  },
  {
    id: 'meta',
    name: 'Meta Pixel',
    match: /connect\.facebook\.net|facebook\.com\/tr/i,
    extractId: /facebook\.com\/tr\/?\?id=(\d+)/i,
    globals: ['fbq'],
  },
  {
    id: 'tiktok',
    name: 'TikTok Pixel',
    match: /analytics\.tiktok\.com/i,
    globals: ['ttq'],
  },
  {
    id: 'clarity',
    name: 'Microsoft Clarity',
    match: /clarity\.ms/i,
    globals: ['clarity'],
  },
  { id: 'hotjar', name: 'Hotjar', match: /hotjar\.com/i, globals: ['hj'] },
  { id: 'bing', name: 'Microsoft Ads (UET)', match: /bat\.bing\.com/i, globals: ['uetq'] },
  { id: 'linkedin', name: 'LinkedIn Insight', match: /snap\.licdn\.com/i },
  { id: 'pinterest', name: 'Pinterest Tag', match: /s\.pinimg\.com/i, globals: ['pintrk'] },
  { id: 'twitter', name: 'X / Twitter Pixel', match: /static\.ads-twitter\.com/i, globals: ['twq'] },
  { id: 'criteo', name: 'Criteo', match: /static\.criteo\.net|criteo\.com/i },
  { id: 'rdstation', name: 'RD Station', match: /d335luupugsy2\.cloudfront\.net|rdstation/i },
  { id: 'linx', name: 'Linx Impulse / Chaordic', match: /linximpulse\.(com|net)|chaordicsystems\.com/i },
  { id: 'smarthint', name: 'SmartHint', match: /smarthint\.co/i },
  { id: 'trustvox', name: 'Trustvox', match: /trustvox\.com/i },
  { id: 'konduto', name: 'Konduto', match: /k-analytix\.com|konduto\.com/i },
  { id: 'clearsale', name: 'ClearSale', match: /clearsale\.com\.br/i },
  { id: 'zendesk', name: 'Zendesk', match: /zdassets\.com|zendesk\.com/i },
  { id: 'jivochat', name: 'JivoChat', match: /jivosite\.com|jivochat/i },
  { id: 'octadesk', name: 'Octadesk', match: /octadesk\.(com|services)/i },
  { id: 'recaptcha', name: 'Google reCAPTCHA', match: /(google\.com|gstatic\.com)\/recaptcha/i },
  {
    id: 'vtex-pixel',
    name: 'VTEX Pixel Manager',
    match: /vtex\.pixel-manager/i,
  },
];

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * `storeOrigin` é a origem da própria loja: tudo servido de lá é primeira
 * parte, mesmo quando o script é de um terceiro embutido no bundle.
 */
export function classifyPixels(
  signals: PixelSignals,
  storeOrigin: string,
): PixelReport {
  const vendors: DetectedVendor[] = [];
  const claimed = new Set<string>();

  for (const rule of VENDOR_RULES) {
    const matched = rule.match
      ? signals.urls.filter((url) => rule.match!.test(url))
      : [];

    const globalHit = (rule.globals ?? []).some((name) =>
      signals.globals.includes(name),
    );

    const ids = new Set<string>();
    if (rule.extractId) {
      for (const url of matched) {
        const found = url.match(rule.extractId);
        if (found?.[1]) ids.add(found[1]);
      }
    }

    if (rule.inlineId) {
      for (const inline of signals.inlineIds) {
        const found = inline.match(rule.inlineId);
        if (found?.[1]) ids.add(found[1]);
      }
    }

    const inlineHit = ids.size > 0 && matched.length === 0;
    if (matched.length === 0 && !globalHit && !inlineHit) continue;

    for (const url of matched) claimed.add(url);

    const evidence: DetectedVendor['evidence'] = [];
    if (matched.length > 0) evidence.push('rede');
    if (globalHit) evidence.push('global');
    if (inlineHit) evidence.push('inline');

    vendors.push({ id: rule.id, name: rule.name, ids: [...ids], evidence });
  }

  // O que sobrou e não é da loja nem da infraestrutura VTEX.
  const counts = new Map<string, number>();
  for (const url of signals.urls) {
    if (claimed.has(url)) continue;

    const origin = originOf(url);
    const host = hostOf(url);
    if (!origin || !host) continue;
    if (origin === storeOrigin) continue;
    if (VTEX_INFRA.test(host)) continue;

    counts.set(origin, (counts.get(origin) ?? 0) + 1);
  }

  const others: ThirdPartyOrigin[] = [...counts.entries()]
    .map(([origin, requests]) => ({ origin, requests }))
    .sort((a, b) => b.requests - a.requests);

  return { vendors, others };
}
