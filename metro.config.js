const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * `resolver.extraNodeModules` mirrors the `@/*` -> `src/*` path in
 * tsconfig.json.
 *
 * NOTE: Metro has no native `resolver.alias` option — that key is silently
 * ignored, which is why `@/...` imports were failing to resolve ("Unable to
 * resolve module @/app/providers/AppProvider"). Wildcard aliasing has to go
 * through `extraNodeModules` instead.
 *
 * Metro also parses any specifier starting with `@` using npm's
 * scoped-package rules, so `@/app/providers/AppProvider` is parsed as
 * packageName `@/app` + subpath `./providers/AppProvider` — a different
 * "package name" per top-level folder under src/. A Proxy answers each of
 * those lookups dynamically instead of hand-listing every folder.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const srcDir = path.resolve(__dirname, 'src');

const config = {
  resolver: {
    extraNodeModules: new Proxy(
      {},
      {
        get: (_target, name) => {
          if (typeof name === 'string' && name.startsWith('@/')) {
            return path.join(srcDir, name.slice(2));
          }
          // Not one of our aliases — return undefined so Metro falls back
          // to its normal "module not found" handling instead of us
          // masking the real error.
          return undefined;
        },
      },
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
