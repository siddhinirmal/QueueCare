export function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

export function showBrowserNotification(title: string, body: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      icon: "/icons.svg",
    });
  } catch {
    // Some browsers (notably iOS Safari) don't support the constructor
    // directly; fail silently rather than break the app.
  }
}