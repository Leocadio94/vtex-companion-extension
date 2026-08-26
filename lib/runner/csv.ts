/**
 * Conversão da resposta para CSV.
 *
 * Serve para jogar num spreadsheet o que a API devolveu — lista de pedidos, de
 * SKUs, de documentos do Master Data. Objetos aninhados viram colunas com
 * caminho pontuado; listas viram JSON na célula, porque não há forma honesta de
 * achatar uma lista em coluna sem inventar linhas.
 */

type Row = Record<string, unknown>;

function flatten(value: unknown, prefix = '', into: Row = {}): Row {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    into[prefix] = value;
    return into;
  }

  for (const [key, nested] of Object.entries(value as Row)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (nested !== null && typeof nested === 'object' && !Array.isArray(nested)) {
      flatten(nested, path, into);
    } else {
      into[path] = nested;
    }
  }

  return into;
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text =
    typeof value === 'object' ? JSON.stringify(value) : String(value);

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(value: unknown): string {
  const rows = Array.isArray(value) ? value : [value];
  if (rows.length === 0) return '';

  const flat = rows.map((row) => flatten(row));

  // União das chaves: respostas da VTEX costumam variar de item para item.
  const columns: string[] = [];
  for (const row of flat) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }

  const header = columns.map(cell).join(',');
  const body = flat.map((row) =>
    columns.map((column) => cell(row[column])).join(','),
  );

  return [header, ...body].join('\n');
}
