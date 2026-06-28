'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'

// Rendered once at the root level (inside SessionProvider + providers.tsx).
// Calls usePushNotifications which requests push permission and registers
// the browser subscription with the backend.
// Renders nothing — purely a hook runner.
export function PushNotificationInit() {
  usePushNotifications()
  return null
}
