# Instagram Carousel Exporter — Design

Date: 2026-06-23
Status: Approved, ready for implementation plan

## Problem

`/instagram` is a live, indexed SEO landing page targeting "instagram comic carousel size",
but its export button is hard-wired to "Carousel export — coming soon". Search traffic lands
and bounces 100%. The `carouselPage` exporter is already a type-level enum value
(`ChannelSpec.exporter`) but has no implementation. This plugs a ranked-traffic leak by
completing the half-built feature — the highest-certainty, lowest-risk conversion lift.

## Goals

- Implement a working `carouselPage` exporter producing Instagram-ready carousel slides.
- Reuse the existing `computeLayout → sliceSegments → renderSegment` pipeline. No new
  architecture, no new dependencies.
- Preserve the hard contract: zero network requests during export.
- Do not touch `core/render.ts` — keep the `invScale` layout/render sync invariant untouched.

## Non-goals (YAGNI)

- Auto-splitting a too-long comic into multiple carousels.
- Non-white padding fill color.
- Drag-to-reorder slides or per-page preview UI.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Content → card mapping | Continuous slice: scale to 1080 wide, gutter-priority hard-cut into same-width cards |
| Aspect ratio | User-selectable in UI: 4:5 (1080×1350) or 1:1 (1080×1080); default 4:5 |
| >10 slides (IG hard cap) | Pre-export error, mirroring the existing `TOO_TALL` guard pattern |
| Padding fill | White (matches `renderSegment`'s built-in `#ffffff` fill — no render.ts change needed) |

## Core mechanism

The only net-new behavior vs `verticalSlice` is **padding each segment to a fixed page height**.

```
computeLayout(origSizes, width=1080, gutter, watermark)        // existing, unchanged
  → sliceSegments(totalHeight, gutters, maxH = pageHeight)     // existing, maxH := pageHeight
  → for each segment:
        canvas(1080, pageHeight)
        ctx.fillRect(0, 0, 1080, pageHeight) white            // pad the full card first
        renderSegment(ctx, seg, 1080, items, sources, origSizes)  // draws content top-aligned
        toBlob()
```

Why this works (verified against `core/render.ts`):
- `renderSegment` fills `#ffffff` only over `segH = seg.yEnd - seg.yStart`, and draws each
  image at `dy = visTop - seg.yStart` — i.e. **top-aligned** from canvas y=0.
- Creating the canvas at `pageHeight` (≥ `segH`) and pre-filling the whole card white means
  content sits at the top and the unused bottom region stays white. Uniform 1080×pageHeight
  cards, clean gutter breaks preserved.
- Because the pad fill and `renderSegment`'s internal fill are both white, no parameterization
  of `render.ts` is required.

Segments are cut gutter-first under `maxH = pageHeight`, so individual cards may have differing
**content** heights, but every output **canvas** is exactly 1080×pageHeight. The last (and any
gutter-cut) segment is shorter than the page and gets white padding below.

Aspect → pageHeight (width fixed at 1080): `4:5 → 1350`, `1:1 → 1080`.

## Components

| File | Change | Nature |
|---|---|---|
| `src/core/limits.ts` | Add `MAX_CAROUSEL_PAGES = 10` and `checkCarouselPages(n): "TOO_MANY_SLIDES" \| null` | Small addition |
| `src/exporters/carouselSlice.ts` | **New**: layout → slice(pageHeight) → white-pad + renderSegment → `Blob[]` (~40 lines, mirrors `verticalSlice.ts`) | New file |
| `src/ui/useExport.ts` | Branch on `spec.exporter`: `verticalSlice` vs `carouselSlice`; thread `aspect` → `pageHeight` | Orchestration |
| `src/ui/Workspace.tsx` | Remove `carouselComingSoon` dead-button branch; show 4:5/1:1 toggle when `spec.exporter === "carouselPage"`; pre-check page count, error if >10 | UI |
| `src/core/render.ts` | **Untouched** (preserves invariant) | — |
| `MODULE_MAP.md` | Add `carouselSlice.ts` row | Docs |

## Data flow (carousel branch)

```
Workspace (aspect state: "4:5" | "1:1")
  → runExport(loaded, spec, gutter, watermark, canvasFactory, aspect)
  → carouselSlice({ ..., pageHeight })
  → packZip(blobs, "slide")
  → slide-N.png entries in toonslice-instagram.zip
```

`aspect` is UI state, not a `ChannelSpec` field — width stays 1080 in the spec; pageHeight is
derived from the aspect choice at export time.

## Error handling

Pre-export, in `Workspace.onExport` (carousel branch), mirroring the existing `checkTotalHeight`
pre-check:

```
const layout = computeLayout(sizes, 1080, gutter, watermark);
const segments = sliceSegments(layout.totalHeight, layout.gutters, pageHeight);
if (checkCarouselPages(segments.length)) {
  setStatus({ kind: "error", msg: "TOO_MANY_SLIDES: reduce images or raise gutter" });
  return;
}
```

The existing `checkTotalHeight` guard still runs (30000px ceiling applies to all exporters).

## Testing (`src/exporters/carouselSlice.test.ts`, @napi-rs/canvas in Node)

1. Every output blob decodes to exactly 1080×pageHeight — one case for 4:5 (1350), one for 1:1 (1080).
2. A short final segment has white padding below its content.
3. A gutter falling inside a page forces a cut there; no image content crosses a page boundary.
4. `watermark=true` lands the banner in the last slide.
5. `checkCarouselPages` returns `"TOO_MANY_SLIDES"` for >10 segments, `null` for ≤10.

## Success criteria

- `/instagram` export button is live; clicking it downloads `toonslice-instagram.zip` of uniform
  1080×pageHeight `slide-N.png` cards.
- Aspect toggle switches between 4:5 and 1:1 output dimensions.
- >10-slice input shows `TOO_MANY_SLIDES` and never enters the render pipeline.
- All existing tests stay green (no regression to `verticalSlice` or the watermark path).
- No network request fires during export.
