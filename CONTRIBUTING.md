# Contributing to @liqo/sdk

Thanks for your interest in improving the official Liqo SDK. This guide covers how to set up, develop, and submit changes.

## Code of Conduct

This project is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Source of Truth

The [`liqo-platform`](https://github.com/liqoprotocol/liqo-platform) repository (and its `@liqo/contracts` package) is the **authoritative contract** for the Liqo API. The SDK must match the platform's endpoints, request/response shapes, enums, and error codes. **Do not add SDK methods, endpoints, or fields that do not exist in the platform.** If you find a discrepancy, open an issue describing whether it's an SDK bug or a platform change.

## Development Setup

**Requirements:** Node.js 18+.

```bash
git clone https://github.com/liqoprotocol/liqo-sdk.git
cd liqo-sdk
npm install
```

### Building

The **published** SDK has no dependency on `@liqo/contracts` — the referenced contract types are inlined into a self-contained `dist/index.d.ts` at build time. But to **build/test the SDK from source**, the canonical contracts must be resolvable, because they are the single source of truth for the types.

Requirements for a local build:

1. Check out [`liqo-platform`](https://github.com/liqoprotocol/liqo-platform) as a **sibling** directory: `../liqo-platform`.
2. Build `@liqo/contracts` there (e.g. `npm run build --workspace=packages/contracts`) so its `dist/` exists.

Resolution during build/test is configured via `tsconfig.json` `paths` and `jest.config.js` `moduleNameMapper` pointing at `../liqo-platform/packages/contracts/dist`. **Do not add `@liqo/contracts` back to `package.json` dependencies** — that reintroduces a `file:` dependency and breaks npm publication.

CI must check out `liqo-platform` and build its contracts before building/testing the SDK.

Common scripts:

```bash
npm run build       # clean → tsc (JS + maps) → dts-bundle-generator (self-contained dist/index.d.ts)
npm run build:types # just the .d.ts bundling step
npm test            # jest
npm run lint        # eslint
npm run dev         # tsc --watch
```

The build pipeline: `tsc` compiles JS (+ inline source maps); [`dts-bundle-generator`](https://github.com/timocov/dts-bundle-generator) (see `dts-bundle-generator.config.js`) emits a single self-contained `dist/index.d.ts` with contract types inlined as non-exported internals.

## Making Changes

1. Fork and branch from `main`: `git checkout -b feat/short-description`.
2. Keep changes focused and small.
3. Add or update tests for behavior changes (`src/__tests__`).
4. Update relevant docs in `docs/` and the `README.md`.
5. Run `npm run lint`, `npm run build`, and `npm test` before opening a PR.

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add waitForCompletion polling helper
fix: treat cancelled transactions as terminal
docs: clarify raw-body requirement for webhook verification
```

## Pull Requests

- Fill out the [PR template](./.github/PULL_REQUEST_TEMPLATE.md).
- Link the issue you address (`Closes #123`).
- Ensure CI (lint/build/test) passes.
- Note any breaking changes explicitly — they require a major version bump.

By contributing, you agree your work is licensed under the repository's [MIT License](./LICENSE).

## Public API Changes

The public surface is exported from `src/index.ts`. Any change there is a versioned change:

- **Additive, backward-compatible** → minor.
- **Breaking** (renames, removals, changed signatures/behavior) → major, with a migration note in [docs/MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md).

## Reporting Bugs & Requesting Features

Use the [issue templates](./.github/ISSUE_TEMPLATE). For security issues, follow [SECURITY.md](./SECURITY.md) — never a public issue.
