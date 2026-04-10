import { NextResponse } from "next/server";

const FIREBASE_CLIENT_VERSION = "12.11.0";

function getFirebaseClientConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  };
}

function buildServiceWorkerSource() {
  const firebaseConfig = getFirebaseClientConfig();
  const hasConfig = Object.values(firebaseConfig).every((value) => Boolean(value));

  if (!hasConfig) {
    return `self.addEventListener("push", () => {});`;
  }

  return `
importScripts("https://www.gstatic.com/firebasejs/${FIREBASE_CLIENT_VERSION}/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/${FIREBASE_CLIENT_VERSION}/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(firebaseConfig)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || "WiseAnchor alert";
  const options = {
    badge: data.badge || "/wiseanchor-logo.png",
    body: notification.body || "New caregiver notification.",
    data: {
      link: data.link || "/caregiver",
    },
    icon: data.icon || "/wiseanchor-logo.png",
    requireInteraction: data.alertType === "sos",
    tag: data.alertType || "wiseanchor-alert",
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.link || "/caregiver",
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({ includeUncontrolled: true, type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
`;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return new NextResponse(buildServiceWorkerSource(), {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/javascript; charset=utf-8",
    },
  });
}
