import React, { type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/theme';

import { QueryProvider } from './QueryProvider';

/**
 * Single composition root for every app-wide provider. Anything new that
 * needs to wrap the whole app (error boundary, etc.) is added here, in one
 * place, rather than in `App.tsx` directly.
 *
 * `ThemeProvider` sits above `SafeAreaProvider`/`QueryProvider` — neither
 * of those reads theme, but plenty of things that render inside them will.
 */
export function AppProvider({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <SafeAreaProvider>
          <QueryProvider>{children}</QueryProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
