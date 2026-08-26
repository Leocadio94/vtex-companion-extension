/** Histórico do fetch runner. Pura — o armazenamento fica em `settings.ts`. */

import type { RunnerInput } from './request';

export interface HistoryEntry {
  at: number;
  status: number;
  durationMs: number;
  input: RunnerInput;
}

export const MAX_HISTORY = 15;

export function remember(
  history: HistoryEntry[],
  entry: HistoryEntry,
): HistoryEntry[] {
  // A mesma chamada repetida não merece duas linhas: a mais recente vence.
  const withoutDuplicate = history.filter(
    (item) =>
      item.input.method !== entry.input.method ||
      item.input.url !== entry.input.url,
  );

  return [entry, ...withoutDuplicate].slice(0, MAX_HISTORY);
}
