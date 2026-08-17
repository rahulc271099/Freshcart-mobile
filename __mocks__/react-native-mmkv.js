/**
 * Jest manual mock for react-native-mmkv (v4, Nitro-Modules-based).
 *
 * MMKV v4 talks to a real native Nitro TurboModule, which doesn't exist in
 * Jest's Node environment — there's no bundled Jest mock upstream (yet) the
 * way react-native-gesture-handler ships one, so every test that touches
 * MMKV (directly, or transitively via the auth/cart Zustand stores) would
 * otherwise crash with "NitroModules could not be found". This in-memory
 * stand-in implements just the subset of the real API this app currently
 * uses, matching real MMKV's return types (e.g. `undefined` for a missing
 * key, not `null`).
 */
function createMMKV() {
  const store = new Map();

  return {
    set: (key, value) => {
      store.set(key, value);
    },
    getString: key => {
      const value = store.get(key);
      return typeof value === 'string' ? value : undefined;
    },
    getBoolean: key => {
      const value = store.get(key);
      return typeof value === 'boolean' ? value : undefined;
    },
    getNumber: key => {
      const value = store.get(key);
      return typeof value === 'number' ? value : undefined;
    },
    contains: key => store.has(key),
    remove: key => store.delete(key),
    getAllKeys: () => Array.from(store.keys()),
    clearAll: () => store.clear(),
  };
}

module.exports = { createMMKV };
