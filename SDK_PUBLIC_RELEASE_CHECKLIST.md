# SDK Public Release Checklist

Gate for publishing `@liqo/sdk` to npm. Do not publish until every **Blocker** is resolved.

## ✅ Blockers (RESOLVED)

- [x] **`@liqo/contracts` packaging — RESOLVED.** The referenced contract types are now **inlined into a self-contained `dist/index.d.ts` at build time** via `dts-bundle-generator`, and `@liqo/contracts` has been **removed from `dependencies`**. The published `dependencies` is `{ "axios" }` only — **no `file:` dependency remains**. The platform contracts stay the single source of truth; the SDK output is a generated build artifact. Verified: `npm pack` ships only `axios` as a dependency, and a strict consumer typecheck succeeds with `@liqo/contracts` unavailable.
- [ ] **Commit the working-tree refactor.** The `src/methods`, `src/types`, `src/utils` split (pre-existing) plus this packaging work are uncommitted. Commit and tag before release. Keep packaging changes isolated from unrelated refactors.
- [ ] **Confirm the version + tag `v2.0.0`.** `package.json` is `2.0.0` (matches the client's advertised version). Confirm and tag.
- [ ] **Ensure CI builds `@liqo/contracts` first.** The SDK build resolves contracts from the sibling `../liqo-platform` build (tsconfig `paths` + jest `moduleNameMapper`). CI must check out `liqo-platform` and run its contracts build before building/testing the SDK. See [CONTRIBUTING.md](./CONTRIBUTING.md#building).

## ✅ Public API review

- [ ] Public exports in `src/index.ts` are intentional and documented (`Liqo`, `LiqoClient`, `LiqoApiError`, `LiqoSdkError`, `isTerminalStatus`, all public types).
- [ ] Deprecated members (`verifyWebhook`, `payAndWait`, `payAndConfirm`) documented in [docs/MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md).
- [ ] No accidental exports of internal helpers.

## ✅ Types & build

- [x] `npm run build` produces `dist/index.js` + a **self-contained** `dist/index.d.ts` (verified: 0 references to `@liqo/contracts`/`zod`/`import(...)`).
- [x] Only `dist/index.d.ts` ships as declarations (no stray per-file `.d.ts` referencing `@liqo/contracts`).
- [x] `exports` map added (`.` → types + default; `./package.json`).
- [x] `sideEffects: false` for tree-shaking.
- [ ] Consider adding a dedicated ESM build for maximum tree-shaking (recommended, not blocking; the current build is CommonJS with a self-contained `.d.ts`).
- [ ] Note: the bundled `.d.ts` inlines contract/zod types as **non-exported** internal declarations (public surface stays clean). A future optimization is to have the platform expose plain DTO types to shrink the generated `.d.ts`.

## ✅ Tests & quality

- [ ] `npm test` passes (currently 12/12).
- [ ] `npm run lint` passes.
- [ ] Add CI (GitHub Actions) running lint + build + test on PRs.
- [ ] Consider expanding coverage: `waitForCompletion`, retry/backoff, event listeners.

## ✅ npm metadata (`package.json`)

- [ ] `name`, `version`, `description`, `keywords` reflect current branding (done: "Global Payments Infrastructure for Modern Businesses").
- [ ] `main`, `types`, `files` correct; `files` includes `dist`, `README.md`, `LICENSE`, `CHANGELOG.md` (done).
- [ ] `license: MIT`, `repository`, `homepage`, `bugs` set (done).
- [ ] `engines.node >= 18`, `sideEffects: false` (done).
- [ ] `publishConfig.access: public` (done).
- [ ] Run `npm pack --dry-run` and verify the tarball contains only intended files (no `src`, tests, or secrets).

## ✅ Docs & examples

- [ ] `README.md` complete and accurate (done).
- [ ] `docs/` complete (done — 15 guides).
- [ ] Examples runnable and referenced from README (done — node/express/nestjs/nextjs/react).
- [ ] All internal links resolve.

## ✅ Legal & health

- [ ] `LICENSE` present (MIT) (done).
- [ ] `CHANGELOG.md` updated for the release (done).
- [ ] `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, issue/PR templates present (done).

## ✅ Release notes & breaking changes

- [ ] Draft GitHub Release notes from `CHANGELOG.md`.
- [ ] Breaking changes (hosted-checkout `pay`, webhook API, deprecated helpers) called out in the [Migration Guide](./docs/MIGRATION_GUIDE.md) (done).

## ✅ Repository links & metadata

- [ ] GitHub description + topics set (see [SDK_AUDIT_REPORT.md](./SDK_AUDIT_REPORT.md#suggested-github-metadata)).
- [ ] `repository.url` matches the real repo (`liqoprotocol/liqo-sdk`).
- [ ] Confirm production API domain used in docs (`api.liqo.dev`) vs marketing domain (`liqo.network`).

## ✅ Security review

- [ ] No secrets/keys committed (verified: only placeholder `sk_live_...` in README).
- [ ] `.gitignore` covers `.env`, `node_modules`, `dist` (as appropriate).
- [ ] Webhook verification uses constant-time comparison + timestamp tolerance (verified).
- [ ] Docs stress server-side-only usage and raw-body webhook verification (done).

## Publish

```bash
npm run build
npm pack --dry-run     # inspect contents
npm publish --access public
git tag v2.0.0 && git push --tags
```
