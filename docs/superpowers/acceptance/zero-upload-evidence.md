# 零上传实测证据(A2)+ 边界用例(A5)

实测工具:gstack `browse` headless Chromium,against `npm run dev`(http://localhost:5173)。
日期:2026-06-15。

## A2 — 纯前端零上传(核心卖点)

流程:`/webtoon` → file input 注入 `/tmp/panel1.png`(1600×2400)+ `/tmp/panel2.png`(800×1800)→ 清空网络面板 → 点 Export ZIP。

| 断言 | 期望 | 实测 |
|---|---|---|
| 导出过程网络请求 | 无 POST/PUT 带图像数据(仅静态 GET) | **零网络请求**(`browse network` 返回 `(no network requests)`)|
| 成功态 | 触发下载 + 显示完成 | `document.body` 含 `"Done!"`;成功面板渲染(Ko-fi + Clip Studio + IG 提示)|
| 控制台错误 | 无致命错误 | 仅 React Router v7 future-flag warning(无害)|

截图:`zero-upload-webtoon.png`(2 图预览 + 水印开 + 成功态)。

结论:导出全程图像不离浏览器,零网络。卖点客观成立。

## A5 — 边界 / 坏输入(spec §6)

| # | 输入 | 期望 | 实测 |
|---|---|---|---|
| 1 | `.gif` | UNSUPPORTED_TYPE | `bad.gif: UNSUPPORTED_TYPE` ✓ |
| 2 | >10MB png(54MB) | TOO_LARGE | `huge.png: TOO_LARGE` ✓ |
| 3 | 0 图 | 导出按钮禁用 | `is disabled button.bg-black` → true ✓ |
| 4 | 31 图 | 仅保留 30 | UI 显示 `30 image(s)` ✓ |
| 5 | TOO_TALL(2×800×16000=32000px>30000) | 提示 reduce images | `TOO_TALL: reduce images` ✓ |
| 6 | IG 页 | 导出 "coming soon" 禁用 | `Carousel export — coming soon` / disabled=true ✓ |

六项全过,无需修复。

## 注

- 平台胶水(loadImage/browserCanvas/downloadZip)经此流程间接覆盖(HANDOFF 缺口①消除)。
- 段图宽=渠道宽 由 A4 集成测试像素级断言(`verticalSlice.integration.test.ts`)。
