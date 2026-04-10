import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

function readRuntimeEnv(parts) {
  const key = parts.join("_");
  const value = Reflect.get(process.env, key);

  return typeof value === "string" ? value : "";
}

function getAdminConfig() {
  const projectId =
    readRuntimeEnv(["FIREBASE", "ADMIN", "PROJECT", "ID"]) ||
    readRuntimeEnv(["NEXT", "PUBLIC", "FIREBASE", "PROJECT", "ID"]);
  const clientEmail = readRuntimeEnv(["FIREBASE", "ADMIN", "CLIENT", "EMAIL"]);
  const privateKey = readRuntimeEnv(["FIREBASE", "ADMIN", "PRIVATE", "KEY"]).replace(
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
