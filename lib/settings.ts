/**
 * Preferências e estado compartilhado.
 *
 * O background do Chrome é um service worker que morre a qualquer momento, então
 * nada de estado em variável de módulo: tudo que precisa sobreviver vai para o
 * `storage`. `local` guarda preferência do usuário, `session` guarda o que só
 * vale enquanto o browser estiver aberto.
 *
 * Nada usa `sync`: o que ele guarda sai da máquina pela conta do navegador, e a
 * política de privacidade promete que nada do que é salvo sai daqui. Ver
 * `migrateFromSync`.
 */

import { storage } from '#imports';
import type { PreviewsByTab } from './preview/store';
import type { HistoryEntry } from './runner/history';
import type { RunnerInput } from './runner/request';

/** Porta do `pnpm dev` do FastStore. */
export const previewPort = storage.defineItem<number>('local:previewPort', {
  fallback: 3000,
});

/** Redirecionar automaticamente a aba de preview para o localhost. */
export const redirectPreview = storage.defineItem<boolean>(
  'local:redirectPreview',
  { fallback: false },
);

/**
 * URLs de preview capturadas, por aba. O popup só oferece o link local para a
 * aba do admin que abriu o preview, ou para a própria aba do preview.
 */
export const previews = storage.defineItem<PreviewsByTab>('session:previews', {
  fallback: {},
});

/**
 * Janela em que o próximo preview será redirecionado mesmo com o toggle
 * desligado. É armada pelo botão "Localhost" injetado no admin: o botão não
 * conhece a URL do preview, ele arma o redirecionamento e clica no botão
 * original — quem reescreve continua sendo o background.
 */
export const oneShotUntil = storage.defineItem<number | null>(
  'session:oneShotUntil',
  { fallback: null },
);

/** Quanto tempo a arma fica válida depois do clique. */
export const ONE_SHOT_TTL_MS = 30_000;

/**
 * Workspaces abertos pelo trocador, mais recente na frente.
 *
 * Nome de workspace costuma ser nome de cliente: mais uma razão para nada aqui
 * morar em `sync`.
 */
export const recentWorkspaces = storage.defineItem<string[]>(
  'local:recentWorkspaces',
  { fallback: [] },
);

/** Aba do popup em que o usuário estava, para reabrir onde parou. */
export const activeTab = storage.defineItem<string>('session:activeTab', {
  fallback: 'store',
});

/** Formulário do fetch runner, para o popup não perder o que foi digitado. */
export const runnerInput = storage.defineItem<RunnerInput | null>(
  'session:runnerInput',
  { fallback: null },
);

/** Histórico do fetch runner. */
export const runnerHistory = storage.defineItem<HistoryEntry[]>(
  'session:runnerHistory',
  { fallback: [] },
);

/**
 * Traz as preferências que ficavam em `sync` para o `local`, uma vez.
 *
 * A porta e o redirecionamento nasceram em `sync`, que sincroniza pela conta do
 * navegador. Trocar a chave sem copiar o valor devolveria todo mundo ao default
 * em silêncio, o que é pior do que a inconsistência que a troca corrige — daí a
 * cópia, e o descarte da chave antiga logo depois para a migração não se repetir.
 */
export async function migrateFromSync(): Promise<void> {
  const pairs = [
    ['sync:previewPort', 'local:previewPort'],
    ['sync:redirectPreview', 'local:redirectPreview'],
  ] as const;

  for (const [from, to] of pairs) {
    const [current, legacy] = await Promise.all([
      storage.getItem(to),
      storage.getItem(from),
    ]);

    if (current === null && legacy !== null) await storage.setItem(to, legacy);
    if (legacy !== null) await storage.removeItem(from);
  }
}
