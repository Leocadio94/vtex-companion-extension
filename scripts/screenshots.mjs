/**
 * Regera as capturas da listagem.
 *
 * Três das cinco são geradas aqui: o Playwright carrega o build de capturas num
 * Chromium real, fotografa a loja e o popup separados, e o `sharp` compõe as
 * duas peças em 1280x800. As outras duas continuam manuais e entram por
 * `brand/screenshots/manual/` — ver `docs/release.md`.
 *
 * Uso: `pnpm screenshots` (todas) ou `pnpm screenshots 1 4` (só essas).
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(ROOT, '.output-screenshots', 'chrome-mv3');
const OUT_DIR = path.join(ROOT, 'brand', 'screenshots');
const MANUAL_DIR = path.join(OUT_DIR, 'manual');
const SITE_DIR = path.resolve(
  ROOT,
  '..',
  'portfolio-astro',
  'src',
  'assets',
  'vtex-companion',
);

/** A Chrome Web Store recusa 1282x800. Não é "por volta de". */
const WIDTH = 1280;
const HEIGHT = 800;

/** Onde o popup encosta na composição. */
const POPUP = { width: 400, height: 600, top: 56, right: 56 };

const name = (n) => `vtex-companion-extension-${n}.png`;

/**
 * Lojas de demonstração públicas, as mesmas que o `docs/publicacao.md` indica:
 * numa loja de cliente a captura carrega account e e-mail que precisariam de
 * tarja.
 */
const SHOTS = [
  {
    n: 1,
    store: 'https://storetheme.vtex.com/tank-top/p',
    tab: 'Página',
    async prepare(popup) {
      await popup.getByRole('group').filter({ hasText: 'SKUs' }).first().click();
      // A lista inteira precisa caber: seção cortada pela borda sugere
      // interface truncada, que é o que `docs/publicacao.md` manda evitar.
      await popup.locator('details li').last().scrollIntoViewIfNeeded();
    },
  },
  {
    n: 4,
    store: 'https://storetheme.vtex.com/classic-shoes/p',
    tab: 'Página',
    async prepare(popup) {
      await popup
        .locator('section')
        .filter({ hasText: 'Scripts de terceiros' })
        .first()
        .scrollIntoViewIfNeeded();
    },
  },
  {
    n: 5,
    // Loja em IO: é a que traz account, workspace e binding preenchidos, que
    // é o que esta captura tem de mostrar.
    store: 'https://storetheme.vtex.com/',
    tab: 'Loja',
    async prepare(popup) {
      await popup
        .locator('section')
        .filter({ hasText: 'Sessão' })
        .first()
        .scrollIntoViewIfNeeded();
    },
  },
];

const MANUAL = [
  { n: 2, what: 'painel do DevTools — o `tabId` inspecionado só existe lá dentro' },
  { n: 3, what: 'admin do CMS — precisa de sessão autenticada' },
];

function buildForScreenshots() {
  console.log('· build de capturas (host_permissions com as lojas de demo)');
  execFileSync('pnpm', ['exec', 'wxt', 'build'], {
    cwd: ROOT,
    env: { ...process.env, WXT_SCREENSHOTS: '1' },
    stdio: 'inherit',
  });
}

async function launch() {
  const userDataDir = mkdtempSync(path.join(tmpdir(), 'vtex-companion-shots-'));
  const args = [
    `--disable-extensions-except=${BUILD}`,
    `--load-extension=${BUILD}`,
  ];

  // O headless shell não carrega extensão; o `channel: 'chromium'` usa o
  // binário completo com o headless novo, que carrega.
  try {
    return await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: true,
      args,
      viewport: { width: WIDTH, height: HEIGHT },
    });
  } catch {
    console.log('· headless novo indisponível, subindo com janela');
    return chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args,
      viewport: { width: WIDTH, height: HEIGHT },
    });
  }
}

async function extensionId(context) {
  const worker =
    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  return new URL(worker.url()).host;
}

/** Espera as sondas: enquanto elas rodam, o painel diz "Lendo …". */
async function waitProbes(popup) {
  await popup.waitForFunction(
    () => !/Lendo/.test(document.body.textContent ?? ''),
    null,
    { timeout: 30_000 },
  );
}

async function capture(context, id, shot) {
  const store = await context.newPage();
  await store.goto(shot.store, { waitUntil: 'load', timeout: 60_000 });

  const popup = await context.newPage();
  await popup.setViewportSize({ width: POPUP.width, height: POPUP.height });
  await popup.goto(`chrome-extension://${id}/popup.html`);

  // O popup lê a aba ativa da janela. Com ele em primeiro plano, a aba ativa é
  // ele mesmo — e `getTabContext` recusa o protocolo `chrome-extension:`. Daí a
  // dança: devolve o foco à loja, remonta o popup em segundo plano (é no mount
  // que o `load()` resolve a aba) e só então traz para frente. Trazer para
  // frente não remonta o React, então o estado já calculado permanece.
  await store.bringToFront();
  await popup.reload();
  await waitProbes(popup);

  await popup.bringToFront();
  await popup.getByRole('button', { name: shot.tab, exact: true }).click();
  await waitProbes(popup);
  if (shot.prepare) await shot.prepare(popup);

  const [storeShot, popupShot] = [
    await store.screenshot(),
    await popup.screenshot(),
  ];

  await popup.close();
  await store.close();

  return compose(storeShot, popupShot);
}

function compose(storeShot, popupShot) {
  const left = WIDTH - POPUP.width - POPUP.right;
  const shadow = Buffer.from(
    `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
       <defs>
         <filter id="b" x="-50%" y="-50%" width="200%" height="200%">
           <feGaussianBlur stdDeviation="16" />
         </filter>
       </defs>
       <rect x="${left}" y="${POPUP.top + 10}" width="${POPUP.width}"
             height="${POPUP.height}" rx="8" fill="rgba(0,0,0,0.42)"
             filter="url(#b)" />
     </svg>`,
  );

  return sharp(storeShot)
    .composite([
      { input: shadow, top: 0, left: 0 },
      { input: popupShot, top: POPUP.top, left },
    ])
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
}

async function write(n, buffer) {
  const meta = await sharp(buffer).metadata();
  if (meta.width !== WIDTH || meta.height !== HEIGHT) {
    throw new Error(
      `captura ${n} saiu ${meta.width}x${meta.height}; a loja exige ${WIDTH}x${HEIGHT}`,
    );
  }

  const target = path.join(OUT_DIR, name(n));
  await sharp(buffer).png({ compressionLevel: 9, effort: 10 }).toFile(target);

  if (existsSync(SITE_DIR)) {
    copyFileSync(target, path.join(SITE_DIR, name(n)));
  } else {
    console.log(`  ! ${SITE_DIR} não existe: cópia para o site pulada`);
  }

  return target;
}

/**
 * As manuais entram por `manual/`. Sem arquivo novo, a que já está commitada é
 * mantida — mas ainda assim conferida, porque uma captura fora de medida só
 * aparece no formulário da loja.
 */
async function ingestManual({ n, what }) {
  const incoming = path.join(MANUAL_DIR, `${n}.png`);
  const current = path.join(OUT_DIR, name(n));

  if (existsSync(incoming)) {
    console.log(`· ${n} manual (${what}) — vinda de manual/${n}.png`);
    return write(n, await sharp(incoming).toBuffer());
  }

  if (!existsSync(current)) {
    throw new Error(
      `captura ${n} não existe e não há manual/${n}.png. Capture o ${what}.`,
    );
  }

  console.log(`· ${n} manual (${what}) — mantendo a atual`);
  return write(n, await sharp(current).toBuffer());
}

async function main() {
  const only = process.argv.slice(2).map(Number).filter(Boolean);
  const wanted = (n) => only.length === 0 || only.includes(n);

  mkdirSync(OUT_DIR, { recursive: true });

  const shots = SHOTS.filter((shot) => wanted(shot.n));
  const manual = MANUAL.filter((entry) => wanted(entry.n));

  if (shots.length > 0) {
    buildForScreenshots();
    const context = await launch();
    try {
      const id = await extensionId(context);
      for (const shot of shots) {
        console.log(`· ${shot.n} automática — ${shot.store}`);
        console.log(`  ${await write(shot.n, await capture(context, id, shot))}`);
      }
    } finally {
      await context.close();
    }
  }

  for (const entry of manual) {
    console.log(`  ${await ingestManual(entry)}`);
  }

  console.log('\npronto. Confira cada captura antes de enviar: nenhuma pode');
  console.log('mostrar estado de erro, seção cortada ou dado de conta real.');
}

main().catch((error) => {
  console.error(`\nfalhou: ${error.message}`);
  process.exit(1);
});
