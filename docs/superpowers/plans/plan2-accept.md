# ToonSlice Plan 2 — 验收与交付(Opus 4.8 执行)

> **For agentic workers:** 本 plan 是**验收**流程,不是从零实现。前提:Plan 1(`plan1-build.md`)已由 DeepSeek V4 Pro 执行完毕,产出全绿测试 + `MODULE_MAP.md` + `HANDOFF.md`。逐 task 验收,发现问题即修即提交。Steps 用 checkbox(`- [ ]`)。

**Goal:** 验收 Plan1 产物,补齐 HANDOFF 列出的缺口,实测纯前端零上传卖点,出可部署的交付物。

**Architecture:** 三契约入口验收 —— 测试套件(功能)、MODULE_MAP(定位)、HANDOFF(缺口)。不重读全部代码,按契约切入。

**关联:** spec `spec-mvp.md` §9 验收标准为核对清单。

**验收工具:** `npx vitest run`、gstack `browse` skill(headless 浏览器实测)、`npm run build`。

---

### A0: 契约入口 — 读交接 + 跑测试

**目的:** 用三契约快速建立全貌,确认地基绿。

- [ ] **Step 1: 读 HANDOFF + MODULE_MAP**

Read: `HANDOFF.md`(已完成 / 已知缺口 / 难点)、`MODULE_MAP.md`(模块定位)。
记下"已知缺口"清单 → 后续 A3 逐条消除。

- [ ] **Step 2: 跑全测试套件**

Run: `npx vitest run`
Expected: 全部 PASS。若有红 → 先修到全绿再继续(记录修了什么)。

- [ ] **Step 3: 核对 MODULE_MAP 与实际文件一致**

Run: `find src -name '*.ts' -o -name '*.tsx' | sort`
对照 MODULE_MAP 每行路径是否存在、有无遗漏模块未登记。不一致 → 补全 MODULE_MAP。

- [ ] **Step 4: Commit(若有修正)**

```bash
git add -A && git commit -m "chore(accept): fix failing tests / sync MODULE_MAP"
```

---

### A1: spec §9 验收八条逐条核

**目的:** 按产品 spec 验收标准客观打勾。

- [ ] **Step 1: 逐条核对**

| # | spec §9 标准 | 验法 | 结果 |
|---|---|---|---|
| 1 | `npm run dev` 起纯前端 | 启动,无后端进程 | |
| 2 | 拖/传图、重排、选渠道、调 gutter、切水印、CSS 预览 | A2 浏览器实测 | |
| 3 | Export ZIP 本地生成分段,宽=渠道宽,段高≤渠道段高,切点落 gutter,**无上传** | A2 + A4 | |
| 4 | 宽不一图等比缩放到渠道宽 | A4 像素核 | |
| 5 | 水印开末段底含英文 banner | A3 补后核 | |
| 6 | 非法输入英文提示 | A5 | |
| 7 | build 产物纯静态无后端依赖 | A6 | |
| 8 | TDD 全过 | A0 已核 | |

- [ ] **Step 2: 把结果填入本表,未过项进对应 A 任务修复。**

---

### A2: 纯前端零上传实测(核心卖点)

**目的:** 证明图不离浏览器 —— 这是产品卖点,必须客观验证。

- [ ] **Step 1: headless 浏览器跑导出全流程**

用 gstack `browse` skill 打开 `npm run dev` 的本地址,脚本化:
1. 进 `/webtoon`。
2. 通过 file input 注入 2 张测试 PNG。
3. 点 Export ZIP。
4. **捕获网络请求列表**。

- [ ] **Step 2: 断言零上传**

Expected:导出过程网络请求中**无任何 POST/PUT 带图像数据**(只允许静态资源 GET)。
若发现上传 → 严重缺陷,回查是否误引入后端调用,修复。

- [ ] **Step 3: 断言下载产物**

Expected:触发了 `toonslice-webtoon.zip` 下载;解包后为多段 PNG。

- [ ] **Step 4: Commit(若修)+ 记录证据**

把网络面板截图/请求列表存 `docs/superpowers/acceptance/zero-upload-evidence.md`。
```bash
git add -A && git commit -m "test(accept): verify zero-upload export in headless browser"
```

---

### A3: 补齐 HANDOFF 缺口

**目的:** 消除 Plan1 标注的缺口。逐条做。

- [ ] **Step 1: 补水印 banner(参与布局 + 实绘)**

扩展 `computeLayout` 接受 watermark,末尾加 banner 项;`renderSegment` 绘 banner 文本。

`src/core/layout.ts` 增参数:
```ts
export const WATERMARK_HEIGHT = 60;
export function computeLayout(
  images: ImageSize[], width: number, gutter: number, watermark = false
): Layout {
  // ...原逻辑得到 items/gutters/y...
  if (watermark) {
    items.push({ y, height: WATERMARK_HEIGHT, scale: 1 }); // banner 作末项
    y += WATERMARK_HEIGHT;
  }
  return { width, totalHeight: y, items, gutters };
}
```
`exportVerticalSlice` 把 `watermark` 传入 `computeLayout`;`renderSegment` 末尾判断:若本段覆盖到 banner 区间(最后一项且 scale===1 无对应 source),绘文本:
```ts
// renderSegment 内,遍历 items 时:source 缺失(i>=sources.length)= banner
if (i >= sources.length) {
  ctx.fillStyle = "#000000";
  ctx.font = "20px sans-serif";
  ctx.fillText("Formatted by ToonSlice.com", 16, dy + 38);
  return;
}
```
补单测:watermark=true → totalHeight 增 WATERMARK_HEIGHT;末段绘文本被调用。跑绿。

- [ ] **Step 2: 平台胶水 headless 实测**

`loadImage` / `browserCanvas` / `download` 在 A2 流程已间接覆盖。补一条断言:导出段图宽 === 渠道 canvasWidth(证明缩放生效)。

- [ ] **Step 3: 联盟 /go/* 重定向占位**

确认 `/go/xppen`、`/go/clip-studio` 有占位处理(指向真实联盟 URL 前给 404 友好页或 TODO 注释)。真实 URL 待账号申请,记入交付报告"上线前补"。

- [ ] **Step 4: 规格文案标记**

渠道页规格说明现为占位,标 TODO ≥300 词原创(AdSense 前补)。记入交付报告,不阻断本次验收。

- [ ] **Step 5: 跑全量 + Commit**

```bash
npx vitest run && git add -A && git commit -m "feat(accept): watermark banner render; close handoff gaps"
```

---

### A4: 难点代码审查 — 逐段渲染正确性

**目的:** 逐段裁剪是最易错处,像素级验证。

- [ ] **Step 1: 构造跨段图验证切片连续性**

写集成测试:单张高图(缩放后 3000px)→ 导出多段 → 各段高度之和 === 总高(无重叠无丢行)。
```ts
// src/exporters/verticalSlice.integration.test.ts
it("段高之和 = 总高(无重叠/丢失)", async () => {
  // 用 @napi-rs/canvas 造 800x3000 纯色图,maxH=1280
  // 断言 Σ(seg 高) === 3000
});
```

- [ ] **Step 2: 验证缩放正确(spec §9.4)**

宽 1600 与宽 800 两图,渠道 W=800 → 段图宽均为 800,前者高减半。断言导出段 canvas 宽=800。

- [ ] **Step 3: 跑绿 + Commit**

```bash
npx vitest run && git add -A && git commit -m "test(accept): segment continuity and scaling correctness"
```

---

### A5: 边界 / 坏输入实测

**目的:** spec §6 错误处理对用户可见。

- [ ] **Step 1: headless 逐项验**

| 输入 | 期望 |
|---|---|
| 上传 .gif | 提示 UNSUPPORTED_TYPE |
| 上传 >10MB png | 提示 TOO_LARGE |
| 0 图点导出 | 按钮禁用 |
| 31 图 | 仅保留 30 |
| 触发 TOO_TALL(超高合成) | 提示 reduce images |
| IG 页 | 导出按钮 "coming soon" 禁用 |

- [ ] **Step 2: 不达预期则修 Workspace 校验逻辑,跑绿,Commit**

```bash
git add -A && git commit -m "fix(accept): error-handling edge cases per spec §6"
```

---

### A6: 构建与部署就绪

- [ ] **Step 1: 纯静态构建**

Run: `npm run build`
Expected: 成功,`dist/` 为纯静态(无 server 依赖)。

- [ ] **Step 2: 确认无后端残留**

Run: `grep -rE "fastify|express|/api/|sharp|archiver" src/ || echo "clean"`
Expected: `clean`(纯前端,无后端库/接口残留)。

- [ ] **Step 3: 本地预览验证**

Run: `npm run preview`,headless 跑一次导出冒烟。
Expected: 与 dev 一致可导出。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore(accept): verify static build and deploy readiness"
```

---

### A7: 交付报告

- [ ] **Step 1: 写交付报告**

Create `docs/superpowers/acceptance/2026-06-15-delivery-report.md`:
```markdown
# ToonSlice MVP 交付报告

## 验收结果
- spec §9 八条:[逐条 通过/备注]
- 零上传卖点:已 headless 实测,证据见 zero-upload-evidence.md
- 测试:N passed

## 上线前必补(非阻断 MVP 交付)
- 渠道规格文案扩至 ≥300 词原创(AdSense 审核)
- 联盟 /go/* 接真实 URL(XP-Pen / Clip Studio / Amazon 账号申请后)
- 规格数字按各平台官方最终核实
- IG carousel 导出(后置一刷,见变现 spec)

## 部署
- 纯静态 dist/,可挂 Vercel / Cloudflare Pages
```

- [ ] **Step 2: 最终 Commit**

```bash
git add -A && git commit -m "docs(accept): MVP delivery report"
```

---

## Plan 2 自检

| 验收目标 | 任务 |
|---|---|
| 三契约入口 | A0 |
| spec §9 八条 | A1 |
| 零上传卖点 | A2 |
| HANDOFF 缺口(水印等) | A3 |
| 逐段渲染正确性 | A4 |
| 错误边界 | A5 |
| 纯静态部署 | A6 |
| 交付报告 | A7 |
