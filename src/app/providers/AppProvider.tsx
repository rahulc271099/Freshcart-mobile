import React, { type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { QueryProvider } from './QueryProvider';

/**
 * Single composition root for every app-wide provider. Anything new that
 * needs to wrap the whole app (theme provider, once the centralized theme
 * system exists; error boundary; etc.) is added here, in one place, rather
 * than in `App.tsx` directly.
 */
export function AppProvider({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryProvider>{children}</QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
