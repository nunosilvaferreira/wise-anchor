"use client";

import { firebaseApp, isFirebaseConfigured } from "./firebase";

const PUSH_TOKEN_STORAGE_KEY = "wise-anchor-caregiver-push-token";

function getVapidKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";
}

function getBrowserPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return window.Notification.permission;
}

function getStoredPushToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(PUSH_TOKEN_STORAGE_KEY) ?? "";
}

function persistPushToken(token) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
}

function clearStoredPushToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
}

async function callPushEndpoint(currentUser, path, { body = {}, method = "POST" } = {}) {
  if (!currentUser) {
    throw new Error("You need to be signed in first.");
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetch(path, {
    body: JSON.stringify(body),
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    method,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "Push request failed.");
  }

  return payload;
}

async function ensureMessagingSupport() {
  if (!firebaseApp || !isFirebaseConfigured) {
    throw new Error("Firebase is not configured for push notifications.");
  }

  if (!getVapidKey()) {
    throw new Error("Add NEXT_PUBLIC_FIREBASE_VAPID_KEY to enable push notifications.");
  }

  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }

  const { isSupported } = await import("firebase/messaging");

  if (!(await isSupported())) {
    throw new Error("This browser does not support Firebase push notifications.");
  }
}

async function getMessagingContext() {
  await ensureMessagingSupport();

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
    scope: "/",
  });
  const { getMessaging } = await import("firebase/messaging");

  return {
    messaging: getMessaging(firebaseApp),
    registration,
  };
}

export function getPushPermissionState() {
  return getBrowserPermission();
}

export function isPushConfigured() {
  return Boolean(isFirebaseConfigured && getVapidKey());
}

export async function isPushSupported() {
  if (!isPushConfigured()) {
    return false;
  }

  try {
    await ensureMessagingSupport();
    return true;
  } catch {
    return false;
  }
}

export async function ensureCaregiverPushRegistration(
  currentUser,
  { requestPermission = false } = {}
) {
  const permission =
    getBrowserPermission() === "granted"
      ? "granted"
      : requestPermission
        ? await window.Notification.requestPermission()
        : getBrowserPermission();

  if (permission !== "granted") {
    if (permission === "denied") {
      throw new Error("Browser notifications are blocked. Enable them in browser settings.");
    }

    return null;
  }

  const { getToken } = await import("firebase/messaging");
  const { messaging, registration } = await getMessagingContext();
  const token = await getToken(messaging, {
    serviceWorkerRegistration: registration,
    vapidKey: getVapidKey(),
  });

  if (!token) {
    throw new Error("Firebase did not return a device push token.");
  }

  await callPushEndpoint(currentUser, "/api/push/register", {
    body: {
      platform:
        navigator.userAgentData?.platform ?? navigator.platform ?? "unknown",
      scope: "caregiver-dashboard",
      token,
      userAgent: navigator.userAgent,
    },
  });
  persistPushToken(token);

  return token;
}

export async function unregisterStoredCaregiverPush(currentUser) {
  const storedToken = getStoredPushToken();

  if (!storedToken || !currentUser) {
    clearStoredPushToken();
    return;
  }

  await callPushEndpoint(currentUser, "/api/push/register", {
    body: {
      token: storedToken,
    },
    method: "DELETE",
  });
  clearStoredPushToken();
}

export async function sendCaregiverPushTest(currentUser) {
  return callPushEndpoint(currentUser, "/api/push/test");
}

export async function sendCaregiverAlert(currentUser, payload) {
  return callPushEndpoint(currentUser, "/api/push/alert", {
    body: payload,
  });
}

export async function subscribeToForegroundMessages(handleMessage) {
  try {
    const { messaging } = await getMessagingContext();
    const { onMessage } = await import("firebase/messaging");

    return onMessage(messaging, (payload) => {
      handleMessage(payload);
    });
  } catch {
    return () => {};
  }
}
