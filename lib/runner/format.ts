/**
 * Formatação da resposta do runner.
 *
 * Duas leituras da mesma coisa: o corpo cru, que é o que a API devolveu byte a
 * byte, e o JSON indentado e colorido, que é o que se lê. Nenhuma das duas
 * substitui a outra — cru importa quando o problema é o formato, não o
 * conteúdo.
 */

export type JsonTokenType =
  | 'key'
  | 'string'
  | 'number'
  | 'literal'
  | 'punct';

export interface JsonToken {
  type: JsonTokenType;
  text: string;
}

/** Indenta o corpo, ou devolve `null` quando não é JSON. */
export function prettyJson(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return null;
  }
}

const PATTERN =
  /("(?:\\.|[^"\\])*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

/**
 * Quebra o JSON já indentado em pedaços coloríveis.
 *
 * Uma string é chave quando o próximo caractere não branco é `:` — é a única
 * distinção que o realce precisa fazer, e ela não exige um parser.
 */
export function tokenizeJson(text: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  let cursor = 0;

  PATTERN.lastIndex = 0;
  let match = PATTERN.exec(text);

  while (match) {
    if (match.index > cursor) {
      tokens.push({ type: 'punct', text: text.slice(cursor, match.index) });
    }

    if (match[1] !== undefined) {
      const after = text.slice(match.index + match[1].length);
      const isKey = /^\s*:/.test(after);
      tokens.push({ type: isKey ? 'key' : 'string', text: match[1] });
    } else if (match[2] !== undefined) {
      tokens.push({ type: 'literal', text: match[2] });
    } else if (match[3] !== undefined) {
      tokens.push({ type: 'number', text: match[3] });
    }

    cursor = match.index + match[0].length;
    match = PATTERN.exec(text);
  }

  if (cursor < text.length) {
    tokens.push({ type: 'punct', text: text.slice(cursor) });
  }

  return tokens;
}
