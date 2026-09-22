import { describe, expect, it } from 'vitest';
import { devProfileDir, webExtRunArgs } from './args';

const localAppData = String.raw`C:\Users\dev\AppData\Local`;
const sourceDir = String.raw`\\wsl.localhost\Arch\repo\.output\chrome-mv3-dev`;

describe('devProfileDir', () => {
  it('dá a cada navegador um perfil próprio no LOCALAPPDATA', () => {
    expect(devProfileDir('chrome', localAppData)).toBe(String.raw`C:\Users\dev\AppData\Local\vtex-companion-dev-chrome`);
    expect(devProfileDir('firefox', localAppData)).toBe(String.raw`C:\Users\dev\AppData\Local\vtex-companion-dev-firefox`);
  });

  it('não inventa navegador para alvo sem par no Windows', () => {
    expect(devProfileDir('safari', localAppData)).toBeNull();
  });
});

describe('webExtRunArgs', () => {
  it('abre o Chrome no perfil persistente, sem o watcher do web-ext', () => {
    const profileDir = String.raw`C:\p\chrome`;
    const args = webExtRunArgs({ browser: 'chrome', sourceDir, profileDir });
    expect(args).toEqual(expect.arrayContaining(['--target', 'chromium', '--no-reload', '--keep-profile-changes']));
    expect(args[args.indexOf('--chromium-profile') + 1]).toBe(profileDir);
    expect(args[args.indexOf('--source-dir') + 1]).toBe(sourceDir);
  });

  it('usa o perfil de Firefox com a flag do Firefox', () => {
    const profileDir = String.raw`C:\p\firefox`;
    const args = webExtRunArgs({ browser: 'firefox', sourceDir, profileDir });
    expect(args).toEqual(expect.arrayContaining(['--target', 'firefox-desktop']));
    expect(args[args.indexOf('--firefox-profile') + 1]).toBe(profileDir);
  });
});
