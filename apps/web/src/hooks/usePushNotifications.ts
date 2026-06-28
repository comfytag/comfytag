import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

// Convert the URL-safe base64 VAPID public key to the Uint8Array format
// that the browser's PushManager.subscribe() expects.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

async function syncSubscriptionWithServer(subscription: PushSubscription) {
  const sub = subscription.toJSON()
  await api.post('/notification/web-push/subscribe', {
    endpoint: sub.endpoint,
    keys: sub.keys,
  })
}

export async function unregisterPushSubscription() {
  if (!('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return
    await api.delete('/notification/web-push/unsubscribe', {
      data: { endpoint: subscription.endpoint },
    })
    await subscription.unsubscribe()
  } catch {
    // Best-effort cleanup — ignore errors on logout
  }
}

// Call this hook once at the root level (inside SessionProvider).
// It requests push permission on first authenticated load and sends
// the subscription to the backend so notifications reach the user
// even when the tab is closed.
export const usePushNotifications = () => {
  const { status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated') return
    if (!VAPID_PUBLIC_KEY) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission === 'denied') return

    const subscribe = async () => {
      try {
        const registration = await navigator.serviceWorker.ready

        const existing = await registration.pushManager.getSubscription()
        if (existing) {
          // Already subscribed — ensure backend has this subscription on record
          await syncSubscriptionWithServer(existing)
          return
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        await syncSubscriptionWithServer(subscription)
      } catch {
        // Permission denied or browser error — silently skip
      }
    }

    subscribe()
  }, [status])
}
