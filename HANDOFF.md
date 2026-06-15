# ToonSlice Plan1 → Plan2 交接

## 已完成
- 核心引擎 layout/slice/render 全单测覆盖
- exporters/verticalSlice 串联导出(注入 canvasFactory)
- pack/zip + download (返回 ArrayBuffer，downloadZip 包装 Blob)
- 平台胶水(浏览器 canvas / 图解码 / 校验)
- Workspace 工具 UI + 渠道路由页(/、/webtoon、/tapas、/x、/instagram)
- 成功态(Ko-fi + 静态联盟 + 交叉渠道)、边界校验(总高 30000px)、IG coming soon
- 19 个测试全部绿
- MODULE_MAP 已更新

## 已知缺口 / 未覆盖(需 Plan2 处理)
- 平台胶水(loadImage / browserCanvas / downloadZip)无法在 jsdom 完整测 → 需 headless 浏览器实测
- 水印 banner 仅预留(watermark flag 传入但 renderSegment 未实际绘制 banner 文本) → 待补
- 渠道规格说明文案为占位,未达 ≥300 词原创(AdSense 审核需补)
- 联盟链接 /go/* 为占位重定向,未接真实联盟 URL
- 规格数字(canvasWidth/maxSegmentHeight)未按平台官方最终核实
- packZip 因 jsdom Blob 兼容问题改为返回 ArrayBuffer(而非计划中的 Blob);浏览器端由 downloadZip 包装

## 难点与注意
- renderSegment 的 source 裁剪用 invScale=origH/itemHeight,改缩放策略需同步
- exporter 注入 canvasFactory:测试用 @napi-rs/canvas,浏览器用 browserCanvasFactory
- 纯前端契约:导出全程不得有网络请求(Plan2 用网络面板断言)
- packZip 返回 ArrayBuffer → downloadZip 包装 Blob 触发下载(与计划略有偏差,jsdom 兼容原因)
