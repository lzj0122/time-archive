# Time Archive 接口契约

版本：v0.2（内容接入阶段）  
适用项目：`time-archive`  
内容根目录：`src/data/events/`

## 1. 路由

使用 Vue Router hash 模式，刷新后由前端恢复路由。

| 路由 | 页面 | 当前状态 |
| --- | --- | --- |
| `#/` | `HomeView` | 时间山脊、雪山、地图、进度灯 |
| `#/event/:id` | `EventView` | 档案八区；事实、信件、媒体、数据、图谱、双声回应、来源 |
| `#/summit` | `SummitView` | 登顶序列；后续由 6 灯全亮解锁 |
| `#/about` | `AboutView` | 后续步骤实现 |
| `#/dev/content` | `ContentDevView` | 六事件内容完整度与媒体缺失预览 |

未知路由重定向到 `#/`。

## 2. Event JSON

每个事件对应 `src/data/events/<id>.json`。组件不得写死事件内容。

```json
{
  "id": "string，事件年份",
  "year": "integer",
  "title": "string",
  "subtitle": "string",
  "summary": "string",
  "location": {
    "name": "string",
    "lng": "number",
    "lat": "number"
  },
  "facts": [
    { "text": "string", "sourceId": "string，必须存在于 sources" }
  ],
  "letter": {
    "author": "string，虚构人物",
    "role": "string",
    "date": "YYYY-MM-DD",
    "body": "string",
    "disclaimer": "string，必须标明文学化演绎"
  },
  "character": {
    "mode": "none | portrait | live2d",
    "portrait": "string | null",
    "modelPath": "string | null"
  },
  "media": {
    "hero": "string，media.json 中的媒体 ID",
    "gallery": ["string"],
    "video": "string"
  },
  "audio": {
    "ambient": "string，media.json 中的媒体 ID"
  },
  "graph": {
    "nodes": [
      {
        "id": "string，唯一",
        "name": "string",
        "category": "string",
        "description": "string"
      }
    ],
    "links": [
      {
        "source": "string，必须存在于 nodes",
        "target": "string，必须存在于 nodes",
        "label": "string"
      }
    ]
  },
  "data": [
    {
      "label": "string",
      "value": "number | string",
      "unit": "string",
      "year": "integer",
      "sourceId": "string，必须存在于 sources"
    }
  ],
  "agents": {
    "witness": {
      "prompt": "string",
      "disclaimer": "string"
    },
    "historian": {
      "prompt": "string",
      "citationRequired": true
    }
  },
  "sources": [
    {
      "id": "string，唯一",
      "title": "string",
      "author": "string",
      "publisher": "string",
      "year": "integer",
      "url": "string，可空",
      "accessed": "YYYY-MM-DD"
    }
  ]
}
```

### 校验规则

- `id` 与文件名一致，且属于：`1919`、`1921`、`1949`、`1964`、`1978`、`2020`。
- `facts[].sourceId`、`data[].sourceId` 必须能在 `sources[].id` 中找到。
- `graph.nodes[].id` 唯一；`graph.links` 的 `source` 和 `target` 必须存在。
- 媒体、音频、肖像必须提供 `credit` 和 `license`；缺失素材使用明确的 `TODO` 标记，不编造来源。
- 亲历者只能是虚构普通人，必须带文学化演绎免责声明；考据官必须引用 `sources`。

### 媒体清单

`src/data/media.json` 按事件 ID 分组。每个媒体项包含 `id`、`type`、`title`、`status`、`license`、`source`、`credit`；可用图片还包含 `localPath` 与 `caption`，缺失项必须包含 `reason`。

- `status: "ready"`：允许在正式页面渲染。
- `status: "missing"`：只显示“待补”和缺失原因，不渲染图片或播放器。
- 图片加载失败时回退为“待补”，不显示破图。

## 3. 组件接口

| 组件 | Props | Emits | 说明 |
| --- | --- | --- | --- |
| `AppShell` | `route` | — | 全屏布局、导航、进度、设置 |
| `InkTransition` | `duration`, `mode` | — | 水墨转场 |
| `TimelineSpline` | `events`, `activeId` | `select`, `progress` | 拖拽、吸附、键盘 |
| `SnowMountain` | `progress`, `activeId` | `ready` | Three.js 雪山与相机 |
| `MapAtlas` | `events`, `open` | `select`, `close` | 3D 中国地图覆盖层 |
| `ProgressLights` | `completed` | — | 6 盏进度灯 |
| `EventArchive` | `event` | — | 档案页布局 |
| `LetterTypewriter` | `text`, `speed` | `done`, `skip` | 逐字信件 |
| `CharacterStage` | `character`, `mode` | `fallback` | Live2D / 2.5D 人物 |
| `MediaStage` | `media`, `audio` | — | 视频、音频、字幕 |
| `ArchiveGallery` | `images` | — | medium-zoom 史料图 |
| `DualAgentChat` | `eventId`, `agents` | — | 双声 AI |
| `KnowledgeGraph` | `graph`, `highlightIds` | — | ECharts 力导向图 |
| `DataPanel` | `data`, `year` | — | ECharts 数据面板 |
| `SummitSequence` | `unlocked` | `complete` | 登顶 dolly zoom |
| `SourceList` | `sources` | — | 来源与版权 |

## 4. Pinia 状态

### `useEventStore`

- `events: Event[]`
- `currentEvent: Event | null`
- `loadEvents(): Event[]`

### `useProgressStore`

- `readEvents: string[]`
- `askedEvents: string[]`
- `completedEvents: string[]`
- `summitUnlocked: boolean`：当且仅当 `completedEvents.length === 6` 为 `true`。
- localStorage key：`time-archive:progress:v1`

### `useSettingsStore`

- `muted: boolean`
- `reducedMotion: boolean`
- `readingMode: boolean`
- `mapOpen: boolean`
- localStorage key：`time-archive:settings:v1`

localStorage 只保存进度和设置，不保存史料、媒体或 AI 密钥。

## 5. AI 接口边界

`POST /api/chat`

```json
{
  "eventId": "1919",
  "role": "witness | historian",
  "question": "string",
  "history": []
}
```

- 服务端读取事件 JSON，并从 `event.agents[role].prompt` 构造 system prompt。
- 客户端不得提交 system prompt 或 API Key。
- 响应使用 SSE，包含 token 与 `citations`。
- 亲历者回复必须显示“文学化演绎”；考据官回复必须显示来源引用。
- 失败时使用 `data/demo-dialogue.json`，并明确标注“演示模式”。
