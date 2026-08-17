import {
  getMessaging,
  requestPermission as requestMessagingPermission,
  setBackgroundMessageHandler,
  AuthorizationStatus,
  type RemoteMessage,
} from '@react-native-firebase/messaging';

/**
 * Firebase Cloud Messaging foundation. Uses RNFB v26's modular API
 * (`getMessaging()` + free functions) — the older `messaging()` default
 * export/namespaced API used pre-v26 no longer exists.
 *
 * IMPORTANT — pending external setup: none of the functions below will
 * work until a real Firebase project is connected:
 *   - Android: drop a real `google-services.json` into `android/app/`
 *     (see `android/app/google-services.json.example`) and apply the
 *     Google Services Gradle plugin (see the TODOs left in
 *     `android/build.gradle` and `android/app/build.gradle`).
 *   - iOS: add a real `GoogleService-Info.plist` to the Xcode project (see
 *     `ios/FreshCart/GoogleService-Info.plist.example`) and enable the Push
 *     Notifications + Background Modes (remote notification) capabilities
 *     in Xcode — this can't be scripted from outside Xcode.
 *
 * Deliberately not wired into app startup yet — calling these against an
 * unconfigured Firebase app would throw at runtime. Call
 * `registerBackgroundHandler()` once (from `index.js`, before
 * `AppRegistry.registerComponent`) and `requestNotificationPermission()`
 * from wherever the notifications feature ends up living, once real
 * credentials are in place.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const authStatus = await requestMessagingPermission(getMessaging());
  return (
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL
  );
}

export function registerBackgroundHandler(
  onMessage: (message: RemoteMessage) => Promise<void> | void,
): void {
  setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
    await onMessage(remoteMessage);
  });
}
