# Changelog

All notable changes to `@liqo/sdk` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] — Unreleased

The 2.0 line aligns the SDK with Liqo's canonical contract layer and the hosted-checkout payment model.

### Added
- `liqo.pay(params)` — create a payment via hosted checkout in one call.
- `liqo.checkout.sessions.create()` / `liqo.checkout.sessions.retrieve(token)`.
- `liqo.webhooks.verify({ payload, headers })` — signed webhook verification with timestamp/replay protection.
- `liqo.transactions.retrieve(id)`, `liqo.waitForCompletion(id, opts)`.
- Request/response/error event listeners via `liqo.on(...)`.
- Types re-exported from Liqo's canonical `@liqo/contracts`.
- Comprehensive documentation (`docs/`) and runnable examples (`examples/`).
- MIT `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue/PR templates.

### Changed
- Positioning updated to **Global Payments Infrastructure for Modern Businesses** across package metadata and docs.
- `package.json` `description`/`keywords` refreshed; `version` aligned to `2.0.0` (previously `1.1.0` while the client already advertised v2).

### Packaging
- **Removed the `@liqo/contracts` `file:` dependency.** The SDK now ships **self-contained type declarations** — contract types are inlined into `dist/index.d.ts` at build time (via `dts-bundle-generator`), so the published package depends only on `axios` and installs standalone outside the monorepo. The platform contracts remain the single source of truth.
- Added an `exports` map, `sideEffects: false`, inline source maps, and a two-step build (`tsc` → `build:types`).
- Build/test now resolve the canonical contracts from the sibling `../liqo-platform` build via `tsconfig` `paths` + jest `moduleNameMapper` (dev/CI only).

### Fixed
- `normalizeStatus` now treats the canonical terminal status `cancelled` as terminal, so `waitForCompletion`/`isTerminalStatus` no longer hang on cancelled transactions.

### Deprecated / Removed
- `verifyWebhook(signature, payload)` — throws; use `liqo.webhooks.verify({ payload, headers })`.
- `payAndWait()` / `payAndConfirm()` — not supported for hosted checkout sessions; use `checkout.sessions.retrieve(token)` to poll checkout status.

## [1.1.0]

- Initial public SDK line (checkout, transactions, webhook verification).

[2.0.0]: https://github.com/liqoprotocol/liqo-sdk/releases
[1.1.0]: https://github.com/liqoprotocol/liqo-sdk/releases
