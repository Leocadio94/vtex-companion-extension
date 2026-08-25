/**
 * Contrato entre as três camadas de detecção.
 *
 * As camadas coletam `DetectionSignals` (dados crus, cada um vindo de um lugar
 * diferente do browser) e as funções puras de `lib/detect/*` derivam disso um
 * `DetectionResult`. Nada aqui depende de `browser.*` nem do DOM.
 */

export type VtexPlatform =
  | 'io'
  | 'faststore'
  | 'cms-legacy'
  | 'headless'
  | 'not-vtex'
  | 'unknown';

export type VtexEnvironment = 'admin' | 'storefront' | 'unknown';

export type PageTemplate =
  | 'home'
  | 'pdp'
  | 'plp'
  | 'search'
  | 'checkout'
  | 'order-placed'
  | 'login'
  | 'account'
  | 'custom'
  | 'admin'
  | 'unknown';

export type Confidence = 'none' | 'low' | 'medium' | 'high';

/** Camada 1: URL da aba. Disponível sem tocar na página. */
export interface UrlSignals {
  href: string;
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
}

/** Camada 1: cookies, lidos via `browser.cookies` (alcança os httpOnly). */
export interface CookieSignals {
  names: string[];
  /** Valor de `VtexWorkspace`, quando presente. */
  vtexWorkspace?: string;
  /** `VtexIdclientAutCookie` presente — sessão de admin neste domínio. */
  hasAdminAuthCookie: boolean;
}

/** Subconjunto de `window.__RUNTIME__` que interessa (IO Store Framework). */
export interface IoRuntimeSignal {
  account?: string;
  workspace?: string;
  production?: boolean;
  binding?: { id?: string; canonicalBaseAddress?: string };
  route?: {
    id?: string;
    path?: string;
    pageContext?: { type?: string; id?: string };
  };
}

/** Subconjunto de `window.__NEXT_DATA__` que interessa (FastStore). */
export interface NextDataSignal {
  page?: string;
  buildId?: string;
  query?: Record<string, unknown>;
}

/** Payload de `vtex.events.addData({...})` (CMS Legacy Portal). */
export interface LegacyPageSignal {
  pageCategory?: string;
  pageDepartment?: string;
  pageFacets?: unknown;
  productId?: string | number;
  accountName?: string;
  [key: string]: unknown;
}

/** Camada 2: globals lidos no MAIN world do frame principal. */
export interface PageSignals {
  runtime?: IoRuntimeSignal | null;
  nextData?: NextDataSignal | null;
  legacy?: LegacyPageSignal | null;
  /** Existe pelo menos um elemento com atributo `data-fs-*`. */
  hasFastStoreMarkup: boolean;
  /** `window.vtexjs` existe (checkout / catálogo legacy). */
  hasVtexJs: boolean;
  /** Accounts extraídos de `*.vtexassets.com` e `*.vteximg.com.br`. */
  assetAccounts: string[];
  /** Valores de `@type` dos blocos JSON-LD da página. */
  jsonLdTypes: string[];
  /** `window.location.href` do frame que fez a leitura. */
  href: string;
}

/** Camada 3: `GET /api/sessions?items=*` feito pelo background. */
export interface SessionSignals {
  ok: boolean;
  isAuthenticated?: boolean;
  email?: string;
  channel?: string;
  cultureInfo?: string;
  currencyCode?: string;
}

export interface DetectionSignals {
  url: UrlSignals;
  cookies: CookieSignals;
  page?: PageSignals | null;
  session?: SessionSignals | null;
}

export interface AuthState {
  /** Logado como shopper na loja (namespace `profile` da Session Manager). */
  storefront: boolean | 'unknown';
  storefrontEmail?: string;
  /** Cookie de admin presente no domínio. */
  admin: boolean;
}

export interface DetectionResult {
  isVtex: boolean;
  confidence: Confidence;
  platform: VtexPlatform;
  /** Sinais que sustentam `platform`, na ordem em que pesaram. */
  reasons: string[];
  account?: string;
  workspace?: string;
  binding?: string;
  environment: VtexEnvironment;
  /** URL está num workspace de dev (`{ws}--{account}.myvtex.com`). */
  isWorkspace: boolean;
  template: PageTemplate;
  templateReason?: string;
  auth: AuthState;
}
