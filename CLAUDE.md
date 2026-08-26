# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev                 # Chrome, build + watch (no browser is launched)
pnpm dev:firefox         # Firefox, build + watch
pnpm build               # .output/chrome-mv3
pnpm build:firefox       # .output/firefox-mv3
pnpm compile             # tsc --noEmit
pnpm test                # vitest run
pnpm test:watch

pnpm vitest run lib/preview/rewrite.test.ts       # one file
pnpm vitest run -t "não gerar loop"               # one test by name

pnpm dlx web-ext lint --source-dir .output/firefox-mv3   # AMO check, must stay at 0 errors
```

Two lint warnings are expected and not actionable: `UNSAFE_VAR_ASSIGNMENT` from
React's minified bundle.

### Loading the build

Development happens in WSL with the browsers on Windows, so `webExt.disabled` is
set and nothing is launched automatically. Load unpacked from
`\\wsl.localhost\Arch\home\gabriel\Development\vtex-companion-extension\.output\chrome-mv3`,
or copy to `/mnt/c/...` if Chrome refuses the network path — **that copy must be
redone after every build**, and a stale copy has already cost one debugging
session where working code looked broken.

The WXT dev server is pinned to 3010 so it never competes with a FastStore dev
server on 3000.

## Architecture

### Detection is three layers over pure functions

`lib/detect/` never touches `browser.*` or the DOM. Probes collect a
`DetectionSignals` object — URL and cookies, then page globals, then a Session
Manager probe — and `detect()` derives a `DetectionResult` from it. This is what
makes platform, template and identity testable with fixtures instead of a live
store, and it is why `lib/detect/signals.ts` is the first file to read.

Ordering inside `detectPlatform` matters: `window.vtexjs` exists on checkout for
every technology, and `__NEXT_DATA__` exists on any headless Next store, so the
specific signal is tried first and the generic ones only break ties.

`__RUNTIME__` is the SSR snapshot and render-runtime never rewrites it on
client-side navigation. Template detection prefers the `render-route-*` class on
the render container, which is swapped on every navigation, and falls back to the
runtime route only while it still agrees with the address bar.

### Network calls run inside the page, not from the popup

`lib/catalog/probe.ts` and any future data fetch use
`scripting.executeScript` to run the request in the tab's own context. Three
reasons, all load-bearing:

- **Same-origin.** No CORS, and no host permission beyond `activeTab`.
- **The response is mapped down before it crosses back.** One product from
  `catalog_system` is hundreds of kilobytes; serializing that into the popup
  would be pure waste.
- It keeps the popup free of store-specific request logic.

Injected functions are serialized, so they must be self-contained: no imports, no
closure over the module. Pass everything through `args`, or declare it inside the
function — a module-scope constant read from an injected function becomes a
`ReferenceError` in the page, and the surrounding `catch` turns that into a
silent `null`. Prefer rendering an explicit failure state over hiding the section
when a probe returns nothing, so the next one is visible.

### Deciding what to do is separate from doing it

Every decision is a pure function over a plain object, and only those are tested:
`resolveCatalogTarget` (what to fetch), `detectPlatform` / `detectTemplate`,
`rewritePreviewUrl` / `previewUrlFromCmsApiUrl`, `analyzeSeo`,
`classifyPixels`, `findPreviewForTab`. Probes only read; they never judge. When adding a feature,
put the judgement in a pure function first and give it tests, then write the thin
probe around it.

### Preview rewriting

`rewritePreviewUrl` swaps only the origin and preserves the whole query, forcing
`/api/preview` when the path arrives at the root. That is what makes it work for
both the legacy Headless CMS and the new CMS, whose parameter shape is not
publicly documented. It returns `null` for localhost URLs so the tab redirect
cannot loop.

The `Localhost` button injected into the admin never scrapes the preview URL from
the DOM. It arms a one-shot redirect in the background and clicks the original
button, so the real URL passes through `webNavigation` and is rewritten there.
That is what makes it independent of `cmsDevMode`.

### Working inside the VTEX admin

The CMS runs in an iframe, and frames that start as `about:blank` need
`match_about_blank` on top of `all_frames` — without it the content script
silently never reaches them. `localStorage` belongs to the frame's origin, so
`cmsDevMode` is read and written with `allFrames: true` and reported per frame.

The admin is someone else's territory: the content script must never throw into
its console. It records liveness and the outcome of its last attempt in
`data-vtex-companion-*` attributes on `<html>`, and the popup reads those back —
that is the debugging channel, not `console.log`.

Every admin selector lives in `lib/preview/admin-selectors.ts`. It is the
fragile part of the project by design: when VTEX redesigns the admin, exactly one
file breaks, and not finding an element is a valid result rather than an error.

### Background is ephemeral

Chrome's service worker dies at will. Nothing lives in module state — use
`lib/settings.ts`, where `sync:` holds preferences and `session:` holds what only
matters while the browser is open.

## Permissions

There is deliberately no `<all_urls>` content script. Page reads are injected on
demand under `activeTab`, and storefront origins are optional permissions
requested from a click in the popup. Only `*://*.myvtex.com/*` and
`http://localhost/*` are required, because the admin content script and the
preview redirect must work without a click. Keep it that way: a broad
install-time warning is what gets extensions rejected.

Firefox is built as MV3 (`manifestVersion: 3` overrides WXT's MV2 default,
which lacks `optional_host_permissions`). `data_collection_permissions` forces
`strict_min_version` 140 / Android 142.

## Conventions

- Code comments are written in Portuguese; identifiers and commit messages in
  English.
- Commit messages are prose, not bullet lists, and explain why a change was made,
  including decisions taken and rejected. No `Co-Authored-By` trailer.
- The popup's API tab is intentionally absent until the fetch runner exists. A
  tab that opens onto nothing is worse than one that has not arrived.
