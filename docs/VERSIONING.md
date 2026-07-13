# Versioning

`@liqo/sdk` follows [Semantic Versioning 2.0.0](https://semver.org).

## What the numbers mean

Given `MAJOR.MINOR.PATCH`:

- **MAJOR** — backward-incompatible changes to the public API (renamed/removed methods, changed signatures or runtime behavior).
- **MINOR** — backward-compatible new features (new methods/options).
- **PATCH** — backward-compatible bug fixes.

The **public API** is what's exported from `@liqo/sdk` (see [API Reference](./API_REFERENCE.md)). Internal modules are not part of the semver contract.

## API version vs SDK version

- The **SDK version** is the npm package version (e.g. `2.0.0`).
- The **Liqo API version** is sent as the `X-Liqo-Version` header (currently `2`) and is independent of the SDK version.

## Release process

1. Update code and tests; ensure `npm run lint`, `npm run build`, `npm test` pass.
2. Update [CHANGELOG.md](../CHANGELOG.md) under the new version.
3. Bump `version` in `package.json` per SemVer.
4. Tag the release (`vX.Y.Z`) and publish (`npm publish`).
5. Complete the [public release checklist](../SDK_PUBLIC_RELEASE_CHECKLIST.md) — notably, resolve the `@liqo/contracts` packaging before publishing.

## Deprecation policy

- Deprecated members are marked with `@deprecated` JSDoc and, where practical, remain available for one major version.
- Removals happen only in a MAJOR release, with guidance in the [Migration Guide](./MIGRATION_GUIDE.md).

## Supported versions

See [SECURITY.md](../SECURITY.md#supported-versions). Security fixes target the latest published major line.
