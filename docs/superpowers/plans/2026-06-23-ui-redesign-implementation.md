# ToonSlice UI 换肤 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `stitch_toonslice_ui_redesign_one/code.html` 的视觉设计系统迁移到现有 ToonSlice React 应用，只换皮不改业务逻辑。

**Architecture:** 把 `DESIGN.md`/`code.html` 里的 Tailwind 设计 token 合并进 `tailwind.config.js`，新增 5 个纯展示组件（Header/Hero/TrustBar/HowItWorks/Footer），`Workspace.tsx` 和 `ChannelPage.tsx` 只重写 JSX 渲染部分，state/handler 逐字保留。

**Tech Stack:** Vite + React 18 + TypeScript + Tailwind 3，无新增 npm 依赖。

对应设计文档：`docs/superpowers/specs/2026-06-23-ui-redesign-design.md`

## Global Constraints

- 不改动 `src/core/*`、`src/exporters/*`、`src/pack/*`、`src/platform/*`、`App.tsx` 路由。
- `Workspace.tsx` 的 state（`spec`/`items`/`gutter`/`watermark`/`aspect`/`status`）和 handler（`addFiles`/`onExport`）逻辑逐字保留，只改 return 的 JSX。
- 不引入 `@testing-library/react` 或任何新 npm 依赖——本仓库目前没有组件渲染测试框架，不为这次换皮新增（YAGNI，且无任何现有测试渲染 `Workspace`/`ChannelPage`，已用 `grep -rl "Workspace\|ChannelPage" src --include="*.test.*"` 确认零命中）。
- 每个 UI 任务的验证手段是 `npm run build`（typecheck 通过）+ 任务 10 的手动 QA，不写组件单测。
- 渠道切换器（channel selector）必须保留原生 `<select>` 标签，不重写成自定义 dropdown 组件。
- 不做 dark mode，忽略 code.html 里所有 `dark:` 前缀的类。
- 品牌名统一用 "ToonSlice"，不用 mockup 自带的 "PanelCut Pro"。
- mockup 用了未定义的 `headline-sm` token（`DESIGN.md` 和 code.html 自己的 tailwind config 都没有定义它）——sidebar 卡片标题改用 `font-headline-md text-lg font-semibold` 代替，不照抄。
- 当前测试基线：`npm test` → **38/38 passed**（11 个文件）。每个任务后必须仍为 38/38，不能引入新失败也不能减少测试数。

---

### Task 1: 合并 Tailwind 设计 token

**Files:**
- Modify: `tailwind.config.js`

**Interfaces:**
- Produces：`bg-surface-container-lowest`、`text-on-surface-variant`、`text-primary`、`border-outline-variant`、`font-headline-lg`/`text-headline-lg`、`font-body-md`/`text-body-md`、`font-body-sm`/`text-body-sm`、`font-label-caps`/`text-label-caps`、`font-utility-mono`/`text-utility-mono`、`spacing.toolbar-height`、`spacing.margin-page`、`spacing.gutter`（Tailwind spacing token，与业务概念"gutter"无关，仅类名巧合）等 Tailwind 工具类，供 Task 3-9 的组件使用。

- [ ] **Step 1: 替换 `tailwind.config.js` 全文**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "inverse-on-surface": "#eaf1ff",
        "on-error-container": "#93000a",
        "tertiary-fixed": "#e0e3e5",
        "surface-variant": "#d3e4fe",
        "primary-container": "#2170e4",
        "primary-fixed": "#d8e2ff",
        "inverse-surface": "#213145",
        primary: "#0058be",
        "surface-bright": "#f8f9ff",
        "secondary-container": "#d5e0f8",
        surface: "#f8f9ff",
        "on-secondary-fixed": "#111c2d",
        "on-secondary-container": "#586377",
        "on-secondary-fixed-variant": "#3c475a",
        "surface-container-low": "#eff4ff",
        "secondary-fixed-dim": "#bcc7de",
        "surface-container-lowest": "#ffffff",
        "on-tertiary-fixed-variant": "#444749",
        "tertiary-container": "#727577",
        error: "#ba1a1a",
        background: "#f8f9ff",
        "surface-container": "#e5eeff",
        outline: "#727785",
        "error-container": "#ffdad6",
        "secondary-fixed": "#d8e3fb",
        "on-tertiary-fixed": "#191c1e",
        "inverse-primary": "#adc6ff",
        "on-primary-container": "#fefcff",
        "on-surface": "#0b1c30",
        "tertiary-fixed-dim": "#c4c7c9",
        "on-primary": "#ffffff",
        "on-tertiary-container": "#fbfdff",
        "surface-container-highest": "#d3e4fe",
        tertiary: "#595c5e",
        "on-error": "#ffffff",
        "surface-dim": "#cbdbf5",
        "on-primary-fixed": "#001a42",
        "on-primary-fixed-variant": "#004395",
        "surface-container-high": "#dce9ff",
        "surface-tint": "#005ac2",
        secondary: "#545f73",
        "on-secondary": "#ffffff",
        "outline-variant": "#c2c6d6",
        "on-surface-variant": "#424754",
        "primary-fixed-dim": "#adc6ff",
        "on-tertiary": "#ffffff",
        "on-background": "#0b1c30",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
      spacing: {
        gutter: "16px",
        "sidebar-width": "280px",
        "margin-page": "24px",
        "toolbar-height": "48px",
        unit: "4px",
      },
      fontFamily: {
        "headline-lg": ["Sora"],
        "body-md": ["Inter"],
        "headline-md": ["Sora"],
        "body-sm": ["Inter"],
        "label-caps": ["JetBrains Mono"],
        "utility-mono": ["JetBrains Mono"],
      },
      fontSize: {
        "headline-lg": [
          "32px",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "label-caps": [
          "12px",
          { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "500" },
        ],
        "utility-mono": ["11px", { lineHeight: "1.4", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: 验证构建通过**

Run: `npm run build`
Expected: 退出码 0，无 TypeScript / Tailwind 报错。

- [ ] **Step 3: 验证测试基线未变**

Run: `npm test`
Expected: `38 passed (38)`

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js
git commit -m "feat(ui): merge design system tokens into tailwind config"
```

---

### Task 2: 引入设计字体 + 图标字体

**Files:**
- Modify: `index.html`

**Interfaces:**
- Produces：全局可用的 CSS 字体族 `Sora`/`Inter`/`JetBrains Mono`，以及 `material-symbols-outlined` class（配合 `<span class="material-symbols-outlined">icon_name</span>` 使用），供 Task 3-9 组件使用。

- [ ] **Step 1: 在 `<meta name="viewport" ...>` 之后插入字体链接**

在 `index.html` 第 5 行（`<meta name="viewport" content="width=device-width, initial-scale=1.0" />`）之后插入：

```html

    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Sora:wght@600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: 验证构建产物包含字体链接**

Run: `npm run build && grep -c "fonts.googleapis.com" dist/index.html`
Expected: 输出 `2`

- [ ] **Step 3: 验证测试基线未变**

Run: `npm test`
Expected: `38 passed (38)`

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(ui): add Sora/Inter/JetBrains Mono and Material Symbols fonts"
```

---

### Task 3: 新增 Header 组件

**Files:**
- Create: `src/ui/Header.tsx`

**Interfaces:**
- Consumes：`channels` from `src/channels/index.ts`（`Record<string, ChannelSpec>`，每个 `ChannelSpec` 有 `id: string` 和 `label: string`）。
- Produces：`Header({ activeChannelId }: { activeChannelId: string })`，供 Task 9 的 `ChannelPage.tsx` 使用。

- [ ] **Step 1: 创建 `src/ui/Header.tsx`**

```tsx
import { Link } from "react-router-dom";
import { channels } from "../channels";

export function Header({ activeChannelId }: { activeChannelId: string }) {
  return (
    <header className="bg-surface-container-lowest w-full h-toolbar-height border-b border-outline-variant flex justify-between items-center px-margin-page shrink-0 relative z-50">
      <div className="flex items-center gap-6">
        <span className="font-headline-md text-headline-md font-bold text-on-surface">
          ToonSlice
        </span>
        <nav className="hidden md:flex gap-6 items-center h-full">
          {Object.values(channels).map((c) => (
            <Link
              key={c.id}
              to={`/${c.id}`}
              className={
                c.id === activeChannelId
                  ? "font-body-md text-body-md text-primary border-b-2 border-primary pb-1 h-full flex items-center px-2"
                  : "font-body-md text-body-md text-secondary h-full flex items-center hover:bg-secondary-container/50 transition-colors px-2"
              }
            >
              {c.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: 验证构建通过**

Run: `npm run build`
Expected: 退出码 0。

- [ ] **Step 3: 验证测试基线未变**

Run: `npm test`
Expected: `38 passed (38)`

- [ ] **Step 4: Commit**

```bash
git add src/ui/Header.tsx
git commit -m "feat(ui): add Header component with real channel nav links"
```

---

### Task 4: 新增 Hero 组件

**Files:**
- Create: `src/ui/Hero.tsx`

**Interfaces:**
- Produces：`Hero({ label }: { label: string })`，供 Task 9 使用。

- [ ] **Step 1: 创建 `src/ui/Hero.tsx`**

```tsx
export function Hero({ label }: { label: string }) {
  return (
    <section className="text-center flex flex-col items-center gap-6 max-w-3xl">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">
        {label} comic formatter &amp; slicer
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
        Slice and resize your comic to {label}-ready panels — in your browser,
        no upload.
      </p>
    </section>
  );
}
```

- [ ] **Step 2: 验证构建通过**

Run: `npm run build`
Expected: 退出码 0。

- [ ] **Step 3: Commit**

```bash
git add src/ui/Hero.tsx
git commit -m "feat(ui): add Hero component"
```

---

### Task 5: 新增 TrustBar 组件

**Files:**
- Create: `src/ui/TrustBar.tsx`

**Interfaces:**
- Produces：`TrustBar()`（无 props），供 Task 9 使用。

- [ ] **Step 1: 创建 `src/ui/TrustBar.tsx`**

```tsx
export function TrustBar() {
  return (
    <section className="w-full flex flex-wrap justify-center gap-12 border-t border-b border-outline-variant py-8 bg-surface-container-lowest">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">lock</span>
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-on-surface font-semibold">
            Private &amp; Secure
          </span>
          <span className="font-utility-mono text-utility-mono text-on-surface-variant">
            No server uploads
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">bolt</span>
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-on-surface font-semibold">
            Fast Processing
          </span>
          <span className="font-utility-mono text-utility-mono text-on-surface-variant">
            Instant browser slicing
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">
          check_circle
        </span>
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-on-surface font-semibold">
            Webtoon Ready
          </span>
          <span className="font-utility-mono text-utility-mono text-on-surface-variant">
            Perfect for Tapas/Webtoon
          </span>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 验证构建通过**

Run: `npm run build`
Expected: 退出码 0。

- [ ] **Step 3: Commit**

```bash
git add src/ui/TrustBar.tsx
git commit -m "feat(ui): add TrustBar component"
```

---

### Task 6: 新增 HowItWorks 组件

**Files:**
- Create: `src/ui/HowItWorks.tsx`

**Interfaces:**
- Produces：`HowItWorks()`（无 props），供 Task 9 使用。

- [ ] **Step 1: 创建 `src/ui/HowItWorks.tsx`**

```tsx
const STEPS = [
  {
    n: "01",
    icon: "upload_file",
    title: "Upload",
    body: "Drag and drop your long vertically scrolling comic pages.",
  },
  {
    n: "02",
    icon: "settings_overscan",
    title: "Customize Slice",
    body: "Set target width (e.g., 800px) and max height for slices.",
  },
  {
    n: "03",
    icon: "folder_zip",
    title: "Download Zip",
    body: "Get a perfectly organized ZIP file ready for upload.",
  },
];

export function HowItWorks() {
  return (
    <section className="w-full flex flex-col items-center gap-8">
      <h2 className="font-headline-md text-headline-md text-on-surface">
        How it Works
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="bg-surface-container-lowest border border-outline-variant p-6 rounded-lg shadow-sm flex flex-col items-start gap-4 relative overflow-hidden"
          >
            <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center font-utility-mono text-utility-mono text-on-surface font-bold absolute top-6 right-6">
              {s.n}
            </div>
            <span className="material-symbols-outlined text-3xl text-secondary">
              {s.icon}
            </span>
            <h3 className="font-body-md text-body-md text-on-surface font-semibold">
              {s.title}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 验证构建通过**

Run: `npm run build`
Expected: 退出码 0。

- [ ] **Step 3: Commit**

```bash
git add src/ui/HowItWorks.tsx
git commit -m "feat(ui): add HowItWorks component"
```

---

### Task 7: 新增 Footer 组件

**Files:**
- Create: `src/ui/Footer.tsx`

**Interfaces:**
- Consumes：`channels` from `src/channels/index.ts`。
- Produces：`Footer()`（无 props），供 Task 9 使用。

- [ ] **Step 1: 创建 `src/ui/Footer.tsx`**

```tsx
import { Link } from "react-router-dom";
import { channels } from "../channels";

export function Footer() {
  return (
    <footer className="bg-surface-container-low w-full py-8 border-t border-outline-variant shrink-0 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-page w-full max-w-7xl mx-auto gap-4">
        <div className="flex items-center gap-6">
          {Object.values(channels).map((c) => (
            <Link
              key={c.id}
              to={`/${c.id}`}
              className="font-label-caps text-label-caps text-on-surface hover:text-primary transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-6 justify-center">
          <span className="font-utility-mono text-utility-mono text-on-surface-variant">
            100% Client-side Processing
          </span>
        </div>
      </div>
      <div className="px-margin-page w-full max-w-7xl mx-auto text-center md:text-left">
        <span className="font-utility-mono text-utility-mono text-on-surface-variant">
          © ToonSlice
        </span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: 验证构建通过**

Run: `npm run build`
Expected: 退出码 0。

- [ ] **Step 3: Commit**

```bash
git add src/ui/Footer.tsx
git commit -m "feat(ui): add Footer component with real channel links"
```

---

### Task 8: 重写 Workspace.tsx 渲染部分

**Files:**
- Modify: `src/ui/Workspace.tsx`（全文替换，state/handler 逐字保留）

**Interfaces:**
- Consumes：Task 1 的 Tailwind token、Task 2 的 `material-symbols-outlined` 字体类。
- Produces：`Workspace({ preset }: { preset: ChannelSpec })`（签名不变），供 Task 9 使用。

- [ ] **Step 1: 用以下内容整体替换 `src/ui/Workspace.tsx`**

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
    <section className="w-full flex flex-col lg:flex-row gap-8 items-stretch relative">
      {/* Left: Drop zone */}
      <div className="flex-grow w-full lg:w-2/3">
        <div className="h-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-8 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
          <div
            className="w-full h-full min-h-[400px] border-2 border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center p-8 gap-4 bg-surface transition-colors duration-200 cursor-pointer hover:border-primary relative z-10"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            {items.length === 0 ? (
              <>
                <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-2 shadow-sm">
                  <span className="material-symbols-outlined text-4xl">
                    cut
                  </span>
                </div>
                <div className="text-center flex flex-col gap-2">
                  <p className="font-headline-md text-body-md text-on-surface font-semibold">
                    Drag &amp; Drop Comic Pages Here
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    or click to browse files (JPG, PNG, WebP)
                  </p>
                </div>
              </>
            ) : (
              <div className="w-full max-h-[500px] overflow-auto flex flex-col items-center gap-2 px-4">
                {items.map((it, i) => (
                  <div
                    key={i}
                    className="w-full max-w-xs flex flex-col items-center"
                  >
                    <img
                      src={it.url}
                      alt=""
                      className="w-full rounded border border-outline-variant"
                    />
                    <span className="font-utility-mono text-utility-mono text-on-surface-variant mt-1">
                      panel-{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <label className="mt-4 px-6 py-2 bg-primary text-on-primary rounded font-label-caps text-label-caps shadow-sm hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer">
              Select Files
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Right: Sidebar */}
      <aside className="w-full lg:w-1/3 flex flex-col gap-6 shrink-0">
        {/* Slicing Controls */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm flex flex-col gap-5">
          <h3 className="font-headline-md text-lg text-on-surface font-semibold border-b border-outline-variant pb-3">
            Slicing Controls
          </h3>

          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              Channel
            </span>
            <select
              className="border border-outline-variant rounded p-2 bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              value={spec.id}
              onChange={(e) => setSpec(channels[e.target.value])}
            >
              {Object.values(channels).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-3">
            <label className="font-label-caps text-label-caps text-on-surface-variant flex justify-between items-center">
              Gutter Adjustment
              <span className="font-utility-mono text-primary font-bold bg-primary-fixed/50 px-2 py-0.5 rounded">
                {gutter}px
              </span>
            </label>
            <input
              className="w-full accent-primary"
              max={400}
              min={0}
              type="range"
              value={gutter}
              onChange={(e) => setGutter(Number(e.target.value))}
            />
          </div>

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
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                Card Aspect
              </span>
              <select
                className="border border-outline-variant rounded p-2 bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                value={aspect}
                onChange={(e) => setAspect(e.target.value as CarouselAspect)}
              >
                <option value="4:5">4:5 (1080×1350)</option>
                <option value="1:1">1:1 (1080×1080)</option>
              </select>
            </label>
          )}

          <button
            disabled={items.length === 0 || status.kind === "working"}
            onClick={onExport}
            className="w-full mt-4 bg-primary text-on-primary px-4 py-3 rounded font-label-caps text-label-caps flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm active:scale-[0.98] disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-lg">
              folder_zip
            </span>
            {status.kind === "working" ? "Exporting…" : "Export ZIP"}
          </button>

          {status.kind === "error" && (
            <p className="text-error font-body-sm text-body-sm">
              {status.msg}
            </p>
          )}
          {status.kind === "done" && <SuccessPanel spec={spec} />}
        </div>

        {/* Tech Specs Info Box */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm flex flex-col gap-4">
          <h3 className="font-headline-md text-lg text-on-surface font-semibold flex items-center gap-2 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary text-xl">
              info
            </span>
            {spec.label} Image Specs
          </h3>
          <ul className="flex flex-col gap-3 font-body-sm text-body-sm text-on-surface-variant">
            <li className="flex justify-between border-b border-outline-variant/30 pb-2">
              <span>Recommended Width</span>
              <span className="font-utility-mono font-semibold text-on-surface">
                {spec.canvasWidth}px
              </span>
            </li>
            <li className="flex justify-between border-b border-outline-variant/30 pb-2">
              <span>Max Panel Height</span>
              <span className="font-utility-mono font-semibold text-on-surface">
                {spec.maxSegmentHeight}px
              </span>
            </li>
            <li className="flex justify-between pb-1">
              <span>Format</span>
              <span className="font-utility-mono font-semibold text-on-surface">
                {spec.format.split("/")[1].toUpperCase()}
              </span>
            </li>
          </ul>
        </div>

        {/* Functional Context */}
        <div className="bg-secondary-fixed border border-outline-variant/50 p-5 rounded-lg shadow-sm">
          <p className="font-body-sm text-body-sm text-on-secondary-container leading-relaxed">
            {spec.label} renders long-form comics as vertically stacked
            panels. ToonSlice aligns every image to {spec.canvasWidth}px wide
            and slices at gutter gaps so panels break cleanly.
          </p>
        </div>
      </aside>
    </section>
  );
}

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

- [ ] **Step 2: 验证构建通过**

Run: `npm run build`
Expected: 退出码 0。

- [ ] **Step 3: 验证测试基线未变**

Run: `npm test`
Expected: `38 passed (38)`

- [ ] **Step 4: Commit**

```bash
git add src/ui/Workspace.tsx
git commit -m "feat(ui): restyle Workspace with design system, preserve all logic"
```

---

### Task 9: 重写 ChannelPage.tsx 组合页面

**Files:**
- Modify: `src/ui/ChannelPage.tsx`（全文替换）

**Interfaces:**
- Consumes：Task 3-8 产出的 `Header`/`Hero`/`Workspace`/`TrustBar`/`HowItWorks`/`Footer`。
- Produces：`ChannelPage({ spec }: { spec: ChannelSpec })`（签名不变），`App.tsx` 路由不需要改动。

- [ ] **Step 1: 用以下内容整体替换 `src/ui/ChannelPage.tsx`**

```tsx
import { useEffect } from "react";
import type { ChannelSpec } from "../channels/types";
import { Workspace } from "./Workspace";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { TrustBar } from "./TrustBar";
import { HowItWorks } from "./HowItWorks";
import { Footer } from "./Footer";

// Landing page = tool pre-configured for one channel.
// Below the tool: spec reference (SEO deep content) + affiliate slot.
export function ChannelPage({ spec }: { spec: ChannelSpec }) {
  useEffect(() => {
    document.title = spec.seo.title;
    setMeta("description", spec.seo.description);
  }, [spec]);

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Header activeChannelId={spec.id} />

      <main className="flex-grow flex flex-col items-center justify-start pt-16 pb-24 px-margin-page w-full max-w-6xl mx-auto gap-16 relative z-10">
        <Hero label={spec.label} />

        <Workspace preset={spec} />

        <TrustBar />

        <HowItWorks />

        {/* Spec reference: SEO deep content. Placeholder copy — expand to ≥300 words before launch. */}
        <section className="prose w-full max-w-3xl">
          <h2>{spec.label} image specs</h2>
          <ul>
            <li>Recommended width: {spec.canvasWidth}px</li>
            <li>Max panel height: {spec.maxSegmentHeight}px</li>
            <li>Format: PNG</li>
          </ul>
          <p>
            {spec.label} renders long-form comics as vertically stacked panels.
            ToonSlice aligns every image to {spec.canvasWidth}px wide and slices
            at gutter gaps so panels break cleanly. (Expand to a full guide before
            launch — see monetization spec §5.)
          </p>
        </section>

        {/* Affiliate slot — rel=sponsored nofollow + FTC disclosure */}
        {/* TODO(pre-launch): /go/* are placeholders; wire to real affiliate URLs
            (XP-Pen / Amazon) after account approval. Until then they fall through
            App.tsx "*" → redirect home. See delivery report "上线前必补". */}
        <aside className="text-sm text-on-surface-variant border-t border-outline-variant pt-4 w-full max-w-3xl">
          <p>Recommended gear for comic artists:</p>
          <a
            href="/go/xppen"
            rel="sponsored nofollow"
            className="underline text-primary"
          >
            XP-Pen drawing tablets
          </a>
          <p className="mt-2 italic">
            Disclosure: links above are affiliate links; we may earn a
            commission.
          </p>
        </aside>
      </main>

      <Footer />
    </div>
  );
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
```

- [ ] **Step 2: 验证构建通过**

Run: `npm run build`
Expected: 退出码 0。

- [ ] **Step 3: 验证测试基线未变**

Run: `npm test`
Expected: `38 passed (38)`

- [ ] **Step 4: Commit**

```bash
git add src/ui/ChannelPage.tsx
git commit -m "feat(ui): compose ChannelPage with new Header/Hero/TrustBar/HowItWorks/Footer"
```

---

### Task 10: 最终回归 + 手动验证

**Files:**
- 无新文件，只跑验证。

- [ ] **Step 1: 跑完整测试套件**

Run: `npm test`
Expected: `Test Files  11 passed (11)` / `Tests  38 passed (38)`

- [ ] **Step 2: 跑生产构建**

Run: `npm run build`
Expected: 退出码 0，无 TS 报错。

- [ ] **Step 3: 启动 dev server 手动走查**

Run: `npm run dev`

逐项确认（在浏览器里操作）：
1. 访问 `/`、`/webtoon`、`/tapas`、`/x`、`/instagram` 五个路径，页面都能正常渲染，Header nav 对应渠道高亮。
2. 切换右侧 Channel 下拉，Tech Specs Info Box 三行数字随渠道变化（webtoon: 800/1280/PNG，tapas: 940/1280/PNG，x: 1200/4096/PNG，instagram: 1080/1350/PNG）。
3. 拖拽图片到左侧虚线框，能正常加载并显示缩略图堆叠预览。
4. 点击"Select Files"按钮，能弹出系统文件选择框并正常加载图片。
5. 拖动 Gutter 滑块，数值实时更新。
6. 勾选/取消 Viral watermark checkbox 正常响应。
7. 切到 Instagram 渠道，出现 Card Aspect 下拉（4:5 / 1:1），其他渠道不显示。
8. 上传图片后点击 Export ZIP，浏览器触发 zip 下载，下载完成后显示 SuccessPanel + Ko-fi 链接。
9. Footer 的四个渠道链接可点击跳转，无 Privacy Policy / Terms of Service 链接。

- [ ] **Step 4: 确认无遗留问题后, 本计划全部任务完成**

无需额外 commit（Task 1-9 已分别提交）。
