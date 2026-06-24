# 导出格式与质量控制 — 验收计划

> 本文档给验收方使用，用于检查实施方按
> `docs/superpowers/plans/2026-06-23-export-format-quality-implementation.md` 完成的工作。
> 对照设计文档：`docs/superpowers/specs/2026-06-23-export-format-quality-design.md`。

验收方式：**先跑自动化回归，再逐 Task 代码审查，最后手动 QA。三者都过才算收。**
任一项不过，记录成"打回项"（文件路径 + 行号 + 问题 + 应该是什么），整批退回实施方修，不要自己代为修改。

---

## 0. 自动化回归（先做，几秒出结果）

```bash
npm test
```
**必须**输出 `Test Files  12 passed (12)` / `Tests  41 passed (41)`。少一个、多一个、或有 fail 都算不过——这是硬门槛，不用看代码就能判断。基线（改动前）是 11 文件 / 38 测试，本次净增 1 个文件（`browserCanvas.test.ts`）+ 3 个测试（`browserCanvas.test.ts` 1 个、`zip.test.ts` 新增 1 个、`useExport.test.ts` 新增 1 个）。

```bash
npx tsc -b --noEmit
```
**必须**退出码 0，无 TypeScript 报错。

```bash
npm run build
```
**必须**退出码 0，`dist/` 正常生成。

如果以上任一项不过，直接打回，不用往下看代码审查部分。

---

## 1. 逐 Task 代码审查

### Task 1 — `src/exporters/verticalSlice.ts`

- [ ] 新增 `export type ExportFormat = "image/png" | "image/jpeg";`
- [ ] `CanvasFactory` 类型签名是 `(w: number, h: number, format: ExportFormat, quality: number) => CanvasHandle`（4 个参数，不是原来的 2 个）
- [ ] `ExportInput` 接口新增 `format: ExportFormat` 和 `quality: number` 两个**必填**字段（不是 optional `?:`）
- [ ] `exportVerticalSlice` 函数体里 `canvasFactory(spec.canvasWidth, h, format, quality)` —— 确认 `format`/`quality` 真的传进去了，不是只加了类型字段但调用处忘了传
- [ ] `src/exporters/verticalSlice.test.ts` 的调用对象里加了 `format: "image/jpeg", quality: 0.9`
- [ ] `core/layout.ts`、`core/slice.ts`、`core/render.ts` 三个文件**完全没有改动**（`git diff` 确认零改动）

### Task 2 — `src/exporters/carouselSlice.ts`

- [ ] `import type { CanvasFactory, ExportFormat } from "./verticalSlice";`（从 verticalSlice 复用类型，不是自己重新定义一份）
- [ ] `CarouselExportInput` 新增 `format: ExportFormat`、`quality: number` 必填字段
- [ ] `exportCarouselSlice` 函数体里 `canvasFactory(spec.canvasWidth, pageHeight, format, quality)`
- [ ] `src/exporters/carouselSlice.test.ts` 里 **4 处** `exportCarouselSlice({...})` 调用全部加了 `format`/`quality`（不是只加了 1-2 处漏了剩下的）

### Task 3 — `src/platform/browserCanvas.ts`

- [ ] `browserCanvasFactory` 函数签名是 `(w, h, format, quality) => {...}`
- [ ] `cv.toBlob(cb, format, quality)` —— 确认第二、三参数用的是传入的 `format`/`quality`，**不是**还残留硬编码字符串 `"image/png"`
- [ ] 新文件 `src/platform/browserCanvas.test.ts` 存在，用 `vi.spyOn(document, "createElement")` mock 出假 canvas 来断言 `toBlob` 收到的实参，**不依赖** jsdom 真实 canvas 支持（这个项目没装 `canvas` npm 包，jsdom 原生 `getContext("2d")` 会返回 null，如果测试没 mock 直接用真实 DOM canvas 会跑不过或者是假阳性）

### Task 4 — `src/pack/zip.ts`

- [ ] `packZip` 签名新增第三个**必填**参数 `format: ExportFormat`，并 `import type { ExportFormat } from "../exporters/verticalSlice";`
- [ ] 扩展名逻辑：`const ext = format === "image/jpeg" ? "jpg" : "png";`，文件名是 `${baseName}_${n}.${ext}`
- [ ] `src/pack/zip.test.ts` 两个测试：PNG 一个、JPEG 一个，断言文件名分别以 `.png`/`.jpg` 结尾

### Task 5 — `src/ui/useExport.ts`

- [ ] `runExport` 新签名末尾两个新参数有默认值：`format: ExportFormat = "image/jpeg", quality: number = 0.9`（**必须**有默认值，否则旧调用方式会编译报错或运行时拿到 `undefined` 传进 canvas 管线）
- [ ] 返回类型从裸 `Promise<ArrayBuffer>` 改成 `Promise<ExportResult>`（`{ buf: ArrayBuffer; sizes: number[] }`）
- [ ] `sizes` 是 `blobs.map((b) => b.size)`，顺序跟 zip 内文件序号一致
- [ ] carousel 分支和默认分支都把 `format`/`quality` 传进了各自的 `exportCarouselSlice`/`exportVerticalSlice` 调用，且最后统一调用同一个 `packZip(blobs, baseName, format)`（不是两个分支各自重复写一遍 packZip 调用）
- [ ] `src/ui/useExport.test.ts` 三个 describe 块都存在：原有两个测试改成解构 `{ buf, sizes }`（不是仍然 `const buf = await runExport(...)`），新增一个测试用自定义 factory 捕获参数，断言默认走 `["image/jpeg", 0.9]`

### Task 6 — `src/ui/Workspace.tsx`

- [ ] `X_EXPORT_SIZE_LIMIT_BYTES = 5 * 1024 * 1024` 定义在组件外部（模块级常量），不是每次渲染重新创建
- [ ] 新增 3 个 state：`format`（默认 `"image/jpeg"`）、`quality`（默认 `0.9`）、`panelSizes`（默认 `[]`）
- [ ] `onExport` 里 `const { buf, sizes } = await runExport(items, spec, gutter, watermark, browserCanvasFactory, aspect, format, quality);`，下载后 `setPanelSizes(sizes)`
- [ ] Export Format `<select>` 是原生 `<select>` 标签（沿用本项目惯例，渠道切换器也是原生 select，不引入自定义 dropdown 组件），两个 `<option>`：JPEG / PNG
- [ ] JPEG Quality 滑块用 `{format === "image/jpeg" && (...)}` 条件渲染包裹，**切到 PNG 后必须消失**
- [ ] 滑块 `min={0.7}`、`max={1}`、`step={0.05}`——这三个数值跟设计文档"Quality range 0.7–1.0"一致，不是随便给的 0-1 整数范围
- [ ] `SuccessPanel` 新增 `sizes: number[]` prop，渲染 `<ul>` 列表，每项 `panel-{i+1}: X.XX MB`
- [ ] 红色警告条件**精确**是 `spec.id === "x" && s > X_EXPORT_SIZE_LIMIT_BYTES`——不是对所有渠道生效，也不是用 `spec.maxFileSize`（那是上传校验用的 10MB，跟导出后 X 平台 5MB 限制是两个完全不同的数字，别混用）
- [ ] Ko-fi 链接（`https://ko-fi.com/toonslice`）原样保留，没有被新代码冲掉
- [ ] **没有**改动 `channels/types.ts` 或任何 `src/channels/*.ts` 文件（`git diff --stat` 确认零改动）；Tech Specs Info Box 里原有的 `{spec.format.split("/")[1].toUpperCase()}` 那一行原样保留（那是渠道推荐格式展示，跟本次新增的用户导出格式选择是两件事，不应该被合并或删除）

---

## 2. 手动 QA（`npm run dev`，浏览器实测）

逐项打勾，任一项失败记录"打回项"：

- [ ] 任意渠道页上传图片后，右侧出现 "Export Format" 下拉，默认值是 "JPEG"
- [ ] 默认 JPEG 时，下方出现 "JPEG Quality" 滑块，初始显示 `0.90`，拖动范围限定在 0.70–1.00 之间
- [ ] 把下拉切到 "PNG"，Quality 滑块立刻消失；切回 "JPEG"，滑块重新出现且数值保持之前拖动的位置（不重置为默认值）
- [ ] 切到 X / Twitter 渠道，上传一张较大的真实彩色漫画图（建议找张 2MB+ 的，确保切出来的某段在 JPEG quality 0.9 下仍可能接近或超过 5MB，或者临时把 quality 滑到 1.0 逼近上限测试警告触发），导出后 SuccessPanel 里出现 `panel-1: X.XX MB` 这样的列表
- [ ] 如果有面板超过 5MB，对应行**变红**且带 "exceeds X's 5MB limit" 文案；不超过的行是正常颜色
- [ ] 切到 Webtoon / Tapas / Instagram 渠道重复导出，大小列表正常显示，**即使某段超过 5MB 也不变红**（警告只针对 X 渠道，这是设计文档的明确 non-goal：其他渠道无官方数字依据，不警告）
- [ ] 把格式切到 PNG 导出一次，确认下载的 zip 里文件后缀是 `.png`；切回 JPEG 导出，确认文件后缀是 `.jpg`
- [ ] 同一张图，JPEG（质量 0.9）导出的文件明显比 PNG 导出小（用系统文件管理器看 zip 解压后单个文件大小对比，符合设计文档 success criteria 里"4.8MB → 0.5-1MB"量级的预期方向，不要求精确数字）
- [ ] 整个导出过程打开 DevTools Network 面板核对，**没有任何网络请求**——这是项目硬契约（CLAUDE.md 明确要求），格式/质量改动不应该引入任何网络调用
- [ ] 切换 Instagram 渠道（carousel 分支），确认格式/质量控件依然可用，导出后 `slide-N` 大小列表正常显示

---

## 3. 验收结论格式

全部通过：
> "验收通过。自动化回归 41/41 + tsc + build 通过，6 个 Task 代码审查无问题，手动 QA 10 项全过。"

有问题：按以下格式列出每个打回项，整批一次性反馈给实施方，不要逐个来回：
> `src/ui/Workspace.tsx:123` — 红色警告条件写成了 `s > spec.maxFileSize`，应该是 `spec.id === "x" && s > X_EXPORT_SIZE_LIMIT_BYTES`，把上传校验阈值和导出后平台限制搞混了。
