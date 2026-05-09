// Service Worker — Push Notifications
// Riceve push dal server e mostra notifiche native del browser.

self.addEventListener("push", (event) => {
  if (!event.data) return

  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  "/favicon.ico",
      badge: "/favicon.ico",
      tag:   data.tag ?? "invigitrack-reminder",
      data:  { url: data.url ?? "/dashboard/calendar" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const targetUrl = event.notification.data?.url ?? "/dashboard/calendar"

        // Se c'è già una finestra aperta, portala in primo piano e naviga
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus()
            client.navigate(targetUrl)
            return
          }
        }

        // Altrimenti apri una nuova finestra
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})
