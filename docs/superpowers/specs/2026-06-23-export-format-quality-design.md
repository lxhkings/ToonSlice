# Export Format & Quality Control — Design

Date: 2026-06-23
Status: Approved, ready for implementation plan

## Problem

Export output is hardcoded to lossless PNG (`browserCanvas.ts:15`). For real comic art
(gradients, line noise) this produces large files — observed 4.6–4.8MB per panel on a
real upload. X/Twitter's hard photo upload limit is 5MB; observed output sat at the edge
of that limit with zero margin. There is no format choice, no quality control, and no
warning when output approaches a platform's known size limit.

## Goals

- Let the user choose output format per export: JPEG (default) or PNG.
- JPEG quality is user-adjustable (0.7–1.0, default 0.9).
- After export, show each panel's resulting file size; flag in red if it exceeds a
  known platform limit.
- Reuse the existing `verticalSlice` / `carouselSlice` pipelines unchanged — only the
  final `toBlob()` encode step changes.

## Non-goals (YAGNI)

- Auto-detecting "this image needs PNG" (transparency, line art) — user picks manually.
- Blocking export when over a platform limit — warn only, user decides.
- Size-limit warnings for Webtoon/Tapas/Instagram — no confirmed official numbers exist;
  only X's 5MB photo limit is well-established enough to hardcode.
- Per-panel individual format/quality overrides — one format+quality setting applies to
  the whole export.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Default format | JPEG, quality 0.9 (industry default for color comic art) |
| PNG availability | Still selectable, for line-art/transparency use cases |
| Quality range | 0.7–1.0 slider, JPEG only (hidden when PNG selected) |
| Size warning scope | X only (5MB hard limit, well-documented); other channels: no warning |
| Over-limit behavior | Warn (red text), do not block export |
| Where quality lives | UI state in `Workspace.tsx`, threaded through like `gutter`/`watermark` — not a `ChannelSpec` field (it's a user choice, not a platform constraint) |

## Components

| File | Change | Nature |
|---|---|---|
| `src/platform/browserCanvas.ts` | `browserCanvasFactory` takes `(format, quality)`; `toBlob()` passes them to `cv.toBlob(cb, format, quality)` instead of hardcoded `"image/png"` | Small, behavior-preserving for PNG path |
| `src/exporters/verticalSlice.ts` | `ExportInput` gains `format: "image/png" \| "image/jpeg"` and `quality: number`; passed through to `canvasFactory` calls | Threading only |
| `src/exporters/carouselSlice.ts` | Same threading as above | Threading only |
| `src/ui/useExport.ts` | Accept and forward `format`/`quality` params | Threading only |
| `src/pack/zip.ts` | File extension derived from format (`.jpg` / `.png`) instead of hardcoded `.png` | Small |
| `src/ui/Workspace.tsx` | Add format select (JPEG/PNG) + quality slider (JPEG only); after export, read each blob's `.size`, render list with size; red text if `format === jpeg/png on X channel && size > 5*1024*1024` | UI |
| `src/channels/types.ts` | No change — size limit is a UI-level constant for X, not a `ChannelSpec` field (avoids inventing unconfirmed numbers for other channels) | — |

## Data flow

```
Workspace (format state: "image/jpeg" | "image/png", quality state: number)
  → runExport(loaded, spec, gutter, watermark, browserCanvasFactory, aspect, format, quality)
  → exportVerticalSlice / exportCarouselSlice({ ..., format, quality })
  → canvasFactory(w, h) → toBlob() now respects format+quality
  → packZip(blobs, baseName, format)  // extension follows format
  → Workspace renders per-panel size list; red flag if channel===X && blob.size > 5MB
```

## Error handling

Not an error — a warning. After `onExport` succeeds, before/alongside `SuccessPanel`,
render each panel's size. No new failure state; existing `error`/`done` status kinds
are unchanged.

## Testing

1. `browserCanvas` factory: format/quality params reach `cv.toBlob` call (mock canvas).
2. `verticalSlice`/`carouselSlice`: existing tests re-run with `format: "image/jpeg"` —
   segment dimensions unchanged, only encoding differs.
3. `zip.ts`: filenames end in `.jpg` when format is JPEG, `.png` when PNG (extend existing
   `packZip` test).
4. Manual/integration: export a real multi-MB source on X channel, confirm resulting
   JPEG panels drop well under 5MB at default quality 0.9.

## Success criteria

- Default export (no user action) now produces JPEG at quality 0.9, materially smaller
  files than current PNG-only baseline (target: 4.8MB → roughly 0.5–1MB on the panel
  that was tested).
- PNG still selectable and unchanged in behavior when chosen.
- X-channel panels over 5MB show a clear warning post-export.
- All existing tests stay green; no change to layout/slice core logic.
