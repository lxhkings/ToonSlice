# ToonSlice Plan 1 — 纯前端构建(DeepSeek V4 Pro 执行)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 ToonSlice 纯前端 webcomic 渠道适配工具 MVP:拖图 → 选渠道 → 浏览器本地 Canvas 逐段渲染切片 → 打包 zip 下载,图不上传。

**Architecture:** 纯前端,无后端。核心引擎(layout/slice/render)为渠道无关纯逻辑 + Canvas;渠道(channels)与导出模式(exporters)模块化可插拔;UI 为 React + 渠道路由页。

**Tech Stack:** Vite + React + TypeScript + Tailwind + Canvas API + JSZip + Vitest + @napi-rs/canvas(测试环境 canvas)。

**关联 spec:** `spec-mvp.md`(产品)、`spec-monetization.md`(变现)。

**执行者铁律(每个 task):**
1. 先写测试 → 跑红 → 实现 → 跑绿 → commit。
2. commit 后**立即更新 `MODULE_MAP.md`**(项目根)对应行。
3. 测试不绿不许进下一 task。

---

### Task 0: 脚手架 + 交接契约文件

**Files:**
- Create: `package.json`, `vite.config.ts`, `tailwind.config.js`, `vitest.config.ts`, `tsconfig.json`
- Create: `MODULE_MAP.md`, `HANDOFF.md`

- [ ] **Step 1: 初始化 Vite React TS**

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer vitest @napi-rs/canvas jsdom
npm install jszip react-router-dom
npx tailwindcss init -p
```

- [ ] **Step 2: 配置 Tailwind**

`tailwind.config.js` 的 `content`:
```js
content: ["./index.html", "./src/**/*.{ts,tsx}"],
```
`src/index.css` 顶部加:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: 配置 Vitest**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "jsdom", globals: true },
});
```
`package.json` scripts 加:`"test": "vitest run"`, `"test:watch": "vitest"`。

- [ ] **Step 4: 建空契约文件**

`MODULE_MAP.md`:
```markdown
# ToonSlice 模块地图

> 每个 task 完成后由执行者更新本表。供验收/协作快速定位,无需全仓扫描。

| 模块 | 路径 | 职责 | 依赖 | 常见改动场景 |
|---|---|---|---|---|
| (待填) | | | | |
```

`HANDOFF.md`:
```markdown
# ToonSlice Plan1 → Plan2 交接

## 已完成
- (执行中逐条填)

## 已知缺口 / 未覆盖
- (收尾填)

## 难点与注意
- (收尾填)
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite+react+ts+tailwind+vitest, add MODULE_MAP/HANDOFF"
```

---

### Task 1: ChannelSpec 类型 + 4 渠道注册

**Files:**
- Create: `src/channels/types.ts`, `src/channels/webtoon.ts`, `src/channels/tapas.ts`, `src/channels/x.ts`, `src/channels/instagram.ts`, `src/channels/index.ts`
- Test: `src/channels/index.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// src/channels/index.test.ts
import { describe, it, expect } from "vitest";
import { channels, getChannel } from "./index";

describe("channels registry", () => {
  it("有 4 个渠道", () => {
    expect(Object.keys(channels).sort()).toEqual(
      ["instagram", "tapas", "webtoon", "x"]
    );
  });
  it("webtoon 规格正确", () => {
    const c = getChannel("webtoon");
    expect(c.canvasWidth).toBe(800);
    expect(c.maxSegmentHeight).toBe(1280);
    expect(c.exporter).toBe("verticalSlice");
  });
  it("instagram 用 carousel 模式", () => {
    expect(getChannel("instagram").exporter).toBe("carouselPage");
  });
  it("每个渠道都有 seo.keyword", () => {
    Object.values(channels).forEach((c) => {
      expect(c.seo.keyword.length).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 2: 跑红**

Run: `npx vitest run src/channels/index.test.ts`
Expected: FAIL — 模块不存在。

- [ ] **Step 3: 实现**

```ts
// src/channels/types.ts
export interface ChannelSpec {
  id: string;
  label: string;
  canvasWidth: number;
  maxSegmentHeight: number;
  maxFileSize: number; // bytes
  format: "image/png" | "image/jpeg";
  exporter: "verticalSlice" | "carouselPage";
  seo: { keyword: string; title: string; description: string };
}
```

```ts
// src/channels/webtoon.ts
import type { ChannelSpec } from "./types";
export const webtoon: ChannelSpec = {
  id: "webtoon", label: "Webtoon",
  canvasWidth: 800, maxSegmentHeight: 1280,
  maxFileSize: 10 * 1024 * 1024, format: "image/png",
  exporter: "verticalSlice",
  seo: {
    keyword: "webtoon panel size",
    title: "Webtoon Panel Size & Free Slicer (2026) | ToonSlice",
    description: "Format and slice your comic to Webtoon-ready panels in your browser. No upload.",
  },
};
```

```ts
// src/channels/tapas.ts
import type { ChannelSpec } from "./types";
export const tapas: ChannelSpec = {
  id: "tapas", label: "Tapas",
  canvasWidth: 940, maxSegmentHeight: 1280,
  maxFileSize: 10 * 1024 * 1024, format: "image/png",
  exporter: "verticalSlice",
  seo: {
    keyword: "tapas comic dimensions",
    title: "Tapas Comic Dimensions & Free Slicer | ToonSlice",
    description: "Slice your comic to Tapas-ready episode panels in your browser. No upload.",
  },
};
```

```ts
// src/channels/x.ts
import type { ChannelSpec } from "./types";
export const x: ChannelSpec = {
  id: "x", label: "X / Twitter",
  canvasWidth: 1200, maxSegmentHeight: 4096,
  maxFileSize: 10 * 1024 * 1024, format: "image/png",
  exporter: "verticalSlice",
  seo: {
    keyword: "twitter comic image size",
    title: "X / Twitter Comic Image Size & Free Slicer | ToonSlice",
    description: "Resize and slice your comic for X / Twitter in your browser. No upload.",
  },
};
```

```ts
// src/channels/instagram.ts
import type { ChannelSpec } from "./types";
export const instagram: ChannelSpec = {
  id: "instagram", label: "Instagram",
  canvasWidth: 1080, maxSegmentHeight: 1350,
  maxFileSize: 10 * 1024 * 1024, format: "image/png",
  exporter: "carouselPage", // 导出本期后置(coming soon),规格页先占词
  seo: {
    keyword: "instagram comic carousel size",
    title: "Instagram Comic Carousel Size & Free Tool | ToonSlice",
    description: "Format your comic for Instagram carousel in your browser. No upload.",
  },
};
```

```ts
// src/channels/index.ts
import type { ChannelSpec } from "./types";
import { webtoon } from "./webtoon";
import { tapas } from "./tapas";
import { x } from "./x";
import { instagram } from "./instagram";

export const channels: Record<string, ChannelSpec> = { webtoon, tapas, x, instagram };

export function getChannel(id: string): ChannelSpec {
  const c = channels[id];
  if (!c) throw new Error(`unknown channel: ${id}`);
  return c;
}
```

> 注:规格数字(canvasWidth/maxSegmentHeight)为量级,上线前按各平台官方核实(见 HANDOFF 注意项)。

- [ ] **Step 4: 跑绿**

Run: `npx vitest run src/channels/index.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit + 更新 MODULE_MAP**

`MODULE_MAP.md` 加行:
```markdown
| 渠道注册 | src/channels/*.ts | 各渠道规格 + SEO 数据 | — | 加渠道 / 改规格 |
```
```bash
git add -A
git commit -m "feat(channels): ChannelSpec type + webtoon/tapas/x/instagram registry"
```

---

### Task 2: core/layout.ts — 布局计算(纯函数)

**Files:**
- Create: `src/core/layout.ts`
- Test: `src/core/layout.test.ts`

布局:所有图等比缩放到 `width`,垂直堆叠,相邻插 gutter,记录每图 y 区间与各 gutter 间隙区间。

- [ ] **Step 1: 写失败测试**

```ts
// src/core/layout.test.ts
import { describe, it, expect } from "vitest";
import { computeLayout } from "./layout";

const W = 800;

describe("computeLayout", () => {
  it("等比缩放到目标宽", () => {
    const lo = computeLayout([{ w: 1600, h: 2400 }], W, 0);
    expect(lo.width).toBe(800);
    expect(lo.items[0].height).toBe(1200); // 2400 * 800/1600
    expect(lo.totalHeight).toBe(1200);
  });
  it("两图 + gutter 总高正确", () => {
    const lo = computeLayout([{ w: 800, h: 1000 }, { w: 800, h: 600 }], W, 40);
    expect(lo.items[0].y).toBe(0);
    expect(lo.items[1].y).toBe(1040); // 1000 + 40
    expect(lo.totalHeight).toBe(1640);
    expect(lo.gutters).toEqual([{ start: 1000, end: 1040 }]);
  });
  it("无 gutter 时 gutters 为空", () => {
    const lo = computeLayout([{ w: 800, h: 500 }, { w: 800, h: 500 }], W, 0);
    expect(lo.gutters).toEqual([]);
  });
});
```

- [ ] **Step 2: 跑红**

Run: `npx vitest run src/core/layout.test.ts`
Expected: FAIL — computeLayout 未定义。

- [ ] **Step 3: 实现**

```ts
// src/core/layout.ts
export interface ImageSize { w: number; h: number; }
export interface LayoutItem { y: number; height: number; scale: number; }
export interface GutterGap { start: number; end: number; }
export interface Layout {
  width: number;
  totalHeight: number;
  items: LayoutItem[];       // 与输入图一一对应
  gutters: GutterGap[];      // 相邻图之间的间隙(gutter>0 时)
}

// 所有图等比缩放到 width,垂直堆叠,相邻插 gutter 像素间隙。
export function computeLayout(images: ImageSize[], width: number, gutter: number): Layout {
  const items: LayoutItem[] = [];
  const gutters: GutterGap[] = [];
  let y = 0;
  images.forEach((img, i) => {
    const scale = width / img.w;
    const height = Math.round(img.h * scale);
    items.push({ y, height, scale });
    y += height;
    if (gutter > 0 && i < images.length - 1) {
      gutters.push({ start: y, end: y + gutter });
      y += gutter;
    }
  });
  return { width, totalHeight: y, items, gutters };
}
```

- [ ] **Step 4: 跑绿**

Run: `npx vitest run src/core/layout.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit + 更新 MODULE_MAP**

`MODULE_MAP.md` 加行:
```markdown
| 布局 | src/core/layout.ts | 等比缩放 + 堆叠 + gutter 坐标 | — | 改对齐 / 缩放策略 |
```
```bash
git add -A
git commit -m "feat(core): computeLayout — scale to width, stack, gutter gaps"
```

---

### Task 3: core/slice.ts — 切片(gutter 优先)

**Files:**
- Create: `src/core/slice.ts`
- Test: `src/core/slice.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// src/core/slice.test.ts
import { describe, it, expect } from "vitest";
import { sliceSegments } from "./slice";

describe("sliceSegments", () => {
  it("范围内有 gutter → 切点落 gutter 中点", () => {
    // 总高 3000,maxH 1280,gutter 间隙 [1000,1040] 与 [2000,2040]
    const segs = sliceSegments(3000, [{ start: 1000, end: 1040 }, { start: 2000, end: 2040 }], 1280);
    // 第一段切点 = 最靠后且 ≤1280 的 gutter 中点 = 1020
    expect(segs[0]).toEqual({ yStart: 0, yEnd: 1020 });
    expect(segs[1].yStart).toBe(1020);
    segs.forEach((s) => expect(s.yEnd - s.yStart).toBeLessThanOrEqual(1280));
  });
  it("范围内无 gutter → 硬切 maxH", () => {
    const segs = sliceSegments(2000, [], 1280);
    expect(segs[0]).toEqual({ yStart: 0, yEnd: 1280 });
    expect(segs[1]).toEqual({ yStart: 1280, yEnd: 2000 });
  });
  it("总高 ≤ maxH → 单段", () => {
    expect(sliceSegments(900, [], 1280)).toEqual([{ yStart: 0, yEnd: 900 }]);
  });
});
```

- [ ] **Step 2: 跑红**

Run: `npx vitest run src/core/slice.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现**

```ts
// src/core/slice.ts
import type { GutterGap } from "./layout";

export interface Segment { yStart: number; yEnd: number; }

// gutter 优先:每段目标 cursor+maxH,在 (cursor, cursor+maxH] 内找最靠后 gutter,
// 切点取其中点;无则硬切 cursor+maxH;末段按实际高。
export function sliceSegments(totalHeight: number, gutters: GutterGap[], maxH: number): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  while (cursor < totalHeight) {
    const limit = cursor + maxH;
    if (limit >= totalHeight) {
      segments.push({ yStart: cursor, yEnd: totalHeight });
      break;
    }
    const inRange = gutters.filter((g) => {
      const mid = (g.start + g.end) / 2;
      return mid > cursor && mid <= limit;
    });
    let cut: number;
    if (inRange.length > 0) {
      const last = inRange[inRange.length - 1];
      cut = (last.start + last.end) / 2;
    } else {
      cut = limit; // 硬切回退
    }
    segments.push({ yStart: cursor, yEnd: cut });
    cursor = cut;
  }
  return segments;
}
```

- [ ] **Step 4: 跑绿**

Run: `npx vitest run src/core/slice.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit + 更新 MODULE_MAP**

```markdown
| 切片 | src/core/slice.ts | gutter 优先分段 + 硬切回退 | layout(类型) | 改分段策略 |
```
```bash
git add -A
git commit -m "feat(core): sliceSegments — gutter-priority slicing with hard-cut fallback"
```

---

### Task 4: core/render.ts — 逐段 Canvas 渲染

**Files:**
- Create: `src/core/render.ts`
- Test: `src/core/render.test.ts`

逐段渲染:每段建宽 W、高 段高 的 canvas,填白,把与该段相交的图用 drawImage 裁剪绘入。测试用 `@napi-rs/canvas` 提供 canvas + 一个 mock ctx 验证 drawImage 参数。

- [ ] **Step 1: 写失败测试**

```ts
// src/core/render.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderSegment } from "./render";
import type { LayoutItem } from "./layout";

// 假图源(renderSegment 不关心真实像素,只用尺寸 + drawImage)
const fakeImg = (id: string) => ({ id }) as unknown as CanvasImageSource;

function mockCtx() {
  return {
    fillStyle: "",
    fillRect: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D & { drawImage: ReturnType<typeof vi.fn>; fillRect: ReturnType<typeof vi.fn> };
}

describe("renderSegment", () => {
  it("填白底 + 绘制相交的图(裁剪)", () => {
    const ctx = mockCtx();
    const items: LayoutItem[] = [
      { y: 0, height: 1000, scale: 0.5 },   // 图0:0..1000
      { y: 1040, height: 600, scale: 0.5 }, // 图1:1040..1640
    ];
    const sources = [fakeImg("a"), fakeImg("b")];
    const origSizes = [{ w: 1600, h: 2000 }, { w: 1600, h: 1200 }];
    // 段 [1020, 1640]:图0 末段 [1020,1000] 不相交;图1 全在内
    renderSegment(ctx, { yStart: 1020, yEnd: 1640 }, 800, items, sources, origSizes);

    // 白底
    expect((ctx as any).fillRect).toHaveBeenCalledWith(0, 0, 800, 620);
    // 只画了图1(图0 在 1020 以上,不相交)
    expect((ctx as any).drawImage).toHaveBeenCalledTimes(1);
    const args = (ctx as any).drawImage.mock.calls[0];
    // drawImage(img, sx,sy,sw,sh, dx,dy,dw,dh) → 索引 0..8
    expect(args[0]).toBe(sources[1]);
    // dy = 图1.y - yStart = 1040 - 1020 = 20(args[6])
    expect(args[6]).toBe(20);
    // dh = visBottom - visTop = 1640 - 1040 = 600(args[8])
    expect(args[8]).toBe(600);
  });
});
```

- [ ] **Step 2: 跑红**

Run: `npx vitest run src/core/render.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现**

```ts
// src/core/render.ts
import type { LayoutItem } from "./layout";
import type { Segment } from "./slice";
import type { ImageSize } from "./layout";

// 在 ctx 上渲染单段:白底 + 把落在 [yStart,yEnd) 的图(布局坐标)裁剪绘入。
// origSizes[i] 为图 i 原始像素尺寸;items[i] 为其布局位置(已缩放)。
export function renderSegment(
  ctx: CanvasRenderingContext2D,
  seg: Segment,
  width: number,
  items: LayoutItem[],
  sources: CanvasImageSource[],
  origSizes: ImageSize[]
): void {
  const segH = seg.yEnd - seg.yStart;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, segH);

  items.forEach((it, i) => {
    const top = it.y;
    const bottom = it.y + it.height;
    // 与本段相交区间(布局坐标)
    const visTop = Math.max(top, seg.yStart);
    const visBottom = Math.min(bottom, seg.yEnd);
    if (visBottom <= visTop) return; // 不相交

    // 源图裁剪(原始像素):布局→原图用 1/scale
    const invScale = origSizes[i].h / it.height; // = 1/scale(按高换算)
    const sx = 0;
    const sy = (visTop - top) * invScale;
    const sw = origSizes[i].w;
    const sh = (visBottom - visTop) * invScale;
    // 目标(段 canvas 坐标)
    const dx = 0;
    const dy = visTop - seg.yStart;
    const dw = width;
    const dh = visBottom - visTop;
    ctx.drawImage(sources[i], sx, sy, sw, sh, dx, dy, dw, dh);
  });
}
```

- [ ] **Step 4: 跑绿**

Run: `npx vitest run src/core/render.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit + 更新 MODULE_MAP**

```markdown
| 渲染 | src/core/render.ts | 逐段 canvas 绘制(裁剪 drawImage) | Canvas API, layout/slice 类型 | 改绘制 / 水印 |
```
```bash
git add -A
git commit -m "feat(core): renderSegment — per-segment canvas draw with source clipping"
```

---

### Task 5: exporters/verticalSlice.ts — 串联导出

**Files:**
- Create: `src/exporters/verticalSlice.ts`
- Test: `src/exporters/verticalSlice.test.ts`

串 layout + slice + render,对每段建真 canvas、渲染、toBlob,返回 Blob[]。测试在 jsdom 下 canvas.toBlob 不可用,故用 `@napi-rs/canvas` 注入 canvas 工厂(依赖注入,便于测试与浏览器切换)。

- [ ] **Step 1: 写失败测试**

```ts
// src/exporters/verticalSlice.test.ts
import { describe, it, expect } from "vitest";
import { createCanvas } from "@napi-rs/canvas";
import { exportVerticalSlice } from "./verticalSlice";
import { getChannel } from "../channels";

// canvas 工厂:返回 {canvas, ctx, toBlob}
const napiFactory = (w: number, h: number) => {
  const cv = createCanvas(w, h);
  return {
    ctx: cv.getContext("2d") as unknown as CanvasRenderingContext2D,
    toBlob: async () => new Blob([cv.toBuffer("image/png")], { type: "image/png" }),
  };
};

describe("exportVerticalSlice", () => {
  it("3000px 内容切成多段 blob", async () => {
    const spec = getChannel("webtoon"); // W=800, maxH=1280
    // 两张图缩放后各 1500px 高(原 1600x3000 → 800x1500),gutter 40 → 总高 3040
    const sources = [napiImg(1600, 3000), napiImg(1600, 3000)];
    const blobs = await exportVerticalSlice({
      sources: sources.map((s) => s.image),
      origSizes: sources.map((s) => ({ w: 1600, h: 3000 })),
      spec, gutter: 40, watermark: false,
      canvasFactory: napiFactory,
    });
    expect(blobs.length).toBeGreaterThanOrEqual(3); // 3040 / 1280 ≈ 3 段
    blobs.forEach((b) => expect(b.size).toBeGreaterThan(0));
  });
});

// 造一张纯色 napi 图
import { createCanvas as cc } from "@napi-rs/canvas";
function napiImg(w: number, h: number) {
  const cv = cc(w, h);
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#cccccc";
  ctx.fillRect(0, 0, w, h);
  return { image: cv as unknown as CanvasImageSource };
}
```

- [ ] **Step 2: 跑红**

Run: `npx vitest run src/exporters/verticalSlice.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现**

```ts
// src/exporters/verticalSlice.ts
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

// 串联布局→切片→逐段渲染→toBlob。watermark 暂以末段底部留空(Task 9 接 banner)。
export async function exportVerticalSlice(input: ExportInput): Promise<Blob[]> {
  const { sources, origSizes, spec, gutter, canvasFactory } = input;
  const layout = computeLayout(origSizes, spec.canvasWidth, gutter);
  const segments = sliceSegments(layout.totalHeight, layout.gutters, spec.maxSegmentHeight);

  const blobs: Blob[] = [];
  for (const seg of segments) {
    const h = seg.yEnd - seg.yStart;
    const handle = canvasFactory(spec.canvasWidth, h);
    renderSegment(handle.ctx, seg, spec.canvasWidth, layout.items, sources, origSizes);
    blobs.push(await handle.toBlob());
  }
  return blobs;
}
```

- [ ] **Step 4: 跑绿**

Run: `npx vitest run src/exporters/verticalSlice.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit + 更新 MODULE_MAP**

```markdown
| 导出策略 | src/exporters/verticalSlice.ts | 串联 layout+slice+render → Blob[] | core/* | 加导出模式 |
```
```bash
git add -A
git commit -m "feat(exporters): verticalSlice — layout+slice+render pipeline to blobs"
```

---

### Task 6: pack/zip.ts — JSZip 打包

**Files:**
- Create: `src/pack/zip.ts`
- Test: `src/pack/zip.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// src/pack/zip.test.ts
import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { packZip } from "./zip";

describe("packZip", () => {
  it("按顺序命名 panel_001.png 并打包", async () => {
    const blobs = [new Blob(["a"]), new Blob(["bb"]), new Blob(["ccc"])];
    const zipBlob = await packZip(blobs, "panel");
    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
    const names = Object.keys(zip.files).sort();
    expect(names).toEqual(["panel_001.png", "panel_002.png", "panel_003.png"]);
  });
});
```

- [ ] **Step 2: 跑红**

Run: `npx vitest run src/pack/zip.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现**

```ts
// src/pack/zip.ts
import JSZip from "jszip";

// 各段 blob 按 baseName_NNN.png 命名打包为单个 zip blob。
export async function packZip(blobs: Blob[], baseName: string): Promise<Blob> {
  const zip = new JSZip();
  blobs.forEach((b, i) => {
    const n = String(i + 1).padStart(3, "0");
    zip.file(`${baseName}_${n}.png`, b);
  });
  return zip.generateAsync({ type: "blob" });
}
```

- [ ] **Step 4: 跑绿**

Run: `npx vitest run src/pack/zip.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit + 更新 MODULE_MAP**

```markdown
| 打包 | src/pack/zip.ts | JSZip 命名打包下载 | JSZip | 改命名 / 格式 |
```
```bash
git add -A
git commit -m "feat(pack): packZip — name segments and zip via JSZip"
```

---

### Task 7: 浏览器平台胶水(canvas 工厂 / 图加载 / 下载)

**Files:**
- Create: `src/platform/browserCanvas.ts`, `src/platform/loadImage.ts`, `src/pack/download.ts`
- Test: `src/platform/loadImage.test.ts`

> 平台胶水依赖真实浏览器 API(图像解码、canvas.toBlob),jsdom 无法完整测;此处给最小可测点 + 实现,完整行为由 plan2 在 headless 浏览器实测覆盖。

- [ ] **Step 1: 写最小失败测试(校验逻辑可单测)**

```ts
// src/platform/loadImage.test.ts
import { describe, it, expect } from "vitest";
import { validateFile } from "./loadImage";

describe("validateFile", () => {
  it("拒绝非法类型", () => {
    const f = new File(["x"], "a.gif", { type: "image/gif" });
    expect(validateFile(f, 10 * 1024 * 1024)).toBe("UNSUPPORTED_TYPE");
  });
  it("拒绝超大文件", () => {
    const f = new File([new Uint8Array(11 * 1024 * 1024)], "a.png", { type: "image/png" });
    expect(validateFile(f, 10 * 1024 * 1024)).toBe("TOO_LARGE");
  });
  it("合法返回 null", () => {
    const f = new File(["x"], "a.png", { type: "image/png" });
    expect(validateFile(f, 10 * 1024 * 1024)).toBeNull();
  });
});
```

- [ ] **Step 2: 跑红**

Run: `npx vitest run src/platform/loadImage.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现三个胶水文件**

```ts
// src/platform/loadImage.ts
import type { ImageSize } from "../core/layout";

export type FileError = "UNSUPPORTED_TYPE" | "TOO_LARGE" | null;
const OK_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function validateFile(file: File, maxSize: number): FileError {
  if (!OK_TYPES.includes(file.type)) return "UNSUPPORTED_TYPE";
  if (file.size > maxSize) return "TOO_LARGE";
  return null;
}

export interface LoadedImage { image: HTMLImageElement; size: ImageSize; url: string; }

// File → 解码后的 HTMLImageElement + 原始尺寸。失败 reject('DECODE_FAILED')。
export function loadImage(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () =>
      resolve({ image: img, size: { w: img.naturalWidth, h: img.naturalHeight }, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("DECODE_FAILED")); };
    img.src = url;
  });
}
```

```ts
// src/platform/browserCanvas.ts
import type { CanvasFactory } from "../exporters/verticalSlice";

// 浏览器 canvas 工厂,注入给 exporter。
export const browserCanvasFactory: CanvasFactory = (w, h) => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  return {
    ctx,
    toBlob: () =>
      new Promise<Blob>((resolve, reject) =>
        cv.toBlob((b) => (b ? resolve(b) : reject(new Error("TOBLOB_FAILED"))), "image/png")
      ),
  };
};
```

```ts
// src/pack/download.ts
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

- [ ] **Step 4: 跑绿**

Run: `npx vitest run src/platform/loadImage.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit + 更新 MODULE_MAP**

```markdown
| 平台胶水 | src/platform/*.ts | 浏览器图解码 / canvas 工厂 / 文件校验 | Canvas/DOM API | 改浏览器交互 |
| 下载 | src/pack/download.ts | Blob 触发下载 | DOM API | 改下载行为 |
```
```bash
git add -A
git commit -m "feat(platform): browser canvas factory, image loader+validate, download"
```

---

### Task 8: Workspace 组件(工具核心 UI)

**Files:**
- Create: `src/ui/Workspace.tsx`, `src/ui/useExport.ts`
- Test: `src/ui/useExport.test.ts`(导出编排可单测,注入工厂)

- [ ] **Step 1: 写失败测试(导出编排)**

```ts
// src/ui/useExport.test.ts
import { describe, it, expect, vi } from "vitest";
import { runExport } from "./useExport";
import { getChannel } from "../channels";
import { createCanvas } from "@napi-rs/canvas";

const factory = (w: number, h: number) => {
  const cv = createCanvas(w, h);
  return {
    ctx: cv.getContext("2d") as unknown as CanvasRenderingContext2D,
    toBlob: async () => new Blob([cv.toBuffer("image/png")], { type: "image/png" }),
  };
};

describe("runExport", () => {
  it("产出 zip blob", async () => {
    const napi = createCanvas(1600, 2000);
    const loaded = [{ image: napi as unknown as CanvasImageSource, size: { w: 1600, h: 2000 } }];
    const zip = await runExport(loaded, getChannel("webtoon"), 40, false, factory);
    expect(zip.size).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 跑红**

Run: `npx vitest run src/ui/useExport.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现编排 + 组件**

```ts
// src/ui/useExport.ts
import type { ChannelSpec } from "../channels/types";
import type { ImageSize } from "../core/layout";
import { exportVerticalSlice, type CanvasFactory } from "../exporters/verticalSlice";
import { packZip } from "../pack/zip";

export interface LoadedLike { image: CanvasImageSource; size: ImageSize; }

// 编排:加载好的图 → 段 blob → zip blob。注入 canvasFactory 便于测试/浏览器切换。
export async function runExport(
  loaded: LoadedLike[],
  spec: ChannelSpec,
  gutter: number,
  watermark: boolean,
  canvasFactory: CanvasFactory
): Promise<Blob> {
  const blobs = await exportVerticalSlice({
    sources: loaded.map((l) => l.image),
    origSizes: loaded.map((l) => l.size),
    spec, gutter, watermark, canvasFactory,
  });
  return packZip(blobs, "panel");
}
```

```tsx
// src/ui/Workspace.tsx
import { useState } from "react";
import type { ChannelSpec } from "../channels/types";
import { channels } from "../channels";
import { loadImage, validateFile, type LoadedImage } from "../platform/loadImage";
import { browserCanvasFactory } from "../platform/browserCanvas";
import { runExport } from "./useExport";
import { downloadBlob } from "../pack/download";

type Status = { kind: "idle" | "working" | "done" | "error"; msg?: string };

export function Workspace({ preset }: { preset: ChannelSpec }) {
  const [spec, setSpec] = useState<ChannelSpec>(preset);
  const [items, setItems] = useState<LoadedImage[]>([]);
  const [gutter, setGutter] = useState(40);
  const [watermark, setWatermark] = useState(true);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const carouselComingSoon = spec.exporter === "carouselPage";

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const next: LoadedImage[] = [];
    for (const f of Array.from(files)) {
      const err = validateFile(f, spec.maxFileSize);
      if (err) { setStatus({ kind: "error", msg: `${f.name}: ${err}` }); continue; }
      try { next.push(await loadImage(f)); }
      catch { setStatus({ kind: "error", msg: `${f.name}: DECODE_FAILED` }); }
    }
    setItems((prev) => [...prev, ...next].slice(0, 30));
  }

  async function onExport() {
    if (items.length === 0 || carouselComingSoon) return;
    setStatus({ kind: "working" });
    try {
      const zip = await runExport(items, spec, gutter, watermark, browserCanvasFactory);
      downloadBlob(zip, `toonslice-${spec.id}.zip`);
      setStatus({ kind: "done" });
    } catch (e) {
      setStatus({ kind: "error", msg: (e as Error).message });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 渠道切换 */}
      <select
        className="border rounded p-2 w-48"
        value={spec.id}
        onChange={(e) => setSpec(channels[e.target.value])}
      >
        {Object.values(channels).map((c) => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </select>

      {/* 拖拽 / 上传 */}
      <div
        className="border-2 border-dashed rounded p-8 text-center text-gray-500"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
      >
        {items.length === 0 ? "Drag comic panels here" : `${items.length} image(s)`}
        <div className="mt-2">
          <input type="file" multiple accept="image/png,image/jpeg,image/webp"
                 onChange={(e) => addFiles(e.target.files)} />
        </div>
      </div>

      {/* gutter + 水印 */}
      <label>Gutter: {gutter}px
        <input type="range" min={0} max={400} value={gutter}
               onChange={(e) => setGutter(Number(e.target.value))} className="w-full" />
      </label>
      <label className="flex gap-2 items-center">
        <input type="checkbox" checked={watermark}
               onChange={(e) => setWatermark(e.target.checked)} />
        Viral watermark
      </label>

      {/* CSS 即时预览 */}
      <div className="border rounded p-2 max-h-96 overflow-auto bg-gray-50"
           style={{ width: 240 }}>
        <div className="flex flex-col items-center">
          {items.map((it, i) => (
            <img key={i} src={it.url} alt=""
                 style={{ width: "100%", marginBottom: i < items.length - 1 ? gutter / 4 : 0 }} />
          ))}
        </div>
      </div>

      {/* 导出 */}
      <button
        disabled={items.length === 0 || carouselComingSoon || status.kind === "working"}
        onClick={onExport}
        className="bg-black text-white rounded p-3 disabled:opacity-40"
      >
        {carouselComingSoon ? "Carousel export — coming soon"
          : status.kind === "working" ? "Exporting…" : "Export ZIP"}
      </button>

      {status.kind === "error" && <p className="text-red-600">{status.msg}</p>}
      {status.kind === "done" && <SuccessPanel spec={spec} />}
    </div>
  );
}

// 成功态(MVP:Ko-fi + 静态联盟 + 交叉渠道)。完整三元素细化由变现实现 spec 后补。
function SuccessPanel({ spec }: { spec: ChannelSpec }) {
  return (
    <div className="border rounded p-4 bg-green-50 flex flex-col gap-2">
      <p className="font-semibold">Done! Your {spec.label} panels are downloading.</p>
      <a className="underline" href="https://ko-fi.com/toonslice" target="_blank" rel="noopener">
        ☕ Found this useful? Buy me a coffee
      </a>
      <a className="underline" href="/go/clip-studio" rel="sponsored nofollow">
        🎨 Next: color your comic with Clip Studio Paint
      </a>
      <p className="text-sm">Also posting to Instagram? Try the IG version (coming soon).</p>
    </div>
  );
}
```

- [ ] **Step 4: 跑绿**

Run: `npx vitest run src/ui/useExport.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit + 更新 MODULE_MAP**

```markdown
| 工具 UI | src/ui/Workspace.tsx | 拖拽/渠道/gutter/水印/预览/导出/成功态 | platform, exporters, pack | 改交互 |
| 导出编排 | src/ui/useExport.ts | 加载图→段 blob→zip | exporters, pack | 改导出流程 |
```
```bash
git add -A
git commit -m "feat(ui): Workspace tool + export orchestration + success panel"
```

---

### Task 9: 渠道路由页(落地即预配置工具 + SEO + 规格说明)

**Files:**
- Create: `src/ui/ChannelPage.tsx`, `src/App.tsx`(改路由), `src/main.tsx`(挂 Router)
- Modify: `index.html`(基础 meta)

- [ ] **Step 1: 实现 ChannelPage + 路由**

```tsx
// src/ui/ChannelPage.tsx
import { useEffect } from "react";
import type { ChannelSpec } from "../channels/types";
import { Workspace } from "./Workspace";

// 落地即工具,预锁渠道;下方规格说明(SEO 厚内容)+ 联盟位。
export function ChannelPage({ spec }: { spec: ChannelSpec }) {
  useEffect(() => {
    document.title = spec.seo.title;
    setMeta("description", spec.seo.description);
  }, [spec]);

  return (
    <main className="max-w-3xl mx-auto p-4 flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold">{spec.label} comic formatter & slicer</h1>
        <p className="text-gray-600">
          Slice and resize your comic to {spec.label}-ready panels — in your browser, no upload.
        </p>
      </header>

      <Workspace preset={spec} />

      {/* 规格说明:SEO 厚内容(原创,满足 AdSense)。占位文案,上线前补足 ≥300 词。 */}
      <section className="prose">
        <h2>{spec.label} image specs</h2>
        <ul>
          <li>Recommended width: {spec.canvasWidth}px</li>
          <li>Max panel height: {spec.maxSegmentHeight}px</li>
          <li>Format: PNG</li>
        </ul>
        <p>
          {spec.label} renders long-form comics as vertically stacked panels. ToonSlice
          aligns every image to {spec.canvasWidth}px wide and slices at gutter gaps so panels
          break cleanly. (Expand to a full guide before launch — see monetization spec §5.)
        </p>
      </section>

      {/* 联盟位(静态)— rel=sponsored nofollow + FTC 披露 */}
      <aside className="text-sm text-gray-500 border-t pt-4">
        <p>Recommended gear for comic artists:</p>
        <a href="/go/xppen" rel="sponsored nofollow" className="underline">XP-Pen drawing tablets</a>
        <p className="mt-2 italic">Disclosure: links above are affiliate links; we may earn a commission.</p>
      </aside>
    </main>
  );
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
  el.setAttribute("content", content);
}
```

```tsx
// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { channels } from "./channels";
import { ChannelPage } from "./ui/ChannelPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ChannelPage spec={channels.webtoon} />} />
      <Route path="/webtoon" element={<ChannelPage spec={channels.webtoon} />} />
      <Route path="/tapas" element={<ChannelPage spec={channels.tapas} />} />
      <Route path="/x" element={<ChannelPage spec={channels.x} />} />
      <Route path="/instagram" element={<ChannelPage spec={channels.instagram} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

```tsx
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter><App /></BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 2: 手动验证路由**

Run: `npm run dev`,访问 `/`、`/webtoon`、`/tapas`、`/x`、`/instagram`。
Expected: 各页标题随渠道变;IG 页导出按钮显示 "coming soon"。

- [ ] **Step 3: Commit + 更新 MODULE_MAP**

```markdown
| 渠道页 | src/ui/ChannelPage.tsx | 落地工具+规格说明+联盟位+SEO meta | Workspace | 改落地页/SEO |
| 路由 | src/App.tsx | 渠道路由映射 | channels, ChannelPage | 加渠道页 |
```
```bash
git add -A
git commit -m "feat(ui): channel landing pages with preset tool, specs, SEO meta, routing"
```

---

### Task 10: 边界校验收尾 + HANDOFF 交接

**Files:**
- Create: `src/core/limits.ts`, `src/core/limits.test.ts`
- Modify: `MODULE_MAP.md`, `HANDOFF.md`

- [ ] **Step 1: 写失败测试(总高上限)**

```ts
// src/core/limits.test.ts
import { describe, it, expect } from "vitest";
import { checkTotalHeight } from "./limits";

describe("checkTotalHeight", () => {
  it("超 30000px 报错", () => {
    expect(checkTotalHeight(30001)).toBe("TOO_TALL");
  });
  it("正常返回 null", () => {
    expect(checkTotalHeight(5000)).toBeNull();
  });
});
```

- [ ] **Step 2: 跑红**

Run: `npx vitest run src/core/limits.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 + 接入 Workspace**

```ts
// src/core/limits.ts
export const MAX_TOTAL_HEIGHT = 30000;
export function checkTotalHeight(h: number): "TOO_TALL" | null {
  return h > MAX_TOTAL_HEIGHT ? "TOO_TALL" : null;
}
```
在 `Workspace.tsx` 的 `onExport` 内,`runExport` 前先用 `computeLayout` 估总高并 `checkTotalHeight`;超限 setStatus error "TOO_TALL: reduce images"。

- [ ] **Step 4: 跑绿 + 全量回归**

Run: `npx vitest run`
Expected: 全部 PASS。

- [ ] **Step 5: 收尾 MODULE_MAP + HANDOFF**

补 `MODULE_MAP.md`:
```markdown
| 上限 | src/core/limits.ts | 总高上限校验 | — | 改防护阈值 |
```

写满 `HANDOFF.md`:
```markdown
# ToonSlice Plan1 → Plan2 交接

## 已完成
- 核心引擎 layout/slice/render 全单测覆盖
- exporters/verticalSlice 串联导出(注入 canvasFactory)
- pack/zip + download
- 平台胶水(浏览器 canvas / 图解码 / 校验)
- Workspace 工具 UI + 渠道路由页(/、/webtoon、/tapas、/x、/instagram)
- 成功态(Ko-fi + 静态联盟 + 交叉渠道)、边界校验、IG coming soon

## 已知缺口 / 未覆盖(需 Plan2 处理)
- 平台胶水(loadImage / browserCanvas / download)无法在 jsdom 完整测 → 需 headless 浏览器实测
- 水印 banner 仅预留,renderSegment 未实际绘制 banner 文本 → 待补
- 渠道规格说明文案为占位,未达 ≥300 词原创(AdSense 审核需补)
- 联盟链接 /go/* 为占位重定向,未接真实联盟 URL
- 规格数字(canvasWidth/maxSegmentHeight)未按平台官方最终核实

## 难点与注意
- renderSegment 的 source 裁剪用 invScale=origH/itemHeight,改缩放策略需同步
- exporter 注入 canvasFactory:测试用 @napi-rs/canvas,浏览器用 browserCanvasFactory
- 纯前端契约:导出全程不得有网络请求(Plan2 用网络面板断言)
```
```bash
git add -A
git commit -m "feat(core): total-height guard; finalize MODULE_MAP and HANDOFF"
```

---

## Plan 1 自检覆盖(对 MVP spec)

| spec 节 | 覆盖 task |
|---|---|
| §2 技术栈纯前端 | Task 0 |
| §3 数据流(CSS 预览 + canvas 导出) | Task 8 |
| §4.1 布局缩放 | Task 2 |
| §4.2 切片 | Task 3 |
| §4.3 逐段渲染 | Task 4 |
| §4.4 水印 | 预留(HANDOFF 标缺口,Plan2 补) |
| §4.5 打包 | Task 6 |
| §5 输入约束 | Task 7(校验)、Task 10(总高) |
| §6 错误处理 | Task 7、8、10 |
| §10 模块化 | Task 1–6 目录结构 |
| §11 模块地图 | 每 task 更新 |
| §12 UX/转化 | Task 8、9 |
