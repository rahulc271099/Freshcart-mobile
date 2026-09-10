/**
 * FreshCart
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';

import { AppProvider } from '@/app/providers/AppProvider';
import { RootNavigator } from '@/app/navigation/RootNavigator';
import { useTheme } from '@/theme';

/**
 * Split out from `App` so it renders *inside* `AppProvider` — `useTheme()`
 * needs the `ThemeProvider` above it in the tree, which `App` itself is
 * outside of.
 */
function AppContent() {
  const { dark } = useTheme();

  return (
    <>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
