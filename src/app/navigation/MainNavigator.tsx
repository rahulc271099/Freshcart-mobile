import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ComingSoonScreen } from '../../components/ComingSoonScreen';
import type { MainTabParamList } from './navigationTypes';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Authenticated bottom-tab shell. Only `Home` exists so far — the rest of
 * the tabs (cart, orders, profile, ...) get added once those features are
 * actually built, not as empty placeholders now.
 */
export function MainNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home">
        {() => <ComingSoonScreen label="Home" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
