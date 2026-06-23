# ToonSlice UI 换肤设计

日期：2026-06-23
来源素材：`stitch_toonslice_ui_redesign_one/code.html` + `DESIGN.md`

## 背景

用户提供了一套 AI 生成的 UI mockup（`code.html` + `DESIGN.md`），希望迁移到当前
Vite + React + TS + Tailwind 项目。`code.html` 是纯静态展示页（假交互、Tailwind
CDN、品牌名 "PanelCut Pro"、无路由、无图片资源引用），不能直接接入；需要把其中的
设计系统（色板/字体/spacing/组件规范）和视觉结构迁移到现有真实功能组件上。

## 范围

**只换视觉层，不改业务逻辑。** 不做 dark mode（这次范围内排除，code.html 自带的
`dark:` 类全部忽略）。不新建 Privacy Policy / Terms of Service 页面。品牌名统一用
"ToonSlice"，不用 mockup 自带的 "PanelCut Pro"。

全站统一换肤：四个渠道页（`/webtoon` `/tapas` `/x` `/instagram`）共享同一套
`ChannelPage` + `Workspace`，改一次即全部生效。

### 不动的部分（逻辑层）

- `src/core/*`（layout / slice / render / limits）
- `src/exporters/*`、`src/pack/*`、`src/platform/*`
- `Workspace.tsx` 内的 state 和 handler：`addFiles` / `onExport` / `gutter` /
  `watermark` / `aspect` / `status`
- `App.tsx` 路由
- `ChannelPage.tsx` 现有的 spec reference 区块（"{label} image specs" SEO 长文）
  和 affiliate slot（XP-Pen 占位链接 + disclosure）—— 内容不改，只跟着新排版规范
  微调样式

### 动的部分（视觉层）

- `tailwind.config.js`：合并 `DESIGN.md` 的 colors / fontFamily / fontSize /
  borderRadius / spacing token 到 `theme.extend`
- `index.html`：新增 Google Fonts CDN `<link>`（Sora / Inter / JetBrains Mono +
  Material Symbols Outlined）
- 新增组件：`Header.tsx` / `Hero.tsx` / `TrustBar.tsx` / `HowItWorks.tsx` /
  `Footer.tsx`
- `Workspace.tsx` / `ChannelPage.tsx` 内部 JSX 结构和 className 重写

## 视觉结构（按页面顺序）

### 1. Header

- Logo + 四渠道真实链接（Webtoon / Tapas / X / Instagram），当前页对应渠道高亮
  — 替换 mockup 原有的无关占位 nav（"Formatter / Slicer / Resize"）
- 去掉 mockup 的 "Start Cutting" CTA 按钮（无目标，纯装饰）和账号图标（项目无账号
  系统）

### 2. Hero

直接复用 `ChannelPage.tsx` 现有动态文案，套 headline-lg 样式：

```
<h1>{spec.label} comic formatter & slicer</h1>
<p>Slice and resize your comic to {spec.label}-ready panels — in your browser, no upload.</p>
```

### 3. Workspace 主体

**左 2/3 — Drop zone**
套 code.html 虚线框视觉（icon + 提示文案 + "Select Files"）。已上传图片后，占位
文案替换为缩略图堆叠预览（复用现有 CSS preview 逻辑，套 Cards Asset Gallery 样式：
图片 + 下方文件名/序号）。`onDragOver` / `onDrop` 绑定保持在同一外层 DOM 节点，不
因换皮而挪位。

**右 1/3 — Sidebar，三块卡片**

1. Slicing Controls：渠道切换器（**保留原生 `<select>` 标签，只加样式，不重写为
   自定义 dropdown** —— 避免引入键盘导航/开合状态的新 bug 面）+ gutter slider +
   watermark checkbox + carousel aspect toggle（仅 `exporter === "carouselPage"`
   时显示）+ Export ZIP 按钮 + 错误提示。导出成功后 SuccessPanel（Ko-fi 链接）
   套新卡片样式，显示在本卡片下方。
2. Tech Specs Info Box：三行规格表，数据**动态读取当前 spec**
   （`canvasWidth` / `maxSegmentHeight` / `format`），不是 code.html 里硬编码的
   800/1280/PNG —— 否则四个渠道页会显示同一组假数据。
3. Functional Context 说明框：文案中的渠道名替换为 `spec.label` 动态值。

### 4. Trust bar + How it Works

两块都是通用固定文案（不分渠道），原样保留 code.html 内容：

- Trust bar：Private & Secure / Fast Processing / Webtoon Ready
- How it Works：Upload → Customize Slice → Download Zip 三步卡片

放在 Workspace 区域下方，Footer 之上。

### 5. Footer

- 四渠道真实链接（同 Header）
- "100% Client-side Processing" 说明保留（真实卖点）
- 去掉 Privacy Policy / Terms of Service 占位链接（无对应页面）
- 版权文案改为 "© ToonSlice"

Footer **之上**保留现有 `ChannelPage.tsx` 的 spec reference 区块和 affiliate
slot，内容不变，只跟视觉规范微调样式。

## 技术实现

- `tailwind.config.js` 扩展 `theme.extend`，把 `DESIGN.md` frontmatter 里的
  colors / typography / rounded / spacing token 原样合并进去，使 code.html 的
  class 名（如 `bg-surface-container-lowest`、`text-on-surface-variant`）可以
  直接复用
- `index.html` 增加 Google Fonts CDN `<link>`，不引入 Tailwind CDN script（保留
  本地 PostCSS 构建链路）
- 新增文件（`src/ui/` 目录下）：`Header.tsx`、`Hero.tsx`、`TrustBar.tsx`、
  `HowItWorks.tsx`、`Footer.tsx`

## 验收标准

1. `npm test` 27/27 通过（现有测试覆盖 `core`/`exporters`/`pack`，不测 UI 样式，
   换皮不应破坏它们）
2. `npm run dev` 手动验证：四个渠道页路由可访问、拖拽上传可用、gutter 滑块联动、
   watermark 勾选联动、carousel 渠道下 aspect toggle 正确显示/隐藏、导出 ZIP 下载
   成功、SuccessPanel 的 Ko-fi 链接可点击
3. 视觉上四个渠道页风格统一，Tech Specs Info Box 数字随渠道切换正确变化

## 明确排除（本次不做）

- Dark mode（技术不难，但范围内每个新组件都要双写样式，工时增加，列为后续任务）
- 新建 Privacy Policy / Terms of Service 页面
- 修改 affiliate slot 内容或 spec reference 区块文案
- 自定义 dropdown 组件替代原生 `<select>`
