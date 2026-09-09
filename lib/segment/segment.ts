/**
 * Leitura e edição do cookie `vtex_segment`.
 *
 * Puro de propósito, como `lib/detect/*`: o valor é base64 de um JSON, e é a
 * decodificação — não o `browser.cookies` — que decide se aquilo é um segmento.
 * Quem grava é `./write.ts`.
 *
 * @see docs/segment.md
 */

export const SEGMENT_COOKIE = 'vtex_segment';

/**
 * O que a VTEX guarda no segmento. Os campos conhecidos são os que a loja usa
 * para escolher preço e catálogo; o índice aberto existe porque a plataforma
 * acrescenta chave sem avisar, e nada aqui pode descartá-la.
 */
export interface SegmentPayload {
  channel?: string | null;
  cultureInfo?: string | null;
  currencyCode?: string | null;
  currencySymbol?: string | null;
  countryCode?: string | null;
  regionId?: string | null;
  priceTables?: string | null;
  channelPrivacy?: string | null;
  campaigns?: unknown;
  [key: string]: unknown;
}

export type SegmentField = (typeof SEGMENT_FIELDS)[number]['key'];

/** Campos com controle próprio na interface. O resto entra pelo JSON cru. */
export const SEGMENT_FIELDS = [
  { key: 'channel', label: 'Sales channel', placeholder: '1' },
  { key: 'cultureInfo', label: 'Culture info', placeholder: 'pt-BR' },
  { key: 'currencyCode', label: 'Moeda', placeholder: 'BRL' },
  { key: 'regionId', label: 'Region id', placeholder: 'v2.ABC…' },
] as const;

function toBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function asPayload(parsed: unknown): SegmentPayload | null {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  return parsed as SegmentPayload;
}

/**
 * Decodifica o valor do cookie. `null` quando não é um segmento — valor de
 * outra extensão, cookie truncado, ou JSON que não é objeto.
 *
 * Aceita as três formas em que o valor aparece: base64 puro, percent-encoded
 * (é assim que o cookie costuma chegar) e base64url sem padding.
 */
export function decodeSegment(raw: string): SegmentPayload | null {
  if (!raw) return null;

  let value = raw.trim();
  if (value.includes('%')) {
    try {
      value = decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  value = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = value.length % 4;
  if (padding === 1) return null;
  if (padding > 0) value = value.padEnd(value.length + (4 - padding), '=');

  try {
    return asPayload(JSON.parse(new TextDecoder().decode(toBytes(value))));
  } catch {
    return null;
  }
}

/**
 * Volta o payload ao formato do cookie.
 *
 * `btoa` só aceita latin-1, e o segmento carrega `R$` e nomes acentuados: o
 * JSON vira bytes UTF-8 antes, ou a moeda volta corrompida da ida e volta.
 */
export function encodeSegment(payload: SegmentPayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Aplica os campos guiados sobre o segmento atual.
 *
 * Campo esvaziado vira `null`, não `""`: é o que a VTEX grava quando não há
 * região ou tabela de preço, e a loja trata string vazia como valor.
 */
export function applyEdits(
  payload: SegmentPayload,
  edits: Partial<Record<SegmentField, string>>,
): SegmentPayload {
  const next: SegmentPayload = { ...payload };

  for (const [key, value] of Object.entries(edits)) {
    if (value === undefined) continue;
    const trimmed = value.trim();
    next[key] = trimmed === '' ? null : trimmed;
  }

  return next;
}

export type SegmentParse =
  | { ok: true; payload: SegmentPayload }
  | { ok: false; error: string };

/** Valida o JSON cru antes de ele virar cookie. */
export function parseSegmentJson(text: string): SegmentParse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { ok: false, error: (error as Error)?.message ?? 'JSON inválido.' };
  }

  const payload = asPayload(parsed);
  return payload
    ? { ok: true, payload }
    : { ok: false, error: 'O segmento tem de ser um objeto JSON.' };
}
