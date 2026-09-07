# Life Elsewhere Now Architecture

## 模块

- `src/App.tsx`：场景、对照、方法、收集与结果视图。
- `src/engine.ts`：场景调度、对照、分享净化和安全 fallback。
- `src/content.ts`：指标字典、来源与敏感度。
- `src/postcards.ts`：结果视觉选择。
- `src/sound.ts`：持久静音、主题背景床与反馈音。

## 数据与存储

使用冻结 JSON 快照和本地进度；不请求位置或个人身份。分享 payload 经过净化，只携带公开场景/指标引用。

## Resilience

数据缺失走 `safeFallback`；音频、视频、网络和 Eazo 分享均可独立失败而不阻断浏览、对照和结束。

## 性能

首屏媒体需要响应式格式；宿主 SDK 和次级画面按需加载。当前主包曾超 200 KB gzip，需继续拆分。
