/**
 * Preferências e estado compartilhado.
 *
 * O background do Chrome é um service worker que morre a qualquer momento, então
 * nada de estado em variável de módulo: tudo que precisa sobreviver vai para o
 * `storage`. `sync` guarda preferência do usuário, `session` guarda o que só
 * vale enquanto o browser estiver aberto.
 */

import { storage } from '#imports';
import type { PreviewsByTab } from './preview/store';

/** Porta do `pnpm dev` do FastStore. */
export const previewPort = storage.defineItem<number>('sync:previewPort', {
  fallback: 3000,
});

/** Redirecionar automaticamente a aba de preview para o localhost. */
export const redirectPreview = storage.defineItem<boolean>(
  'sync:redirectPreview',
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

/** Aba do popup em que o usuário estava, para reabrir onde parou. */
export const activeTab = storage.defineItem<string>('session:activeTab', {
  fallback: 'store',
});
