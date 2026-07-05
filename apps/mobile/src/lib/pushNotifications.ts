// Requires expo-notifications (already in SDK 54) and expo-device
// If expo-device is missing: pnpm add expo-device  (in apps/mobile/)
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { post } from './api'

// ─── Foreground handler ───────────────────────────────────────────────────────
// Call once before NavigationContainer mounts (in App.tsx module scope).

export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}

// ─── Register device for push notifications ──────────────────────────────────
// Call after the user logs in. Silently fails on simulators.

export async function registerForPushNotifications(userId: string): Promise<void> {
  try {
    // Android requires a notification channel before getting a token
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'ComfyTag',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
      })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') return

    // getExpoPushTokenAsync throws on simulators — caught below
    const { data: token } = await Notifications.getExpoPushTokenAsync()

    await post('/notification/token', {
      userId,
      token,
      platform: Platform.OS,
    })
  } catch {
    // Silently fail: simulators don't support push tokens
  }
}
