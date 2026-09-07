# Life Elsewhere Now Testing

## 自动化

`src/life.test.ts` 覆盖调度、对照、安全 fallback、SVG 清理、分享 payload 与声音降级；preview inspector 有独立测试。项目 E2E 覆盖英文入口和开始，需扩展到 Pair、方法、结果、静音和离线完整闭环。

## 视口

Chromium 320×568、390×844、1440×1000；WebKit 390×844；补手机横屏、减少动态与媒体失败。

## 已验证证据

2026-09-04：目标 TypeScript 通过。最终 lint、unit、build 和 E2E 在本轮结束实跑后补录。

## Mobile run 1 / 2

待执行：iPhone 17 / iOS 26.6 两次独立完整旅程，记录环境、SHA、manifest hash、截图/视频、结果与缺陷。

## 缺口

真机、独立数据审校、包体、暗色对比、离线更新中断和 Eazo 宿主分享尚未完成。

## 2026-09-04 自动化记录

目标范围 lint/typecheck/build 通过；13 个测试文件共 131 项通过；九应用 Chromium/WebKit 五视口矩阵 45/45 通过。390×844 截图：`test-results/visual-nine/life-elsewhere-now-390x844.png`。两轮真实 iPhone 与 Owner 签字仍阻塞。
