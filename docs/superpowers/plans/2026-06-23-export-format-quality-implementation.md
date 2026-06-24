# 导出格式与质量控制 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 导出格式从硬编码 PNG 改为可选 JPEG（默认，质量 0.9）/ PNG，导出后展示每个分段文件大小，X 渠道超过 5MB 显示红色警告。

**Architecture:** `format`/`quality` 作为新参数沿现有管线（`exportVerticalSlice`/`exportCarouselSlice` → `canvasFactory` → `toBlob` → `packZip`）逐层下传，只改最终编码步骤和文件名后缀；`Workspace.tsx` 新增 UI state 持有用户选择，不写入 `ChannelSpec`。

**Tech Stack:** 现有 Vite + React 18 + TypeScript + Vitest（jsdom）+ `@napi-rs/canvas`，无新增依赖。

对应设计文档：`docs/superpowers/specs/2026-06-23-export-format-quality-design.md`

## Global Constraints

- 硬契约不变：导出全程零网络请求（CLAUDE.md 明确要求），本次改动只涉及 canvas 编码与本地 zip 打包，不引入任何网络调用。
- 默认导出格式 `"image/jpeg"`，默认质量 `0.9`；PNG 仍可选，PNG 路径行为不变（`quality` 参数对 PNG 无意义，浏览器原生 `toBlob` 会忽略，无需特殊处理）。
- 质量滑块范围 `0.7`–`1.0`，step `0.05`，且只在选中 JPEG 时显示。
- 文件大小警告仅针对 X 渠道（`spec.id === "x"`），阈值硬编码 `5 * 1024 * 1024` 字节，定义在 `Workspace.tsx`，**不**写入 `ChannelSpec`/`channels/types.ts`（设计文档 Decisions 表明确：这是 UI 层常量，不是平台规格字段）。
- **不修改** `src/channels/types.ts` 和 `src/channels/*.ts`。`ChannelSpec.format` 字段含义不变（渠道推荐格式，展示在 Tech Specs Info Box），跟本次新增的用户可选导出格式是两个独立概念，互不影响。
- **不修改** `src/core/layout.ts`、`src/core/slice.ts`、`src/core/render.ts`、`src/core/limits.ts`——切片/排版核心逻辑不受格式变化影响。
- 测试基线（本计划开始前，`npm test`）：**`Test Files 11 passed (11)` / `Tests 38 passed (38)`**。目标基线（Task 5 完成后）：**`Test Files 12 passed (12)` / `Tests 41 passed (41)`**（新增 `browserCanvas.test.ts` 1 个文件 1 个测试，`zip.test.ts` 新增 1 个测试，`useExport.test.ts` 新增 1 个测试；`verticalSlice.test.ts`/`carouselSlice.test.ts` 原地修改、数量不变）。每个 Task 完成后必须保持全绿，不能减少测试数。
- Task 1/2 是纯类型穿线（threading），用 `npx tsc -b --noEmit` 做红/绿验证（先报错缺字段，加字段后通过）；Task 3/4/5 是有真实运行时行为差异的改动，用 `npx vitest run <file>` 做红/绿验证；Task 6 是纯 UI，用 `npm run build` + 手动 QA 验证（仓库里 `Workspace.tsx`/`ChannelPage.tsx` 至今没有组件渲染测试，沿用既有约定，不为此新增 `@testing-library/react`）。

---

### Task 1: `verticalSlice.ts` 类型与管线穿线

**Files:**
- Modify: `src/exporters/verticalSlice.ts`
- Test: `src/exporters/verticalSlice.test.ts`

**Interfaces:**
- Produces: `export type ExportFormat = "image/png" | "image/jpeg"`；`CanvasFactory = (w: number, h: number, format: ExportFormat, quality: number) => CanvasHandle`；`ExportInput` 新增必填字段 `format: ExportFormat`、`quality: number`。后续所有 Task（2/3/4/5/6）都从 `"./verticalSlice"` 或 `"../exporters/verticalSlice"` 导入 `ExportFormat`/`CanvasFactory`。

- [ ] **Step 1: 修改测试，补上 `format`/`quality` 字段**

`src/exporters/verticalSlice.test.ts` 里把：

```ts
    const blobs = await exportVerticalSlice({
      sources: sources.map((s) => s.image as unknown as CanvasImageSource),
      origSizes: sources.map(() => ({ w: 1600, h: 3000 })),
      spec,
      gutter: 40,
      watermark: false,
      canvasFactory: napiFactory,
    });
```

改为：

```ts
    const blobs = await exportVerticalSlice({
      sources: sources.map((s) => s.image as unknown as CanvasImageSource),
      origSizes: sources.map(() => ({ w: 1600, h: 3000 })),
      spec,
      gutter: 40,
      watermark: false,
      canvasFactory: napiFactory,
      format: "image/jpeg",
      quality: 0.9,
    });
```

- [ ] **Step 2: 跑 typecheck，确认报错**

Run: `npx tsc -b --noEmit`
Expected: FAIL，输出包含

```
error TS2353: Object literal may only specify known properties, and 'format' does not exist in type 'ExportInput'.
```

- [ ] **Step 3: 修改 `verticalSlice.ts`**

把文件头部（第 1–22 行）：

```ts
import type { ChannelSpec } from "../channels/types";
import type { ImageSize } from "../core/layout";
import { computeLayout } from "../core/layout";
import { sliceSegments } from "../core/slice";
import { renderSegment } from "../core/render";

export interface CanvasHandle {
  ctx: CanvasRenderingContext2D;
  toBlob: () => Promise<Blob>;
}

export type CanvasFactory = (w: number, h: number) => CanvasHandle;

export interface ExportInput {
  sources: CanvasImageSource[];
  origSizes: ImageSize[];
  spec: ChannelSpec;
  gutter: number;
  watermark: boolean;
  canvasFactory: CanvasFactory;
}
```

改为：

```ts
import type { ChannelSpec } from "../channels/types";
import type { ImageSize } from "../core/layout";
import { computeLayout } from "../core/layout";
import { sliceSegments } from "../core/slice";
import { renderSegment } from "../core/render";

export type ExportFormat = "image/png" | "image/jpeg";

export interface CanvasHandle {
  ctx: CanvasRenderingContext2D;
  toBlob: () => Promise<Blob>;
}

export type CanvasFactory = (
  w: number,
  h: number,
  format: ExportFormat,
  quality: number
) => CanvasHandle;

export interface ExportInput {
  sources: CanvasImageSource[];
  origSizes: ImageSize[];
  spec: ChannelSpec;
  gutter: number;
  watermark: boolean;
  canvasFactory: CanvasFactory;
  format: ExportFormat;
  quality: number;
}
```

然后把 `exportVerticalSlice` 函数体：

```ts
export async function exportVerticalSlice(
  input: ExportInput
): Promise<Blob[]> {
  const { sources, origSizes, spec, gutter, watermark, canvasFactory } = input;
  const layout = computeLayout(origSizes, spec.canvasWidth, gutter, watermark);
  const segments = sliceSegments(
    layout.totalHeight,
    layout.gutters,
    spec.maxSegmentHeight
  );

  const blobs: Blob[] = [];
  for (const seg of segments) {
    const h = seg.yEnd - seg.yStart;
    const handle = canvasFactory(spec.canvasWidth, h);
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

改为：

```ts
export async function exportVerticalSlice(
  input: ExportInput
): Promise<Blob[]> {
  const {
    sources,
    origSizes,
    spec,
    gutter,
    watermark,
    canvasFactory,
    format,
    quality,
  } = input;
  const layout = computeLayout(origSizes, spec.canvasWidth, gutter, watermark);
  const segments = sliceSegments(
    layout.totalHeight,
    layout.gutters,
    spec.maxSegmentHeight
  );

  const blobs: Blob[] = [];
  for (const seg of segments) {
    const h = seg.yEnd - seg.yStart;
    const handle = canvasFactory(spec.canvasWidth, h, format, quality);
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

- [ ] **Step 4: 验证**

Run: `npx tsc -b --noEmit`
Expected: PASS（无输出，exit code 0）

Run: `npx vitest run src/exporters/verticalSlice.test.ts`
Expected: `Tests  1 passed (1)`

- [ ] **Step 5: Commit**

```bash
git add src/exporters/verticalSlice.ts src/exporters/verticalSlice.test.ts
git commit -m "feat(export): thread format/quality through exportVerticalSlice"
```

---

### Task 2: `carouselSlice.ts` 类型与管线穿线

**Files:**
- Modify: `src/exporters/carouselSlice.ts`
- Test: `src/exporters/carouselSlice.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `CanvasFactory`、`ExportFormat`（从 `"./verticalSlice"` 导入）。
- Produces: `CarouselExportInput` 新增必填字段 `format: ExportFormat`、`quality: number`，供 Task 5（`useExport.ts`）调用。

- [ ] **Step 1: 修改测试，4 处调用都补上 `format`/`quality`**

`src/exporters/carouselSlice.test.ts` 里 4 个 `exportCarouselSlice({...})` 调用，每处都加上：

```ts
      format: "image/jpeg",
      quality: 0.9,
```

例如第一处（`"every slide is exactly canvasWidth x pageHeight (4:5)"`）：

```ts
    const blobs = await exportCarouselSlice({
      sources: [src.image as unknown as CanvasImageSource],
      origSizes: [{ w: 1080, h: 4000 }],
      spec,
      gutter: 0,
      watermark: false,
      aspect: "4:5",
      canvasFactory: napiFactory,
      format: "image/jpeg",
      quality: 0.9,
    });
```

其余 3 处（`"1:1"`、`"gutter forces a cut..."`、`"watermark=true..."`）同样在调用对象末尾补上这两行。

- [ ] **Step 2: 跑 typecheck，确认报错**

Run: `npx tsc -b --noEmit`
Expected: FAIL，输出包含

```
error TS2353: Object literal may only specify known properties, and 'format' does not exist in type 'CarouselExportInput'.
```

- [ ] **Step 3: 修改 `carouselSlice.ts`**

把：

```ts
import type { ChannelSpec } from "../channels/types";
import type { ImageSize } from "../core/layout";
import { computeLayout } from "../core/layout";
import { sliceSegments } from "../core/slice";
import { renderSegment } from "../core/render";
import type { CanvasFactory } from "./verticalSlice";
```

改为：

```ts
import type { ChannelSpec } from "../channels/types";
import type { ImageSize } from "../core/layout";
import { computeLayout } from "../core/layout";
import { sliceSegments } from "../core/slice";
import { renderSegment } from "../core/render";
import type { CanvasFactory, ExportFormat } from "./verticalSlice";
```

把：

```ts
export interface CarouselExportInput {
  sources: CanvasImageSource[];
  origSizes: ImageSize[];
  spec: ChannelSpec;
  gutter: number;
  watermark: boolean;
  aspect: CarouselAspect;
  canvasFactory: CanvasFactory;
}
```

改为：

```ts
export interface CarouselExportInput {
  sources: CanvasImageSource[];
  origSizes: ImageSize[];
  spec: ChannelSpec;
  gutter: number;
  watermark: boolean;
  aspect: CarouselAspect;
  canvasFactory: CanvasFactory;
  format: ExportFormat;
  quality: number;
}
```

把函数体：

```ts
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

改为：

```ts
export async function exportCarouselSlice(
  input: CarouselExportInput
): Promise<Blob[]> {
  const {
    sources,
    origSizes,
    spec,
    gutter,
    watermark,
    aspect,
    canvasFactory,
    format,
    quality,
  } = input;
  const pageHeight = pageHeightFor(spec.canvasWidth, aspect);
  const layout = computeLayout(origSizes, spec.canvasWidth, gutter, watermark);
  const segments = sliceSegments(layout.totalHeight, layout.gutters, pageHeight);

  const blobs: Blob[] = [];
  for (const seg of segments) {
    const handle = canvasFactory(spec.canvasWidth, pageHeight, format, quality);
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

- [ ] **Step 4: 验证**

Run: `npx tsc -b --noEmit`
Expected: PASS（无输出，exit code 0）

Run: `npx vitest run src/exporters/carouselSlice.test.ts`
Expected: `Tests  6 passed (6)`

- [ ] **Step 5: Commit**

```bash
git add src/exporters/carouselSlice.ts src/exporters/carouselSlice.test.ts
git commit -m "feat(export): thread format/quality through exportCarouselSlice"
```

---

### Task 3: `browserCanvas.ts` 真实编码

**Files:**
- Modify: `src/platform/browserCanvas.ts`
- Test (new): `src/platform/browserCanvas.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `CanvasFactory` 类型。
- Produces: `browserCanvasFactory` 实际调用 `cv.toBlob(cb, format, quality)`，供 Task 6（`Workspace.tsx`）继续直接使用（调用方式不变，仍是 `browserCanvasFactory`，但现在底层会用传入的 format/quality）。

- [ ] **Step 1: 写新测试文件**

创建 `src/platform/browserCanvas.test.ts`：

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { browserCanvasFactory } from "./browserCanvas";

describe("browserCanvasFactory", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes format and quality through to canvas.toBlob", async () => {
    const fakeBlob = new Blob(["x"]);
    let capturedArgs: unknown[] = [];
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: () => ({}) as unknown as CanvasRenderingContext2D,
      toBlob: (cb: (b: Blob | null) => void, ...args: unknown[]) => {
        capturedArgs = args;
        cb(fakeBlob);
      },
    };
    vi.spyOn(document, "createElement").mockReturnValue(
      fakeCanvas as unknown as HTMLCanvasElement
    );

    const handle = browserCanvasFactory(100, 200, "image/jpeg", 0.85);
    const blob = await handle.toBlob();

    expect(capturedArgs).toEqual(["image/jpeg", 0.85]);
    expect(blob).toBe(fakeBlob);
    expect(fakeCanvas.width).toBe(100);
    expect(fakeCanvas.height).toBe(200);
  });
});
```

- [ ] **Step 2: 跑测试，确认失败**

Run: `npx vitest run src/platform/browserCanvas.test.ts`
Expected: FAIL — `expected [ 'image/png' ] to deeply equal [ 'image/jpeg', 0.85 ]`（当前实现硬编码 `"image/png"`，不传 quality，也不用传入的 format/quality 参数）

- [ ] **Step 3: 修改 `browserCanvas.ts`**

把整个文件：

```ts
import type { CanvasFactory } from "../exporters/verticalSlice";

// Browser canvas factory — inject into exporter.
export const browserCanvasFactory: CanvasFactory = (w, h) => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  return {
    ctx,
    toBlob: () =>
      new Promise<Blob>((resolve, reject) =>
        cv.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("TOBLOB_FAILED"))),
          "image/png"
        )
      ),
  };
};
```

改为：

```ts
import type { CanvasFactory } from "../exporters/verticalSlice";

// Browser canvas factory — inject into exporter.
export const browserCanvasFactory: CanvasFactory = (w, h, format, quality) => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  return {
    ctx,
    toBlob: () =>
      new Promise<Blob>((resolve, reject) =>
        cv.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("TOBLOB_FAILED"))),
          format,
          quality
        )
      ),
  };
};
```

- [ ] **Step 4: 验证**

Run: `npx vitest run src/platform/browserCanvas.test.ts`
Expected: `Tests  1 passed (1)`

- [ ] **Step 5: Commit**

```bash
git add src/platform/browserCanvas.ts src/platform/browserCanvas.test.ts
git commit -m "feat(export): browserCanvasFactory respects format/quality in toBlob"
```

---

### Task 4: `zip.ts` 按格式生成扩展名

**Files:**
- Modify: `src/pack/zip.ts`
- Test: `src/pack/zip.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `ExportFormat` 类型。
- Produces: `packZip(blobs, baseName, format)` —新增第三个必填参数，供 Task 5（`useExport.ts`）调用。

- [ ] **Step 1: 修改测试**

把 `src/pack/zip.test.ts` 整个文件改为：

```ts
import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { packZip } from "./zip";

describe("packZip", () => {
  it("names panels sequentially panel_001.png and packs (PNG format)", async () => {
    const blobs = [new Blob(["a"]), new Blob(["bb"]), new Blob(["ccc"])];
    const buf = await packZip(blobs, "panel", "image/png");
    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files).sort();
    expect(names).toEqual(["panel_001.png", "panel_002.png", "panel_003.png"]);
  });

  it("uses .jpg extension when format is image/jpeg", async () => {
    const blobs = [new Blob(["a"]), new Blob(["bb"])];
    const buf = await packZip(blobs, "panel", "image/jpeg");
    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files).sort();
    expect(names).toEqual(["panel_001.jpg", "panel_002.jpg"]);
  });
});
```

- [ ] **Step 2: 跑测试，确认新测试失败**

Run: `npx vitest run src/pack/zip.test.ts`
Expected: 第一个测试 PASS（多传的第三个参数被旧实现忽略），第二个测试 FAIL — `expected ["panel_001.png", "panel_002.png"] to deeply equal ["panel_001.jpg", "panel_002.jpg"]`

- [ ] **Step 3: 修改 `zip.ts`**

把整个文件：

```ts
import JSZip from "jszip";

// Pack blob segments as baseName_NNN.png into a zip ArrayBuffer.
// Caller wraps in Blob for browser download.
export async function packZip(
  blobs: Blob[],
  baseName: string
): Promise<ArrayBuffer> {
  const zip = new JSZip();
  blobs.forEach((b, i) => {
    const n = String(i + 1).padStart(3, "0");
    zip.file(`${baseName}_${n}.png`, b);
  });
  return zip.generateAsync({ type: "arraybuffer" });
}
```

改为：

```ts
import JSZip from "jszip";
import type { ExportFormat } from "../exporters/verticalSlice";

// Pack blob segments as baseName_NNN.<ext> into a zip ArrayBuffer.
// Extension follows format: .jpg for image/jpeg, .png for image/png.
// Caller wraps in Blob for browser download.
export async function packZip(
  blobs: Blob[],
  baseName: string,
  format: ExportFormat
): Promise<ArrayBuffer> {
  const ext = format === "image/jpeg" ? "jpg" : "png";
  const zip = new JSZip();
  blobs.forEach((b, i) => {
    const n = String(i + 1).padStart(3, "0");
    zip.file(`${baseName}_${n}.${ext}`, b);
  });
  return zip.generateAsync({ type: "arraybuffer" });
}
```

- [ ] **Step 4: 验证**

Run: `npx vitest run src/pack/zip.test.ts`
Expected: `Tests  2 passed (2)`

- [ ] **Step 5: Commit**

```bash
git add src/pack/zip.ts src/pack/zip.test.ts
git commit -m "feat(export): packZip derives file extension from format"
```

---

### Task 5: `useExport.ts` 编排 + 返回每段大小

**Files:**
- Modify: `src/ui/useExport.ts`
- Test: `src/ui/useExport.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `ExportFormat`/`CanvasFactory`，Task 2 的 `exportCarouselSlice`（已接受 format/quality），Task 4 的 `packZip(blobs, baseName, format)`。
- Produces: `runExport(...)` 新签名 `runExport(loaded, spec, gutter, watermark, canvasFactory, aspect = "4:5", format: ExportFormat = "image/jpeg", quality = 0.9): Promise<{ buf: ArrayBuffer; sizes: number[] }>`，供 Task 6（`Workspace.tsx`）调用。`sizes[i]` 对应 `blobs[i].size`，顺序跟 zip 内文件序号（`_001`、`_002`...）一致。

- [ ] **Step 1: 修改测试**

把 `src/ui/useExport.test.ts` 整个文件改为：

```ts
import { describe, it, expect } from "vitest";
import { runExport } from "./useExport";
import { getChannel } from "../channels";
import { createCanvas } from "@napi-rs/canvas";
import JSZip from "jszip";

const factory = (w: number, h: number) => {
  const cv = createCanvas(w, h);
  return {
    ctx: cv.getContext("2d") as unknown as CanvasRenderingContext2D,
    toBlob: async () =>
      new Blob([cv.toBuffer("image/png")], { type: "image/png" }),
  };
};

describe("runExport", () => {
  it("produces a zip ArrayBuffer and per-panel sizes", async () => {
    const napi = createCanvas(1600, 2000);
    const loaded = [
      {
        image: napi as unknown as CanvasImageSource,
        size: { w: 1600, h: 2000 },
      },
    ];
    const { buf, sizes } = await runExport(
      loaded,
      getChannel("webtoon"),
      40,
      false,
      factory
    );
    expect(buf.byteLength).toBeGreaterThan(0);
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.every((s) => s > 0)).toBe(true);
  });
});

describe("runExport — carousel branch", () => {
  it("instagram spec (carouselPage) zips slide_NNN.png entries", async () => {
    const napi = createCanvas(1080, 2000);
    const loaded = [
      {
        image: napi as unknown as CanvasImageSource,
        size: { w: 1080, h: 2000 },
      },
    ];
    const { buf } = await runExport(
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

describe("runExport — format/quality threading", () => {
  it("defaults to image/jpeg quality 0.9 when caller omits them", async () => {
    let captured: unknown[] = [];
    const capturingFactory = (w: number, h: number, ...args: unknown[]) => {
      captured = args;
      const cv = createCanvas(w, h);
      return {
        ctx: cv.getContext("2d") as unknown as CanvasRenderingContext2D,
        toBlob: async () =>
          new Blob([cv.toBuffer("image/png")], { type: "image/png" }),
      };
    };
    const napi = createCanvas(1600, 2000);
    const loaded = [
      {
        image: napi as unknown as CanvasImageSource,
        size: { w: 1600, h: 2000 },
      },
    ];
    await runExport(loaded, getChannel("webtoon"), 40, false, capturingFactory);
    expect(captured).toEqual(["image/jpeg", 0.9]);
  });
});
```

- [ ] **Step 2: 跑测试，确认失败**

Run: `npx vitest run src/ui/useExport.test.ts`
Expected: FAIL — 前两个测试报 `Cannot read properties of undefined (reading 'byteLength')`（旧实现返回裸 `ArrayBuffer`，对它解构 `{ buf }` 拿到 `undefined`）；第三个测试报 `expected [] to deeply equal [ 'image/jpeg', 0.9 ]`

- [ ] **Step 3: 修改 `useExport.ts`**

把整个文件改为：

```ts
import type { ChannelSpec } from "../channels/types";
import type { ImageSize } from "../core/layout";
import {
  exportVerticalSlice,
  type CanvasFactory,
  type ExportFormat,
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

export interface ExportResult {
  buf: ArrayBuffer;
  sizes: number[];
}

// Orchestrate: loaded images → segment blobs → zip ArrayBuffer + per-panel sizes.
// Branches on spec.exporter: verticalSlice for the default pipeline,
// carouselSlice for carouselPage specs (e.g. Instagram).
// CanvasFactory injected for test/browser switching.
export async function runExport(
  loaded: LoadedLike[],
  spec: ChannelSpec,
  gutter: number,
  watermark: boolean,
  canvasFactory: CanvasFactory,
  aspect: CarouselAspect = "4:5",
  format: ExportFormat = "image/jpeg",
  quality: number = 0.9
): Promise<ExportResult> {
  const sources = loaded.map((l) => l.image);
  const origSizes = loaded.map((l) => l.size);

  let blobs: Blob[];
  let baseName: string;
  if (spec.exporter === "carouselPage") {
    blobs = await exportCarouselSlice({
      sources,
      origSizes,
      spec,
      gutter,
      watermark,
      aspect,
      canvasFactory,
      format,
      quality,
    });
    baseName = "slide";
  } else {
    blobs = await exportVerticalSlice({
      sources,
      origSizes,
      spec,
      gutter,
      watermark,
      canvasFactory,
      format,
      quality,
    });
    baseName = "panel";
  }

  const buf = await packZip(blobs, baseName, format);
  const sizes = blobs.map((b) => b.size);
  return { buf, sizes };
}
```

- [ ] **Step 4: 验证**

Run: `npx vitest run src/ui/useExport.test.ts`
Expected: `Tests  3 passed (3)`

Run: `npm test`
Expected: `Test Files  12 passed (12)` / `Tests  41 passed (41)`

- [ ] **Step 5: Commit**

```bash
git add src/ui/useExport.ts src/ui/useExport.test.ts
git commit -m "feat(export): runExport returns zip buffer + per-panel sizes, defaults to JPEG q0.9"
```

---

### Task 6: `Workspace.tsx` UI — 格式选择、质量滑块、导出后大小列表

**Files:**
- Modify: `src/ui/Workspace.tsx`

**Interfaces:**
- Consumes: Task 1 的 `ExportFormat`，Task 5 的 `runExport(...) => Promise<{ buf, sizes }>`。
- Produces: 无新增导出，是管线的终端消费者。

- [ ] **Step 1: 加类型 import**

把：

```ts
import { runExport } from "./useExport";
```

改为：

```ts
import { runExport } from "./useExport";
import type { ExportFormat } from "../exporters/verticalSlice";
```

- [ ] **Step 2: 加 X 渠道大小限制常量**

把：

```ts
export function Workspace({ preset }: { preset: ChannelSpec }) {
```

改为：

```ts
const X_EXPORT_SIZE_LIMIT_BYTES = 5 * 1024 * 1024;

export function Workspace({ preset }: { preset: ChannelSpec }) {
```

- [ ] **Step 3: 加 state**

把：

```ts
  const [watermark, setWatermark] = useState(true);
  const [aspect, setAspect] = useState<CarouselAspect>("4:5");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
```

改为：

```ts
  const [watermark, setWatermark] = useState(true);
  const [aspect, setAspect] = useState<CarouselAspect>("4:5");
  const [format, setFormat] = useState<ExportFormat>("image/jpeg");
  const [quality, setQuality] = useState(0.9);
  const [panelSizes, setPanelSizes] = useState<number[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
```

- [ ] **Step 4: 改 `onExport`，接住 `sizes`**

把：

```ts
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
```

改为：

```ts
    setStatus({ kind: "working" });
    try {
      const { buf, sizes } = await runExport(
        items,
        spec,
        gutter,
        watermark,
        browserCanvasFactory,
        aspect,
        format,
        quality
      );
      downloadZip(buf, `toonslice-${spec.id}.zip`);
      setPanelSizes(sizes);
      setStatus({ kind: "done" });
    } catch (e) {
```

- [ ] **Step 5: 加格式选择 + 质量滑块 UI**

把（watermark checkbox 块和 carousel aspect 块之间）：

```tsx
          <div className="flex items-center gap-3 mt-2">
            <input
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
              id="watermark"
              type="checkbox"
              checked={watermark}
              onChange={(e) => setWatermark(e.target.checked)}
            />
            <label
              className="font-body-sm text-on-surface cursor-pointer select-none"
              htmlFor="watermark"
            >
              Viral watermark
            </label>
          </div>

          {isCarousel && (
```

改为：

```tsx
          <div className="flex items-center gap-3 mt-2">
            <input
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
              id="watermark"
              type="checkbox"
              checked={watermark}
              onChange={(e) => setWatermark(e.target.checked)}
            />
            <label
              className="font-body-sm text-on-surface cursor-pointer select-none"
              htmlFor="watermark"
            >
              Viral watermark
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              Export Format
            </span>
            <select
              className="border border-outline-variant rounded p-2 bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
            </select>
          </label>

          {format === "image/jpeg" && (
            <div className="flex flex-col gap-3">
              <label className="font-label-caps text-label-caps text-on-surface-variant flex justify-between items-center">
                JPEG Quality
                <span className="font-utility-mono text-primary font-bold bg-primary-fixed/50 px-2 py-0.5 rounded">
                  {quality.toFixed(2)}
                </span>
              </label>
              <input
                className="w-full accent-primary"
                max={1}
                min={0.7}
                step={0.05}
                type="range"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
            </div>
          )}

          {isCarousel && (
```

- [ ] **Step 6: `SuccessPanel` 改成展示每段大小**

把：

```tsx
          {status.kind === "done" && <SuccessPanel spec={spec} />}
```

改为：

```tsx
          {status.kind === "done" && (
            <SuccessPanel spec={spec} sizes={panelSizes} />
          )}
```

把：

```tsx
function SuccessPanel({ spec }: { spec: ChannelSpec }) {
  return (
    <div className="border border-outline-variant rounded-lg p-4 bg-surface-container-low flex flex-col gap-2">
      <p className="font-body-sm text-body-sm text-on-surface font-semibold">
        Done! Your {spec.label} panels are downloading.
      </p>
      <a
        className="font-body-sm text-body-sm text-primary underline"
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

改为：

```tsx
function SuccessPanel({
  spec,
  sizes,
}: {
  spec: ChannelSpec;
  sizes: number[];
}) {
  return (
    <div className="border border-outline-variant rounded-lg p-4 bg-surface-container-low flex flex-col gap-2">
      <p className="font-body-sm text-body-sm text-on-surface font-semibold">
        Done! Your {spec.label} panels are downloading.
      </p>
      <ul className="flex flex-col gap-1">
        {sizes.map((s, i) => {
          const over = spec.id === "x" && s > X_EXPORT_SIZE_LIMIT_BYTES;
          return (
            <li
              key={i}
              className={
                over
                  ? "font-utility-mono text-utility-mono text-error font-bold"
                  : "font-utility-mono text-utility-mono text-on-surface-variant"
              }
            >
              panel-{i + 1}: {(s / (1024 * 1024)).toFixed(2)} MB
              {over ? " — exceeds X's 5MB limit" : ""}
            </li>
          );
        })}
      </ul>
      <a
        className="font-body-sm text-body-sm text-primary underline"
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

- [ ] **Step 7: 验证**

Run: `npm run build`
Expected: 退出码 0，无 TypeScript 报错，`dist/` 生成成功

Run: `npm test`
Expected: `Test Files  12 passed (12)` / `Tests  41 passed (41)`（这一步不写组件测试，回归交给现有 41 个测试 + 下面的手动 QA）

手动 QA（`npm run dev`，浏览器打开任意渠道页）：
- 上传图片 → 右侧出现 "Export Format" 下拉，默认 "JPEG"；下方出现 "JPEG Quality" 滑块，默认显示 `0.90`，拖动范围 0.70–1.00
- 切到 "PNG" → quality 滑块消失
- 切到 X / Twitter 渠道，上传一张较大的彩色图（建议找一张 >2MB 的真实漫画图），点击 Export ZIP，下载完成后 SuccessPanel 里出现 `panel-1: X.XX MB` 列表；如果某段超过 5MB，该行变红并带 "exceeds X's 5MB limit" 文案
- 切到 Webtoon/Tapas/Instagram 渠道重复导出，确认大小列表正常显示但**不**变红（即使超过 5MB，因为警告只针对 X 渠道）
- 打开 DevTools Network 面板，确认整个导出过程**零网络请求**（硬契约）

- [ ] **Step 8: Commit**

```bash
git add src/ui/Workspace.tsx
git commit -m "feat(ui): export format/quality controls + per-panel size warning for X"
```
