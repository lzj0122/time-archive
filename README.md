# 时空档案 · Time Archive

Vue 3 + Vite + JavaScript 单页应用，包含六个历史事件档案、时间山脊动效、双角色回应与内容校验预览。

## 本地运行

```bash
npm install
npm run dev
```

## 校验与构建

```bash
npm run validate:content
npm run build
```

## 公网预览

https://time-archive-du2g3ngip1t.qoder.zone

内容完整度预览：https://time-archive-du2g3ngip1t.qoder.zone/#/dev/content

## 协作分支

- `main`：稳定版本，由主维护者合并。
- `dev`：集成分支，所有新工作先进入这里。
- 每个任务从最新 `dev` 新建分支，完成后向 `dev` 提 PR。
- 内容任务只修改 `src/data/events/*.json`、`src/data/sources.json`、`src/data/media.json`。
- 页面、路由、样式和组件由主维护者修改。
- 联合调试统一记录：页面、视口、操作步骤、预期、实际、控制台/网络错误、截图与相关 `sourceId`。

## 契约

见 `CONTRACT.md`。
