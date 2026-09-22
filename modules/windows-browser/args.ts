const TARGETS = { chrome: 'chromium', firefox: 'firefox-desktop' } as const;

/**
 * Perfil persistente do navegador de desenvolvimento, ou `null` quando o alvo
 * do WXT não tem navegador correspondente no Windows.
 *
 * @param localAppData - `%LOCALAPPDATA%` do Windows
 */
export function devProfileDir(browser: string, localAppData: string): string | null {
  return browser in TARGETS ? `${localAppData}\\vtex-companion-dev-${browser}` : null;
}

/**
 * Argumentos do `web-ext run` que abre a build de dev num navegador do Windows.
 *
 * @param sourceDir - caminho Windows da build (UNC, via `wslpath -w`)
 */
export function webExtRunArgs({
  browser,
  sourceDir,
  profileDir,
}: {
  browser: 'chrome' | 'firefox';
  sourceDir: string;
  profileDir: string;
}): string[] {
  return [
    'run',
    '--target',
    TARGETS[browser],
    '--source-dir',
    sourceDir,
    browser === 'chrome' ? '--chromium-profile' : '--firefox-profile',
    profileDir,
    '--keep-profile-changes',
    '--profile-create-if-missing',
    // Quem recarrega a extensão é o dev server do WXT; o watcher do web-ext
    // observaria um caminho UNC e brigaria com ele.
    '--no-reload',
    '--no-input',
  ];
}
