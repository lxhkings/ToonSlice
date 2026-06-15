# ToonSlice 模块地图

> 每个 task 完成后由执行者更新本表。供验收/协作快速定位,无需全仓扫描。

| 模块 | 路径 | 职责 | 依赖 | 常见改动场景 |
|---|---|---|---|---|
| 渠道注册 | src/channels/*.ts | 各渠道规格 + SEO 数据 | — | 加渠道 / 改规格 |
| 布局 | src/core/layout.ts | 等比缩放 + 堆叠 + gutter 坐标 | — | 改对齐 / 缩放策略 |
| 切片 | src/core/slice.ts | gutter 优先分段 + 硬切回退 | layout(类型) | 改分段策略 |
| 渲染 | src/core/render.ts | 逐段 canvas 绘制(裁剪 drawImage) | Canvas API, layout/slice 类型 | 改绘制 / 水印 |
| 导出策略 | src/exporters/verticalSlice.ts | 串联 layout+slice+render → Blob[] | core/* | 加导出模式 |
| 打包 | src/pack/zip.ts | JSZip 命名打包 → ArrayBuffer | JSZip | 改命名 / 格式 |
| 平台胶水 | src/platform/*.ts | 浏览器图解码 / canvas 工厂 / 文件校验 | Canvas/DOM API | 改浏览器交互 |
| 下载 | src/pack/download.ts | ArrayBuffer 触发下载 | DOM API | 改下载行为 |
| 工具 UI | src/ui/Workspace.tsx | 拖拽/渠道/gutter/水印/预览/导出/成功态 | platform, exporters, pack | 改交互 |
| 导出编排 | src/ui/useExport.ts | 加载图→段 blob→zip | exporters, pack | 改导出流程 |
