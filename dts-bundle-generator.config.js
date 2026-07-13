// Bundles the SDK's public type declarations into a single, self-contained
// dist/index.d.ts. Types that originate from the canonical @liqo/contracts
// package are INLINED here at build time, so the published package has no
// dependency (file: or otherwise) on @liqo/contracts. The platform contracts
// remain the single source of truth; this output is a generated build artifact.
module.exports = {
  entries: [
    {
      filePath: './src/index.ts',
      outFile: './dist/index.d.ts',
      noCheck: true,
      libraries: {
        // Copy the referenced declarations from these packages into the bundle
        // instead of emitting `import(...)` references to them.
        inlinedLibraries: ['@liqo/contracts', 'zod'],
      },
      output: {
        sortNodes: true,
        noBanner: false,
        // Only the SDK's own exports are part of the public surface.
        // Types pulled in transitively (e.g. zod internals behind the
        // contract types) are emitted as non-exported declarations.
        exportReferencedTypes: false,
      },
    },
  ],
};
