/** O que se lê da página para identificar scripts de terceiros. */

export interface PixelSignals {
  /** URLs de recursos e de `<script src>`, já deduplicadas. */
  urls: string[];
  /** Nomes de globais conhecidos que existem em `window`. */
  globals: string[];
  /** Ids encontrados em scripts inline (GTM-, G-, UA-, AW-). */
  inlineIds: string[];
}

export interface DetectedVendor {
  id: string;
  name: string;
  /** Ids de conta/container encontrados, quando o vendor expõe. */
  ids: string[];
  /** Foi visto pela requisição, pelo global, ou pelos dois. */
  evidence: ('rede' | 'global' | 'inline')[];
}

export interface ThirdPartyOrigin {
  origin: string;
  requests: number;
}

export interface PixelReport {
  vendors: DetectedVendor[];
  others: ThirdPartyOrigin[];
}
