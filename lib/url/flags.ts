/**
 * Flags de URL do VTEX IO, ligadas e desligadas sobre a URL da aba.
 *
 * Pura, como `lib/preview/rewrite.ts`: a decisão de como fica a URL não depende
 * de `browser.*`. Quem navega é a interface.
 *
 * @see docs/url.md
 */

export type FlagKind = 'toggle' | 'value';

export interface FlagSpec {
  key: string;
  label: string;
  kind: FlagKind;
  /** Valor gravado quando um `toggle` é ligado. */
  on?: string;
  placeholder?: string;
  hint: string;
}

export const URL_FLAGS: FlagSpec[] = [
  {
    key: 'workspace',
    label: 'Workspace',
    kind: 'value',
    placeholder: 'dev',
    hint: 'Abre a mesma rota no workspace informado.',
  },
  {
    key: '__siteEditor',
    label: 'Site Editor',
    kind: 'toggle',
    on: 'true',
    hint: 'Abre a loja com o editor de conteúdo do IO.',
  },
  {
    key: '__disableSSR',
    label: 'Sem SSR',
    kind: 'toggle',
    on: 'true',
    hint: 'A página vem sem render no servidor — mostra o que é do cliente.',
  },
  {
    key: '__disableRuntimeSSR',
    label: 'Sem SSR do runtime',
    kind: 'toggle',
    on: 'true',
    hint: 'Desliga só o render do render-runtime, não o da rota.',
  },
  {
    key: '__bindingAddress',
    label: 'Binding',
    kind: 'value',
    placeholder: 'www.acme.com.br/br',
    hint: 'Força o binding, para lojas com mais de um domínio ou locale.',
  },
  {
    key: 'sc',
    label: 'Sales channel',
    kind: 'value',
    placeholder: '1',
    hint: 'Trade policy da requisição. O segmento continua mandando na sessão.',
  },
];

const KEYS = URL_FLAGS.map((flag) => flag.key);

function parse(href: string): URL | null {
  try {
    const parsed = new URL(href);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** As flags conhecidas presentes na URL, com o valor de cada uma. */
export function readFlags(href: string): Record<string, string> {
  const parsed = parse(href);
  if (!parsed) return {};

  const found: Record<string, string> = {};
  for (const key of KEYS) {
    const value = parsed.searchParams.get(key);
    if (value !== null) found[key] = value;
  }

  return found;
}

/**
 * Liga, troca ou desliga uma flag. `null` — e valor em branco — removem.
 *
 * O resto da query fica como estava: a URL da loja carrega utm, termo de busca e
 * paginação, e perder isso ao ligar uma flag apagaria o estado que se queria
 * inspecionar.
 */
export function setFlag(
  href: string,
  key: string,
  value: string | null,
): string | null {
  const parsed = parse(href);
  if (!parsed) return null;

  const trimmed = value?.trim() ?? '';
  if (trimmed === '') parsed.searchParams.delete(key);
  else parsed.searchParams.set(key, trimmed);

  return parsed.toString();
}

/** Tira todas as flags conhecidas, preservando o que não é nosso. */
export function clearFlags(href: string): string | null {
  const parsed = parse(href);
  if (!parsed) return null;

  for (const key of KEYS) parsed.searchParams.delete(key);
  return parsed.toString();
}
