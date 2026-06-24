# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project

ToonSlice — client-side tool that slices tall webtoon/comic images into per-platform export segments (Webtoon, Tapas, X, Instagram), packages them into a zip, and triggers a browser download. Pure frontend: **no network requests during export** — this is a hard contract (Plan2 acceptance tests assert it via network panel).

Stack: Vite + React 18 + TypeScript + Tailwind, React Router for channel pages, JSZip for packaging, Vitest (jsdom) for tests, `@napi-rs/canvas` to run canvas-dependent tests in Node.

## Commands

```
npm run dev          # vite dev server
npm run build         # tsc -b && vite build
npm run preview       # preview built dist
npm test              # vitest run (all tests once)
npm run test:watch    # vitest watch mode
```

Run a single test file: `npx vitest run src/core/slice.test.ts`
Run tests matching a name: `npx vitest run -t "gutter"`

No lint script configured.

## Architecture

Pipeline (see `MODULE_MAP.md` for the authoritative table — update it after structural changes):

```
src/channels/*.ts        channel specs (canvasWidth, maxSegmentHeight, format, SEO meta) — one file per platform
src/core/layout.ts        scale images to canvasWidth + stack vertically + compute gutter coordinates
                           when watermark=true, inserts a zero-width gutter at the banner top so the
                           banner is never split across segments
src/core/slice.ts         splits total height into segments: prefers cutting at gutters, hard-cuts as
                           fallback. Zero-width gutter's midpoint == bannerTop, guaranteeing the banner
                           always lands fully in the last segment
src/core/render.ts        draws each segment onto canvas (cropped drawImage per source image);
                           draws the watermark banner for real when present
src/core/limits.ts        MAX_TOTAL_HEIGHT guard (30000px) — checkTotalHeight()
src/exporters/verticalSlice.ts   exporter: layout → slice → render-per-segment → Blob[]
                                  (canvasFactory injected — @napi-rs/canvas in tests, browser canvas in app)
src/pack/zip.ts            JSZip packaging, named "panel-N.png" → returns ArrayBuffer (not Blob —
                            jsdom Blob compat issue, see HANDOFF.md)
src/pack/download.ts       wraps ArrayBuffer in a Blob and triggers browser download
src/platform/*.ts          browser-only glue: image decode (loadImage), canvas factory, file validation
src/ui/Workspace.tsx       tool UI — drag/drop, channel select, gutter/watermark controls, preview, export, success state
src/ui/useExport.ts        orchestration: loaded images → exportVerticalSlice → packZip
src/ui/ChannelPage.tsx     per-channel landing page wrapping Workspace + spec copy + SEO meta
src/App.tsx                routes: /, /webtoon, /tapas, /x, /instagram → ChannelPage(spec)
```

Key invariant: `renderSegment`'s source cropping uses `invScale = origH / itemHeight` — changing the
scaling strategy in `layout.ts` must stay in sync with `render.ts`.

`packZip` returns `ArrayBuffer` rather than `Blob` (jsdom compatibility); `downloadZip` in
`pack/download.ts` re-wraps it as a `Blob` for the actual browser download.

## Deployment

Deployed to Vercel. `vercel.json` has an SPA rewrite (`/(.*) → /index.html`) since routing is
client-side (React Router). SEO assets (`public/robots.txt`, `public/sitemap.xml`, OG/meta tags in
`index.html`) are static, not generated at build time — update them by hand when routes change.

## Known gaps (see HANDOFF.md)

- Channel spec numbers (canvasWidth/maxSegmentHeight) not yet verified against each platform's official limits.
- Affiliate links (`/go/*`) are placeholder redirects, not wired to real URLs.
