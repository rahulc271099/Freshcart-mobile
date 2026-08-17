/**
 * FreshCart
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';

import { AppProvider } from '@/app/providers/AppProvider';
import { RootNavigator } from '@/app/navigation/RootNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <AppProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </AppProvider>
  );
}

export default App;
