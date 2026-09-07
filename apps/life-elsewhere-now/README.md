# Life Elsewhere Now

以真实指标和合成肖像组成一次全球生活切片浏览，强调数据来源与“不对生活排序”的边界。

## Project contract

- Package: `@eazo/life-elsewhere-now`
- Local URL: <http://127.0.0.1:5103>
- Runtime: React + TypeScript + Vite
- Locale: English (`en-US`)
- E2E: `tests/e2e/project.spec.ts`

## Commands

```bash
pnpm --filter @eazo/life-elsewhere-now dev --host 127.0.0.1
pnpm --filter @eazo/life-elsewhere-now typecheck
pnpm --filter @eazo/life-elsewhere-now build
pnpm exec playwright test --project=life-chromium-mobile
```

The web fallback remains usable when the optional Eazo sharing bridge is absent.

## Project documents

- [Product](./PRODUCT.md) · [Design](./DESIGN.md) · [Content](./CONTENT.md)
- [Architecture](./ARCHITECTURE.md) · [Testing](./TESTING.md) · [Release](./RELEASE.md)
