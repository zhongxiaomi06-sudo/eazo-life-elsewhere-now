# Life Elsewhere Now Release

## 当前阶段

`BUILDING`；不发布。

## Owner approvals

本轮改造范围已确认；最终摄影裁切/动效审美、两轮真机与 `READY_FOR_EAZO` 未签字。

## Handoff

源码、构建、七文档、测试与视觉证据、冻结数据、媒体、manifest、rights ledger、skill `compare-life-contexts`、版本和回滚说明。

## Blockers

- iPhone 17 / iOS 26.6 两轮完整自测和 Owner 审美签字。
- 冻结指标独立审校、敏感内容复核和递归 manifest。
- 大媒体与 JS 包体优化、SDK 安全升级、source map 策略。
- Eazo 宿主分享与离线更新恢复验收。

## Rollback

绑定上一验证 SHA 与 snapshot hash；媒体/宿主失败时保留静态图片、冻结数据和 Web fallback，不发布缺证据版本。

## 2026-09-07 QA 修改

- Eazo Link：<https://project-bc68d69a.eazo.dev>。
- 已修：删除按 scene hash 随机抽图的逻辑，改为十个证据地区与十张唯一照片一一绑定；一次旅程只出现每个地区一次。
- 素材：加拿大、西班牙、肯尼亚、埃及为本轮原创纪实摄影候选，已进入 rights ledger；图片仅表达地域氛围，不冒充具体人物记录。
- 待验证：Owner 检查四张新增图片的地域辨识度与裁切，再做两轮 iPhone 滑动旅程。
