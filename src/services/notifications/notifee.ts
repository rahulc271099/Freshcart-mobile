import notifee, { AndroidImportance } from '@notifee/react-native';

/**
 * Notification *presentation* layer (Notifee). This only concerns how a
 * notification is displayed once received — it does not fetch/receive
 * anything itself. Delivery comes from Firebase Messaging
 * (`services/notifications/firebaseMessaging.ts`), which should hand its
 * payloads to `displayOrderNotification` below.
 *
 * No order-lifecycle business logic (which channel for which order event,
 * copy/wording, deep-link targets) is implemented yet — this only sets up
 * the one default channel Android requires before any notification can be
 * shown, per Notifee's own setup requirement. That requirement has nothing
 * to do with Firebase credentials, so it's safe to run with no external
 * config in place.
 */
export const DEFAULT_ANDROID_CHANNEL_ID = 'freshcart-default';

export async function ensureDefaultAndroidChannel(): Promise<void> {
  await notifee.createChannel({
    id: DEFAULT_ANDROID_CHANNEL_ID,
    name: 'General',
    importance: AndroidImportance.DEFAULT,
  });
}

export async function displayOrderNotification(title: string, body: string) {
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: DEFAULT_ANDROID_CHANNEL_ID,
    },
  });
}
