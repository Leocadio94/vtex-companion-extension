import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { constants, release } from 'node:os';
import { resolve } from 'node:path';
import type { ExtensionRunner, Wxt } from 'wxt';
import { defineWxtModule } from 'wxt/modules';
import { devProfileDir, webExtRunArgs } from './args';

const POWERSHELL = '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';

/**
 * No WSL, abre o `pnpm dev` no Chrome ou Firefox instalados no Windows.
 *
 * @see docs/dev-windows.md
 */
export default defineWxtModule({
  name: 'windows-browser',
  setup(wxt) {
    if (!release().toLowerCase().includes('microsoft')) return;
    const runner = createWindowsRunner(wxt);
    // O `reloadConfig` (tecla `o`, restart do servidor) recria o runner de WSL do
    // WXT, que só avisa; por isso a troca acontece a cada resolução, não uma vez.
    wxt.hooks.hook('config:resolved', () => {
      if (wxt.config.command === 'serve' && !wxt.config.webExt.config.disabled) {
        wxt.config.runner = runner;
      }
    });
  },
});

function createWindowsRunner(wxt: Wxt): ExtensionRunner {
  let profileDir: string | undefined;
  const close = () => profileDir && closeWindowsBrowser(profileDir);

  // O WXT não trata Ctrl+C, e matar o lado WSL da interop deixa o web-ext e o
  // navegador vivos no Windows, segurando o perfil para o próximo `pnpm dev`.
  const closeOnExit = once(() => {
    for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
      process.once(signal, () => {
        close();
        process.exit(128 + constants.signals[signal]);
      });
    }
  });

  return {
    canOpen: () => true,

    async openBrowser() {
      const { browser } = wxt.config;
      const dir = devProfileDir(browser, windowsEnv('LOCALAPPDATA'));
      if (!dir) {
        wxt.logger.warn(`Sem navegador do Windows para "${browser}": carregue a build à mão`);
        return;
      }
      profileDir = dir;
      closeOnExit();
      // Sobra de uma sessão que morreu sem limpar: o perfil só abre uma vez.
      closeWindowsBrowser(dir);

      const args = webExtRunArgs({
        browser: browser as 'chrome' | 'firefox',
        sourceDir: execFileSync('wslpath', ['-w', wxt.config.outDir], { encoding: 'utf8' }).trim(),
        profileDir: dir,
      });
      // A versão do lockfile, e não a última do npm: a mesma que roda no CI.
      const { version } = JSON.parse(
        readFileSync(resolve(wxt.config.root, 'node_modules/web-ext/package.json'), 'utf8'),
      );
      const child = spawn('cmd.exe', ['/c', 'npx', '-y', `web-ext@${version}`, ...args], {
        cwd: '/mnt/c',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      wxt.logger.info(`Abrindo o ${browser} do Windows (web-ext ${version} via npx)`);

      let output = '';
      const collect = (chunk: Buffer) => (output = (output + chunk).slice(-4000));
      child.stdout.on('data', collect);
      child.stderr.on('data', collect);
      child.on('error', (err) => wxt.logger.warn('Não deu para abrir o navegador do Windows:', err));
      child.on('exit', (code) => {
        if (code) wxt.logger.warn(`web-ext saiu com código ${code}:\n${output.trim()}`);
      });
    },

    async closeBrowser() {
      close();
    },
  };
}

/** Fecha a janela como um clique no X; força só o que não sair em 5 s. */
function closeWindowsBrowser(profileDir: string) {
  // `$PID` fica de fora: a linha de comando deste PowerShell também contém o perfil.
  const needle = profileDir.replaceAll("'", "''");
  const script = `
    $ids = (Get-CimInstance Win32_Process | Where-Object {
      $_.ProcessId -ne $PID -and $_.CommandLine -and $_.CommandLine.Contains('${needle}')
    }).ProcessId
    if ($ids) {
      $procs = Get-Process -Id $ids -ErrorAction SilentlyContinue
      $procs | ForEach-Object { [void]$_.CloseMainWindow() }
      $procs | Wait-Process -Timeout 5 -ErrorAction SilentlyContinue
      $procs | Stop-Process -Force -ErrorAction SilentlyContinue
    }`;
  try {
    execFileSync(POWERSHELL, ['-NoProfile', '-Command', script], { cwd: '/mnt/c', stdio: 'ignore' });
  } catch {
    // Sem PowerShell não há o que fechar; o navegador fica aberto.
  }
}

function once(fn: () => void): () => void {
  let done = false;
  return () => {
    if (!done) fn();
    done = true;
  };
}

function windowsEnv(name: string): string {
  // `cmd.exe` num cwd do WSL reclama de caminho UNC antes de responder.
  return execFileSync('cmd.exe', ['/c', 'echo', `%${name}%`], { cwd: '/mnt/c', encoding: 'utf8' }).trim();
}
