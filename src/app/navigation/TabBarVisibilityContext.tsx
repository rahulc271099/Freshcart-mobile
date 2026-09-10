import React, {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

interface TabBarVisibilityContextValue {
  /** 1 = fully visible, 0 = fully hidden. Driven by scroll position on tab screens. */
  visibility: SharedValue<number>;
}

const TabBarVisibilityContext =
  createContext<TabBarVisibilityContextValue | null>(null);

/**
 * Shares a single Reanimated `SharedValue` between `AppTabs` (which renders
 * the floating tab bar) and the screens nested inside it (which drive the
 * value from their own scroll position).
 *
 * These two live in different parts of the tree - this provider wraps
 * `AppTabs` from `MainNavigator`, and the screens are `AppTabs`' own
 * descendants - so plain props can't connect them. A Context carrying a
 * Reanimated shared value can, and updates on the UI thread every scroll
 * frame without triggering a React re-render.
 */
export function TabBarVisibilityProvider({ children }: PropsWithChildren) {
  const visibility = useSharedValue(1);
  const value = useMemo(() => ({ visibility }), [visibility]);

  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility(): SharedValue<number> {
  const ctx = useContext(TabBarVisibilityContext);
  if (!ctx) {
    throw new Error(
      'useTabBarVisibility must be used within a TabBarVisibilityProvider',
    );
  }
  return ctx.visibility;
}
