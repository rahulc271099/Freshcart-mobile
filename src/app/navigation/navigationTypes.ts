import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Root-level switch between the unauthenticated and authenticated app.
 * Kept minimal on purpose — this is foundation wiring, not the real
 * screen set (that belongs to each feature once built).
 */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Home: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
