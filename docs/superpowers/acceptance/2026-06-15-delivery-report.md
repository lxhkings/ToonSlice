# ToonSlice MVP 交付报告

日期:2026-06-15 · 分支:`plan2-accept` · 验收方:Opus 4.8

## 验收结果

### spec §9 八条

| # | 标准 | 验法 | 结果 |
|---|---|---|---|
| 1 | `npm run dev` 起纯前端 | 启动无后端进程 | ✅ 通过 |
| 2 | 拖/传图、重排、选渠道、调 gutter、切水印、CSS 预览 | A2 浏览器实测 | ⚠️ 部分:传图/选渠道/gutter/水印/CSS 预览 ✅;**重排(reorder)未实现**(append-only,见下"上线前必补")|
| 3 | Export ZIP 本地分段,宽=渠道宽,段高≤渠道段高,切点落 gutter,无上传 | A2 + A4 | ✅ 通过(零网络 + 段连续性/缩放像素核)|
| 4 | 宽不一图等比缩放到渠道宽 | A4 像素核 | ✅ 通过(1600 与 800 宽 → 段宽均 800,前者高减半)|
| 5 | 水印开末段底含英文 banner | A3 实绘 + 单测 | ✅ 通过(`renderSegment` 绘 "Formatted by ToonSlice.com",render 单测断言)|
| 6 | 非法输入英文提示 | A5 | ✅ 通过(UNSUPPORTED_TYPE / TOO_LARGE / TOO_TALL / 禁用态)|
| 7 | build 产物纯静态无后端依赖 | A6 | ✅ 通过(dist/ = html+css+js;grep 后端库 = clean)|
| 8 | TDD 全过 | A0 | ✅ 通过(23 tests / 10 files green)|

**七条通过,§9.2 重排功能为唯一缺口(非阻断核心卖点)。**

### 零上传卖点
已 headless 实测(dev + preview 两次):导出全程**零网络请求**,图像不离浏览器。证据见 `zero-upload-evidence.md` + `zero-upload-webtoon.png`。

### 测试
27 passed(10 files)。Plan2 新增:watermark layout/render 单测、`verticalSlice.integration.test.ts`(段连续性 + 缩放正确性 + watermark e2e 三例)。

### 终审发现并修复的两处 Critical
- **预检高度漏传 watermark**:`Workspace.onExport` 预检 `computeLayout` 未传 watermark,水印开时 30000px 防护少算 60px → 已修(传入 watermark)。
- **banner 被硬切割**:`sliceSegments` 不感知 banner,webtoon 内容高 ~1220–1280px 时硬切点落进 banner → 已修(layout 在 banner 顶插零宽 gutter 强制干净切点,banner 永不被切;新增 e2e 断言覆盖)。

## Plan2 改动
- `feat(accept): watermark banner render`(29d93d9)— HANDOFF 缺口②消除
- `refactor(accept): extract watermark constants`(a35d502)
- `test(accept): segment continuity and scaling correctness`(6600261)
- `test(accept): zero-upload + edge-case headless evidence; mark affiliate TODOs`(c11420c)
- `docs(accept): MVP delivery report`(b0ef7a4)
- `fix(accept): watermark height guard + slice-aware banner; derive baseline; e2e watermark test`(e657116)

## 上线前必补(非阻断 MVP 交付)
- **重排(reorder)**:当前上传 append-only,无拖拽排序。spec §9.2 要求,需补。
- 渠道规格文案扩至 ≥300 词原创(AdSense 审核)— 现 `ChannelPage.tsx` 占位 + TODO 注释。
- 联盟 `/go/*` 接真实 URL(XP-Pen / Clip Studio / Amazon 账号申请后)— 现占位,fall through `App.tsx "*"` → 跳首页;已加 TODO 注释。
- 规格数字(canvasWidth / maxSegmentHeight)按各平台官方最终核实。
- IG carousel 导出(现 "coming soon" 禁用,后置一刷,见变现 spec)。

## 部署
纯静态 `dist/`,可挂 Vercel / Cloudflare Pages,无后端依赖。
