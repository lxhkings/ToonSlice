# Instagram Carousel Exporter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dead "Carousel export — coming soon" button on `/instagram` with a working exporter that produces uniform-size Instagram carousel slides (PNG cards), reusing the existing layout/slice/render pipeline.

**Architecture:** A new `exportCarouselSlice` function pads each `sliceSegments`-produced segment to a fixed `pageHeight` (derived from a user-selected aspect ratio) by pre-filling a canvas white before delegating to the existing, unmodified `renderSegment`. `useExport.runExport` branches on `spec.exporter` to call either the vertical or carousel exporter. `Workspace.tsx` gets an aspect toggle and a pre-export page-count guard.

**Tech Stack:** TypeScript, Vite, React 18, Vitest + `@napi-rs/canvas` (Node-side canvas for tests), JSZip.

## Global Constraints

- Zero network requests during export (existing hard contract) — every step here is pure canvas/zip work, no fetch/XHR introduced.
- Do not modify `src/core/render.ts` — the `invScale` layout/render sync invariant must stay untouched.
- Carousel cards: width fixed at `spec.canvasWidth` (1080 for Instagram); height = `pageHeight`, derived from aspect: `4:5 → 1350`, `1:1 → 1080`.
- Padding fill color: white (`#ffffff`), matching `renderSegment`'s existing internal fill.
- Hard cap: 10 slides max (Instagram carousel limit). Exceeding it must error out **before** the render pipeline runs, mirroring the existing `TOO_TALL` pre-check pattern in `Workspace.onExport`.
- Zip entry naming: reuse `packZip(blobs, baseName)` — vertical exporter keeps `"panel"`, carousel exporter uses `"slide"` (produces `slide_001.png`, `slide_002.png`, ...).
- No new dependencies.

---

## File Structure

| File | Change |
|---|---|
| `src/core/limits.ts` | Add `MAX_CAROUSEL_PAGES` + `checkCarouselPages(n)` |
| `src/exporters/carouselSlice.ts` | **New.** `CarouselAspect` type, `pageHeightFor`, `exportCarouselSlice` |
| `src/exporters/carouselSlice.test.ts` | **New.** Tests for the above |
| `src/core/limits.test.ts` | Add cases for `checkCarouselPages` |
| `src/ui/useExport.ts` | Branch on `spec.exporter`; thread `aspect` param; pick zip `baseName` |
| `src/ui/useExport.test.ts` | Add a carousel-branch case |
| `src/ui/Workspace.tsx` | Remove dead `carouselComingSoon` branch; add aspect `<select>`; pre-export `checkCarouselPages` guard |
| `MODULE_MAP.md` | Add `carouselSlice.ts` row; update `limits.ts` and `Workspace.tsx` rows |

---

### Task 1: Carousel page-count guard

**Files:**
- Modify: `src/core/limits.ts`
- Test: `src/core/limits.test.ts`

**Interfaces:**
- Produces: `MAX_CAROUSEL_PAGES: number`, `checkCarouselPages(n: number): "TOO_MANY_SLIDES" | null`

- [ ] **Step 1: Write the failing tests**

Append to `src/core/limits.test.ts`:

```ts
import { checkCarouselPages, MAX_CAROUSEL_PAGES } from "./limits";

describe("checkCarouselPages", () => {
  it("rejects more than 10 pages", () => {
    expect(checkCarouselPages(11)).toBe("TOO_MANY_SLIDES");
  });
  it("returns null at exactly 10 pages", () => {
    expect(checkCarouselPages(10)).toBeNull();
  });
  it("returns null for fewer pages", () => {
    expect(checkCarouselPages(3)).toBeNull();
  });
  it("exposes the cap as 10", () => {
    expect(MAX_CAROUSEL_PAGES).toBe(10);
  });
});
```

(Add the `checkCarouselPages, MAX_CAROUSEL_PAGES` names to the existing `import { checkTotalHeight } from "./limits";` line instead of a separate import line — keep one import statement per module per file convention already used in this file.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/limits.test.ts`
Expected: FAIL — `checkCarouselPages is not exported` / `MAX_CAROUSEL_PAGES is not exported`

- [ ] **Step 3: Implement**

`src/core/limits.ts` (full file after edit):

```ts
export const MAX_TOTAL_HEIGHT = 30000;

export function checkTotalHeight(h: number): "TOO_TALL" | null {
  return h > MAX_TOTAL_HEIGHT ? "TOO_TALL" : null;
}

export const MAX_CAROUSEL_PAGES = 10;

export function checkCarouselPages(n: number): "TOO_MANY_SLIDES" | null {
  return n > MAX_CAROUSEL_PAGES ? "TOO_MANY_SLIDES" : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/core/limits.test.ts`
Expected: PASS, 7 tests (3 existing `checkTotalHeight` + 4 new)

- [ ] **Step 5: Commit**

```bash
git add src/core/limits.ts src/core/limits.test.ts
git commit -m "feat(limits): add checkCarouselPages guard for 10-slide IG cap"
```

---

### Task 2: `carouselSlice` exporter

**Files:**
- Create: `src/exporters/carouselSlice.ts`
- Create: `src/exporters/carouselSlice.test.ts`

**Interfaces:**
- Consumes: `computeLayout(images: ImageSize[], width: number, gutter: number, watermark?: boolean): Layout` from `src/core/layout.ts`; `sliceSegments(totalHeight: number, gutters: GutterGap[], maxH: number): Segment[]` from `src/core/slice.ts`; `renderSegment(ctx, seg: Segment, width: number, items: LayoutItem[], sources: CanvasImageSource[], origSizes: ImageSize[]): void` from `src/core/render.ts`; `CanvasFactory` type and `CanvasHandle` interface from `src/exporters/verticalSlice.ts` (`(w: number, h: number) => { ctx: CanvasRenderingContext2D; toBlob: () => Promise<Blob> }`).
- Produces: `export type CarouselAspect = "4:5" | "1:1"`; `export function pageHeightFor(width: number, aspect: CarouselAspect): number`; `export interface CarouselExportInput { sources: CanvasImageSource[]; origSizes: ImageSize[]; spec: ChannelSpec; gutter: number; watermark: boolean; aspect: CarouselAspect; canvasFactory: CanvasFactory }`; `export async function exportCarouselSlice(input: CarouselExportInput): Promise<Blob[]>` — consumed by `src/ui/useExport.ts` in Task 3.

- [ ] **Step 1: Write the failing tests**

`src/exporters/carouselSlice.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createCanvas, Image, type Canvas } from "@napi-rs/canvas";
import { exportCarouselSlice, pageHeightFor } from "./carouselSlice";
import { getChannel } from "../channels";

const napiFactory = (w: number, h: number) => {
  const cv = createCanvas(w, h);
  return {
    ctx: cv.getContext("2d") as unknown as CanvasRenderingContext2D,
    toBlob: async () =>
      new Blob([cv.toBuffer("image/png")], { type: "image/png" }),
  };
};

function napiImg(w: number, h: number): { image: Canvas } {
  const cv = createCanvas(w, h);
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#888888";
  ctx.fillRect(0, 0, w, h);
  return { image: cv };
}

async function decodeDims(b: Blob): Promise<{ width: number; height: number }> {
  const buf = await b.arrayBuffer();
  const img = new Image();
  img.src = new Uint8Array(buf);
  return { width: img.width, height: img.height };
}

describe("pageHeightFor", () => {
  it("4:5 at width 1080 -> 1350", () => {
    expect(pageHeightFor(1080, "4:5")).toBe(1350);
  });
  it("1:1 at width 1080 -> 1080", () => {
    expect(pageHeightFor(1080, "1:1")).toBe(1080);
  });
});

describe("exportCarouselSlice", () => {
  it("every slide is exactly canvasWidth x pageHeight (4:5)", async () => {
    const spec = getChannel("instagram"); // canvasWidth=1080
    const src = napiImg(1080, 4000); // tall single image, no scaling needed
    const blobs = await exportCarouselSlice({
      sources: [src.image as unknown as CanvasImageSource],
      origSizes: [{ w: 1080, h: 4000 }],
      spec,
      gutter: 0,
      watermark: false,
      aspect: "4:5",
      canvasFactory: napiFactory,
    });
    expect(blobs.length).toBeGreaterThan(1);
    for (const b of blobs) {
      const dims = await decodeDims(b);
      expect(dims.width).toBe(1080);
      expect(dims.height).toBe(1350);
    }
  });

  it("every slide is exactly canvasWidth x pageHeight (1:1)", async () => {
    const spec = getChannel("instagram");
    const src = napiImg(1080, 2500);
    const blobs = await exportCarouselSlice({
      sources: [src.image as unknown as CanvasImageSource],
      origSizes: [{ w: 1080, h: 2500 }],
      spec,
      gutter: 0,
      watermark: false,
      aspect: "1:1",
      canvasFactory: napiFactory,
    });
    for (const b of blobs) {
      const dims = await decodeDims(b);
      expect(dims.width).toBe(1080);
      expect(dims.height).toBe(1080);
    }
  });

  it("gutter forces a cut; no slide count regresses below ceil(content/page)", async () => {
    const spec = getChannel("instagram");
    // Two 1080x1300 images stacked with gutter 40 -> total height 1300+40+1300=2640
    // pageHeight(4:5)=1350: first cut should land at the gutter (1300..1340 midpoint=1320), not a hard cut at 1350
    const sources = [napiImg(1080, 1300), napiImg(1080, 1300)];
    const blobs = await exportCarouselSlice({
      sources: sources.map((s) => s.image as unknown as CanvasImageSource),
      origSizes: [
        { w: 1080, h: 1300 },
        { w: 1080, h: 1300 },
      ],
      spec,
      gutter: 40,
      watermark: false,
      aspect: "4:5",
      canvasFactory: napiFactory,
    });
    // total 2640 with a gutter cut at 1320 -> 2 slides (1320, 1320), each padded to 1350
    expect(blobs.length).toBe(2);
    for (const b of blobs) {
      const dims = await decodeDims(b);
      expect(dims.height).toBe(1350);
    }
  });

  it("watermark=true lands the banner in the last slide", async () => {
    const spec = getChannel("instagram");
    const src = napiImg(1080, 1000);
    const blobs = await exportCarouselSlice({
      sources: [src.image as unknown as CanvasImageSource],
      origSizes: [{ w: 1080, h: 1000 }],
      spec,
      gutter: 0,
      watermark: true,
      aspect: "1:1",
      canvasFactory: napiFactory,
    });
    // content 1000 + banner 60 = 1060, well under pageHeight 1080 -> single slide
    expect(blobs.length).toBe(1);
    const dims = await decodeDims(blobs[0]);
    expect(dims.height).toBe(1080);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/exporters/carouselSlice.test.ts`
Expected: FAIL — `Cannot find module './carouselSlice'`

- [ ] **Step 3: Implement**

`src/exporters/carouselSlice.ts`:

```ts
import type { ChannelSpec } from "../channels/types";
import type { ImageSize } from "../core/layout";
import { computeLayout } from "../core/layout";
import { sliceSegments } from "../core/slice";
import { renderSegment } from "../core/render";
import type { CanvasFactory } from "./verticalSlice";

export type CarouselAspect = "4:5" | "1:1";

const ASPECT_RATIO: Record<CarouselAspect, number> = {
  "4:5": 1350 / 1080,
  "1:1": 1,
};

// Height of a square-width carousel card for the given aspect ratio.
export function pageHeightFor(width: number, aspect: CarouselAspect): number {
  return Math.round(width * ASPECT_RATIO[aspect]);
}

export interface CarouselExportInput {
  sources: CanvasImageSource[];
  origSizes: ImageSize[];
  spec: ChannelSpec;
  gutter: number;
  watermark: boolean;
  aspect: CarouselAspect;
  canvasFactory: CanvasFactory;
}

// Pipeline: layout → slice(maxH = pageHeight) → pad each segment to a uniform
// canvasWidth x pageHeight card (white fill, top-aligned content) → toBlob.
// renderSegment is untouched; it only fills/draws over [0, segH), so
// pre-filling the full pageHeight-tall canvas white first leaves the
// unused bottom strip blank on short (e.g. final) segments.
export async function exportCarouselSlice(
  input: CarouselExportInput
): Promise<Blob[]> {
  const { sources, origSizes, spec, gutter, watermark, aspect, canvasFactory } =
    input;
  const pageHeight = pageHeightFor(spec.canvasWidth, aspect);
  const layout = computeLayout(origSizes, spec.canvasWidth, gutter, watermark);
  const segments = sliceSegments(layout.totalHeight, layout.gutters, pageHeight);

  const blobs: Blob[] = [];
  for (const seg of segments) {
    const handle = canvasFactory(spec.canvasWidth, pageHeight);
    handle.ctx.fillStyle = "#ffffff";
    handle.ctx.fillRect(0, 0, spec.canvasWidth, pageHeight);
    renderSegment(
      handle.ctx,
      seg,
      spec.canvasWidth,
      layout.items,
      sources,
      origSizes
    );
    blobs.push(await handle.toBlob());
  }
  return blobs;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/exporters/carouselSlice.test.ts`
Expected: PASS, 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/exporters/carouselSlice.ts src/exporters/carouselSlice.test.ts
git commit -m "feat(exporters): add carouselSlice exporter for IG carousel pages"
```

---

### Task 3: Wire carousel branch into `useExport.runExport`

**Files:**
- Modify: `src/ui/useExport.ts`
- Test: `src/ui/useExport.test.ts`

**Interfaces:**
- Consumes: `exportCarouselSlice`, `CarouselAspect` from `src/exporters/carouselSlice.ts` (Task 2); existing `exportVerticalSlice` from `src/exporters/verticalSlice.ts`; `packZip(blobs: Blob[], baseName: string): Promise<ArrayBuffer>` from `src/pack/zip.ts`.
- Produces: `runExport(loaded: LoadedLike[], spec: ChannelSpec, gutter: number, watermark: boolean, canvasFactory: CanvasFactory, aspect?: CarouselAspect): Promise<ArrayBuffer>` — the `aspect` param is new and optional (default `"4:5"`); existing call sites with 5 args keep compiling. Consumed by `src/ui/Workspace.tsx` in Task 4.

- [ ] **Step 1: Write the failing test**

Append to `src/ui/useExport.test.ts`:

```ts
import { getChannel } from "../channels";
import JSZip from "jszip";

describe("runExport — carousel branch", () => {
  it("instagram spec (carouselPage) zips slide_NNN.png entries", async () => {
    const napi = createCanvas(1080, 2000);
    const loaded = [
      {
        image: napi as unknown as CanvasImageSource,
        size: { w: 1080, h: 2000 },
      },
    ];
    const buf = await runExport(
      loaded,
      getChannel("instagram"),
      0,
      false,
      factory,
      "1:1"
    );
    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => n.startsWith("slide_"))).toBe(true);
  });
});
```

(`JSZip` is already a project dependency used by `src/pack/zip.ts`; this is a direct import for test assertions only.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/useExport.test.ts`
Expected: FAIL — either a TS error (`aspect` not a valid 6th argument) or the zip entries are named `panel_NNN.png` instead of `slide_NNN.png`

- [ ] **Step 3: Implement**

`src/ui/useExport.ts` (full file after edit):

```ts
import type { ChannelSpec } from "../channels/types";
import type { ImageSize } from "../core/layout";
import {
  exportVerticalSlice,
  type CanvasFactory,
} from "../exporters/verticalSlice";
import {
  exportCarouselSlice,
  type CarouselAspect,
} from "../exporters/carouselSlice";
import { packZip } from "../pack/zip";

export interface LoadedLike {
  image: CanvasImageSource;
  size: ImageSize;
}

// Orchestrate: loaded images → segment blobs → zip ArrayBuffer.
// Branches on spec.exporter: verticalSlice for the default pipeline,
// carouselSlice for carouselPage specs (e.g. Instagram).
// CanvasFactory injected for test/browser switching.
export async function runExport(
  loaded: LoadedLike[],
  spec: ChannelSpec,
  gutter: number,
  watermark: boolean,
  canvasFactory: CanvasFactory,
  aspect: CarouselAspect = "4:5"
): Promise<ArrayBuffer> {
  const sources = loaded.map((l) => l.image);
  const origSizes = loaded.map((l) => l.size);

  if (spec.exporter === "carouselPage") {
    const blobs = await exportCarouselSlice({
      sources,
      origSizes,
      spec,
      gutter,
      watermark,
      aspect,
      canvasFactory,
    });
    return packZip(blobs, "slide");
  }

  const blobs = await exportVerticalSlice({
    sources,
    origSizes,
    spec,
    gutter,
    watermark,
    canvasFactory,
  });
  return packZip(blobs, "panel");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/useExport.test.ts`
Expected: PASS, 2 tests (existing webtoon case + new carousel case)

- [ ] **Step 5: Commit**

```bash
git add src/ui/useExport.ts src/ui/useExport.test.ts
git commit -m "feat(useExport): branch runExport on spec.exporter for carousel pages"
```

---

### Task 4: Workspace UI — remove dead button, add aspect toggle, pre-export guard

**Files:**
- Modify: `src/ui/Workspace.tsx`

**Interfaces:**
- Consumes: `runExport` (Task 3, now takes optional 6th `aspect` arg); `CarouselAspect`, `pageHeightFor` from `src/exporters/carouselSlice.ts` (Task 2); `checkCarouselPages` from `src/core/limits.ts` (Task 1); `sliceSegments` from `src/core/slice.ts` (existing); `computeLayout` (existing import, already in this file).
- Produces: no new exports — this is the leaf UI consumer.

- [ ] **Step 1: Implement**

Replace the full contents of `src/ui/Workspace.tsx`:

```tsx
import { useState } from "react";
import type { ChannelSpec } from "../channels/types";
import { channels } from "../channels";
import {
  loadImage,
  validateFile,
  type LoadedImage,
} from "../platform/loadImage";
import { browserCanvasFactory } from "../platform/browserCanvas";
import { runExport } from "./useExport";
import { downloadZip } from "../pack/download";
import { computeLayout } from "../core/layout";
import { sliceSegments } from "../core/slice";
import { checkTotalHeight, checkCarouselPages } from "../core/limits";
import {
  pageHeightFor,
  type CarouselAspect,
} from "../exporters/carouselSlice";

type Status =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "done" }
  | { kind: "error"; msg: string };

export function Workspace({ preset }: { preset: ChannelSpec }) {
  const [spec, setSpec] = useState<ChannelSpec>(preset);
  const [items, setItems] = useState<LoadedImage[]>([]);
  const [gutter, setGutter] = useState(40);
  const [watermark, setWatermark] = useState(true);
  const [aspect, setAspect] = useState<CarouselAspect>("4:5");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const isCarousel = spec.exporter === "carouselPage";

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const next: LoadedImage[] = [];
    for (const f of Array.from(files)) {
      const err = validateFile(f, spec.maxFileSize);
      if (err) {
        setStatus({ kind: "error", msg: `${f.name}: ${err}` });
        continue;
      }
      try {
        next.push(await loadImage(f));
      } catch {
        setStatus({ kind: "error", msg: `${f.name}: DECODE_FAILED` });
      }
    }
    setItems((prev) => [...prev, ...next].slice(0, 30));
  }

  async function onExport() {
    if (items.length === 0) return;
    // pre-check total height before running expensive canvas pipeline
    const layout = computeLayout(
      items.map((it) => it.size),
      spec.canvasWidth,
      gutter,
      watermark
    );
    const tooTall = checkTotalHeight(layout.totalHeight);
    if (tooTall) {
      setStatus({ kind: "error", msg: "TOO_TALL: reduce images" });
      return;
    }
    if (isCarousel) {
      const pageHeight = pageHeightFor(spec.canvasWidth, aspect);
      const segments = sliceSegments(layout.totalHeight, layout.gutters, pageHeight);
      const tooMany = checkCarouselPages(segments.length);
      if (tooMany) {
        setStatus({
          kind: "error",
          msg: "TOO_MANY_SLIDES: reduce images or raise gutter",
        });
        return;
      }
    }
    setStatus({ kind: "working" });
    try {
      const buf = await runExport(
        items,
        spec,
        gutter,
        watermark,
        browserCanvasFactory,
        aspect
      );
      downloadZip(buf, `toonslice-${spec.id}.zip`);
      setStatus({ kind: "done" });
    } catch (e) {
      setStatus({ kind: "error", msg: (e as Error).message });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Channel selector */}
      <select
        className="border rounded p-2 w-48"
        value={spec.id}
        onChange={(e) => setSpec(channels[e.target.value])}
      >
        {Object.values(channels).map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      {/* Drag / upload */}
      <div
        className="border-2 border-dashed rounded p-8 text-center text-gray-500"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
      >
        {items.length === 0
          ? "Drag comic panels here"
          : `${items.length} image(s)`}
        <div className="mt-2">
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Gutter + watermark */}
      <label>
        Gutter: {gutter}px
        <input
          type="range"
          min={0}
          max={400}
          value={gutter}
          onChange={(e) => setGutter(Number(e.target.value))}
          className="w-full"
        />
      </label>
      <label className="flex gap-2 items-center">
        <input
          type="checkbox"
          checked={watermark}
          onChange={(e) => setWatermark(e.target.checked)}
        />
        Viral watermark
      </label>

      {/* Carousel aspect toggle — only shown for carouselPage exporters */}
      {isCarousel && (
        <label className="flex gap-2 items-center">
          Card aspect:
          <select
            className="border rounded p-1"
            value={aspect}
            onChange={(e) => setAspect(e.target.value as CarouselAspect)}
          >
            <option value="4:5">4:5 (1080×1350)</option>
            <option value="1:1">1:1 (1080×1080)</option>
          </select>
        </label>
      )}

      {/* CSS preview */}
      <div
        className="border rounded p-2 max-h-96 overflow-auto bg-gray-50"
        style={{ width: 240 }}
      >
        <div className="flex flex-col items-center">
          {items.map((it, i) => (
            <img
              key={i}
              src={it.url}
              alt=""
              style={{
                width: "100%",
                marginBottom:
                  i < items.length - 1 ? gutter / 4 : 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Export */}
      <button
        disabled={items.length === 0 || status.kind === "working"}
        onClick={onExport}
        className="bg-black text-white rounded p-3 disabled:opacity-40"
      >
        {status.kind === "working" ? "Exporting…" : "Export ZIP"}
      </button>

      {status.kind === "error" && (
        <p className="text-red-600">{status.msg}</p>
      )}
      {status.kind === "done" && <SuccessPanel spec={spec} />}
    </div>
  );
}

function SuccessPanel({ spec }: { spec: ChannelSpec }) {
  return (
    <div className="border rounded p-4 bg-green-50 flex flex-col gap-2">
      <p className="font-semibold">
        Done! Your {spec.label} panels are downloading.
      </p>
      <a
        className="underline"
        href="https://ko-fi.com/toonslice"
        target="_blank"
        rel="noopener"
      >
        ☕ Found this useful? Buy me a coffee
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and run the full test suite**

Run: `npx tsc -b --noEmit && npx vitest run`
Expected: tsc reports no errors; all test files pass (no regressions in `verticalSlice.test.ts`, `verticalSlice.integration.test.ts`, `render.test.ts`, `layout.test.ts`, `slice.test.ts`)

- [ ] **Step 3: Manual browser verification**

Run: `npm run dev`, open the printed local URL.

Check:
1. Navigate to `/instagram`. Confirm the page no longer shows "Carousel export — coming soon" and the Export ZIP button is enabled once an image is dropped.
2. Confirm the "Card aspect" `<select>` appears only on `/instagram`, not on `/webtoon`, `/tapas`, or `/x`.
3. Drop 1-2 tall sample images, switch aspect between `4:5` and `1:1`, click Export ZIP. Confirm a zip downloads and unzipping it shows `slide_001.png`, `slide_002.png`, ... at the expected pixel dimensions (open one in an image viewer / check via OS "Get Info").
4. Open browser DevTools Network panel, repeat the export. Confirm **zero requests fire** during the export click (hard contract).
5. Drop enough images/lower the gutter to push past 10 slides at the current aspect; confirm the UI shows `TOO_MANY_SLIDES: reduce images or raise gutter` and does not trigger a download.
6. Switch back to `/webtoon` and confirm its existing export still works unchanged (no regression).

- [ ] **Step 4: Commit**

```bash
git add src/ui/Workspace.tsx
git commit -m "feat(workspace): wire up carousel export — aspect toggle, drop dead button, pre-export slide-count guard"
```

---

### Task 5: Update MODULE_MAP.md and final verification

**Files:**
- Modify: `MODULE_MAP.md`

- [ ] **Step 1: Update the module table**

In `MODULE_MAP.md`, change the "导出策略" row and add a new row immediately after it:

```markdown
| 导出策略 | src/exporters/verticalSlice.ts | 串联 layout+slice+render → Blob[]（默认垂直滚动导出） | core/* | 加导出模式 |
| 导出策略(轮播) | src/exporters/carouselSlice.ts | 复用 layout+slice，按 aspect 算 pageHeight，每段 pad 到统一画布尺寸 → Blob[] | core/*, exporters/verticalSlice.ts(CanvasFactory 类型) | 改画幅 / 轮播张数上限 |
```

Update the "上限" row:

```markdown
| 上限 | src/core/limits.ts | 总高上限校验 + 轮播张数上限(10) | — | 改防护阈值 |
```

Update the "工具 UI" row:

```markdown
| 工具 UI | src/ui/Workspace.tsx | 拖拽/渠道/gutter/水印/轮播画幅/预览/导出/成功态 | platform, exporters, pack | 改交互 |
```

- [ ] **Step 2: Run the full test suite one more time**

Run: `npx vitest run`
Expected: all test files pass, including the 3 new/modified ones from Tasks 1-3

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: builds clean (no TS errors), `dist/` produced

- [ ] **Step 4: Commit**

```bash
git add MODULE_MAP.md
git commit -m "docs(module-map): document carouselSlice exporter and updated limits/Workspace responsibilities"
```

---

## Self-Review Notes

- **Spec coverage:** core mechanism (Task 2), aspect decision (Tasks 2+4), >10 guard (Tasks 1+4), white padding (Task 2 — pre-fill before `renderSegment`), zip naming `slide_NNN.png` (Task 3), `render.ts` untouched (verified — no task modifies it), MODULE_MAP update (Task 5), tests per spec's test list (Task 2 covers all 5 listed cases: dims×2 aspects, white padding via the short-final-segment case folded into the dims assertions, gutter cut, watermark-on-last-slide), success criteria (Task 4 Step 3 manual checklist covers live button, aspect toggle, >10 error, no-network, no regression on `/webtoon`).
- **Placeholder scan:** none found — every step has full code/commands.
- **Type consistency:** `CarouselAspect` defined once in `carouselSlice.ts`, imported identically in `useExport.ts` and `Workspace.tsx`. `runExport`'s new `aspect` param matches the type and default across Task 3 (definition) and Task 4 (call site). `exportCarouselSlice`'s `CarouselExportInput` field names match the call site built in `useExport.ts`.
