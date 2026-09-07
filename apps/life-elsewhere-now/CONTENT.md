# Life Elsewhere Now Content

## 数据

冻结指标与版本在 `src/data-snapshot.json`、`src/content.ts`；场景合成与比较逻辑在 `src/engine.ts`。每项指标保留定义、单位、年份、来源 URL、覆盖范围、变换与舍入。

## 资产

地球夜景、封面、视频、图标与明信片位于 `content/`；来源/许可在 `content/rights-ledger.tsv`，哈希在 `content/data-manifest.json`。音频由 Web Audio 本地合成。

## 编辑原则

可见 UI 为 `en-US`。不得把合成头像称为真人，不得把国家平均值改写成个体预测，不得用优劣排名组织对照。冲突与气候内容保留敏感度边界。

## 阻断

postcards、视频、icons 和 versions 子目录需递归进入最终 manifest；独立数据与英文文案审校仍需完成。
