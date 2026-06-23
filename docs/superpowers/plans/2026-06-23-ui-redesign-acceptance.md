# ToonSlice UI 换肤 — 验收计划

> 本文档给验收方（Sonnet 4.6）使用，用于检查实施方（DeepSeek V4 Pro）按
> `docs/superpowers/plans/2026-06-23-ui-redesign-implementation.md` 完成的工作。
> 对照设计文档：`docs/superpowers/specs/2026-06-23-ui-redesign-design.md`。

验收方式：**先跑自动化回归，再逐 Task 代码审查，最后手动 QA。三者都过才算收。**
任一项不过，记录成"打回项"（文件路径 + 行号 + 问题 + 应该是什么），整批退回实施方修，不要自己代为修改。

---

## 0. 自动化回归（5 分钟内出结果，先做）

```bash
npm test
```
**必须**输出 `Test Files  11 passed (11)` / `Tests  38 passed (38)`。少一个、多一个、或有 fail 都算不过——这是硬门槛，不用看代码就能判断。

```bash
npm run build
```
**必须**退出码 0，无 TypeScript 报错。

如果这两项任一不过，直接打回，不用往下看代码审查部分。

---

## 1. 逐 Task 代码审查

### Task 1 — `tailwind.config.js`

- [ ] 文件用的是 `export default {...}` ESM 写法（不是 `module.exports`），跟原文件风格一致
- [ ] `theme.extend.colors` 里能找到 `primary: "#0058be"`、`"surface-container-lowest": "#ffffff"`、`"on-surface": "#0b1c30"` 这几个 key（抽样核对，不用逐一比对全部 40+ 色值）
- [ ] `theme.extend.fontFamily` 里**没有** `headline-sm` 这个 key（这是 mockup 的已知 bug，不该被照抄进来）
- [ ] `theme.extend.spacing` 里有 `"toolbar-height": "48px"` 和 `"margin-page": "24px"`

### Task 2 — `index.html`

- [ ] 新增了两条 `<link rel="stylesheet" href="https://fonts.googleapis.com/...">`，一条含 `Material+Symbols+Outlined`，一条含 `Sora`/`Inter`/`JetBrains+Mono`
- [ ] **没有**引入 `<script src="https://cdn.tailwindcss.com...">`（绝对不能有 Tailwind CDN script，这会跟项目本地 PostCSS 构建冲突）
- [ ] 原有的 SEO meta（`<title>`、`og:*`、`twitter:*`、JSON-LD）一个没少

### Task 3 — `src/ui/Header.tsx`

- [ ] nav 链接是用 `channels`（从 `../channels` import）动态生成的四个真实渠道链接，**不是**写死的 "Formatter/Slicer/Resize" 占位文案
- [ ] 链接用的是 react-router `<Link to={...}>`，不是 `<a href="#">`
- [ ] 当前 active 渠道（`activeChannelId` 等于 `c.id`）有视觉区分（不同 className）
- [ ] **没有**"Start Cutting" CTA 按钮，**没有**账号图标按钮（design 明确要求去掉这两个无意义装饰元素）
- [ ] Logo 文案是 "ToonSlice"，不是 "PanelCut Pro"

### Task 4 — `src/ui/Hero.tsx`

- [ ] `label` 是 prop，标题/描述文案里用 `{label}` 插值，不是写死某个渠道名
- [ ] 文案内容跟原 `ChannelPage.tsx` 旧版一致："{label} comic formatter & slicer" / "Slice and resize your comic to {label}-ready panels — in your browser, no upload."（不应该是 mockup 原版的"Slice Your Comic for Webtoon in Seconds"这种写死 Webtoon 的文案）

### Task 5 — `src/ui/TrustBar.tsx`

- [ ] 三项内容（Private & Secure / Fast Processing / Webtoon Ready）跟设计文档一致，无 props（通用固定内容，不分渠道）

### Task 6 — `src/ui/HowItWorks.tsx`

- [ ] 三步内容（Upload / Customize Slice / Download Zip）跟设计文档一致
- [ ] 用数组 `.map()` 渲染而不是三段重复 JSX（DRY，避免三份几乎一样的代码）

### Task 7 — `src/ui/Footer.tsx`

- [ ] 渠道链接动态生成（同 Header，来自 `channels`）
- [ ] **没有** Privacy Policy / Terms of Service 链接（design 明确要求去掉，因为没有对应页面）
- [ ] 版权文案是 "© ToonSlice"，不是 "© 2024 PanelCut Pro"

### Task 8 — `src/ui/Workspace.tsx`（最重要，逻辑不能丢）

逐字对照检查这几个函数体跟旧版（`git show HEAD~N:src/ui/Workspace.tsx` 或问实施方要 diff）**完全一致**，一个字符都不该变：
- [ ] `addFiles` 函数体
- [ ] `onExport` 函数体（包括 `computeLayout`/`checkTotalHeight`/`sliceSegments`/`checkCarouselPages`/`runExport`/`downloadZip` 调用链）
- [ ] 顶部 5 个 `useState` 声明（`spec`/`items`/`gutter`/`watermark`/`aspect`/`status`）的初始值不变（`gutter` 初始 40，`watermark` 初始 `true`，`aspect` 初始 `"4:5"`）

视觉/结构检查：
- [ ] 渠道切换器是原生 `<select>` 标签（**不是**自定义 dropdown 组件 / 不是用 div+onClick 模拟下拉）
- [ ] Gutter slider 的 `min`/`max` 是 `0`/`400`（不是 mockup 原版的 `0`/`100` —— 业务逻辑要求的范围不能被 mockup 的占位数值覆盖）
- [ ] Tech Specs Info Box 的三行数字是 `{spec.canvasWidth}` / `{spec.maxSegmentHeight}` / `{spec.format.split("/")[1].toUpperCase()}`，**不是**硬编码的 `800px`/`1280px`/`PNG` 字面量
- [ ] Carousel aspect toggle 用 `{isCarousel && (...)}` 条件渲染包裹，`isCarousel` 来自 `spec.exporter === "carouselPage"`
- [ ] `onDragOver`/`onDrop` 绑定在 Drop zone 的虚线框 div 上
- [ ] 已上传图片时显示缩略图列表（`items.map` 渲染 `<img src={it.url}>`），不是仍然显示固定的拖拽提示文案
- [ ] `SuccessPanel` 函数还在，Ko-fi 链接 URL 还是 `https://ko-fi.com/toonslice`

### Task 9 — `src/ui/ChannelPage.tsx`

- [ ] 引入并使用了 `Header`/`Hero`/`Workspace`/`TrustBar`/`HowItWorks`/`Footer` 六个组件
- [ ] `<Header activeChannelId={spec.id} />` 传参正确
- [ ] `<Hero label={spec.label} />` 传参正确
- [ ] **spec reference 区块**（"{spec.label} image specs" + 段落）内容跟旧版逐字一致，没有被改写或删减
- [ ] **affiliate slot**（XP-Pen 链接 + disclosure + `TODO(pre-launch)` 注释）内容跟旧版逐字一致，没有被改写或删减
- [ ] `setMeta` 函数和 `useEffect` 调用（`document.title`/`meta description`）还在且逻辑不变

---

## 2. 手动 QA（启动 `npm run dev`，浏览器实测）

逐项打勾，任一项失败记录"打回项"：

- [ ] `/`、`/webtoon`、`/tapas`、`/x`、`/instagram` 五个路径都能正常渲染，无 console error
- [ ] Header nav 在对应渠道页面上正确高亮当前渠道
- [ ] 切换右侧 Channel 下拉，Tech Specs Info Box 数字正确变化：

  | 渠道 | Width | Max Height | Format |
  |---|---|---|---|
  | Webtoon | 800px | 1280px | PNG |
  | Tapas | 940px | 1280px | PNG |
  | X / Twitter | 1200px | 4096px | PNG |
  | Instagram | 1080px | 1350px | PNG |

- [ ] 拖拽图片到虚线框区域，能正常加载并显示缩略图堆叠预览
- [ ] 点击"Select Files"，弹出系统文件选择框，选图后能正常加载（不是死按钮）
- [ ] 拖动 Gutter 滑块（0-400 范围），数值实时更新且联动预览图间距
- [ ] 勾选/取消 Viral watermark checkbox 正常响应
- [ ] 切到 Instagram 渠道时出现 Card Aspect 下拉（4:5 / 1:1），切到 Webtoon/Tapas/X 时**不出现**
- [ ] 上传图片后点击 Export ZIP，触发浏览器 zip 下载，过程中**没有任何网络请求**（开 DevTools Network 面板核对——这是项目硬契约，CLAUDE.md 明确要求）
- [ ] 下载完成后出现 SuccessPanel，Ko-fi 链接可点击且指向 `ko-fi.com/toonslice`
- [ ] Footer 四个渠道链接可点击跳转，**没有** Privacy Policy / Terms of Service 链接
- [ ] 整体视觉在四个渠道页风格统一（颜色/字体/间距一致），没有某页还是旧的黑白简陋样式没切换过来

---

## 3. 验收结论格式

全部通过：
> "验收通过。自动化回归 38/38 + build 通过，9 个 Task 代码审查无问题，手动 QA 11 项全过。"

有问题：按以下格式列出每个打回项，整批一次性反馈给实施方，不要逐个来回：
> `src/ui/Workspace.tsx:123` — Gutter slider max 还是 100，没改成 400，跟原逻辑的 `max={400}` 不一致。应改为：`max={400}`。
