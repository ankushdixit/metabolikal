/* eslint-env serviceworker */
/* eslint-disable @typescript-eslint/no-unused-vars, no-undef */
// Service Worker for Metabolikal PWA
// Handles push notifications and notification clicks

const CACHE_NAME = "metabolikal-v1";

// Install event - skip waiting to activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate event - claim all clients
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Push event - show notification
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/icons/icon-192x192.svg",
      badge: data.badge || "/icons/icon-72x72.svg",
      tag: data.tag || "default",
      data: data.data || {},
      vibrate: [100, 50, 100],
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (error) {
    console.error("Push event error:", error);
  }
});

// Notification click - open app to relevant page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus().then(() => {
            if ("navigate" in client) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }
      // Open new window if no existing window found
      return clients.openWindow(urlToOpen);
    })
  );
});

// Handle notification close (could be used for analytics)
self.addEventListener("notificationclose", (event) => {
  // Could send analytics here if needed
});
