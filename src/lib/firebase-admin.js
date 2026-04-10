import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

function getAdminConfig() {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    "";
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? "";
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "").replace(
    /\\n/g,
    "\n"
  );

  return {
    clientEmail,
    privateKey,
    projectId,
  };
}

export function isFirebaseAdminConfigured() {
  const { clientEmail, privateKey, projectId } = getAdminConfig();

  return Boolean(projectId && clientEmail && privateKey);
}

function getFirebaseAdminApp() {
  if (!isFirebaseAdminConfigured()) {
    throw new Error(
      "Firebase Admin is not configured. Add FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  if (getApps().length) {
    return getApps()[0];
  }

  const { clientEmail, privateKey, projectId } = getAdminConfig();

  return initializeApp({
    credential: cert({
      clientEmail,
      privateKey,
      projectId,
    }),
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAdminMessaging() {
  return getMessaging(getFirebaseAdminApp());
}
