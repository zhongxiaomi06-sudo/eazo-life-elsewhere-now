# Life Elsewhere, Now

Independent GitHub delivery repository for the Eazo Mini App `life-elsewhere-now`. This repository contains exactly one Mini App and its paired reusable Skill.

- App source: [`apps/life-elsewhere-now`](./apps/life-elsewhere-now/)
- Skill: [`skills/compare-life-contexts`](./skills/compare-life-contexts/)
- Delivery status: [`HANDOFF-STATUS.md`](./HANDOFF-STATUS.md)
- GitHub: https://github.com/zhongxiaomi06-sudo/eazo-life-elsewhere-now

## Run

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## Verify

```bash
pnpm verify
pnpm test:e2e
```

The repository state remains governed by the app's `RELEASE.md`; a successful build is not Owner approval or `READY_FOR_EAZO`.
