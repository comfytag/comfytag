declare const self: ServiceWorkerGlobalScope

// Handle incoming push messages — fires even when the tab is closed
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}

  const title: string = data.title ?? 'ComfyTag'
  const options: NotificationOptions = {
    body: data.message ?? '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.type ?? 'comfytag-notification',
    renotify: true,
    data: {
      url: data.data?.url ?? '/notifications',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle notification click — open or focus the relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl: string = event.notification.data?.url ?? '/notifications'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a tab is already open on the target URL, focus it
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise open a new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      })
  )
})
