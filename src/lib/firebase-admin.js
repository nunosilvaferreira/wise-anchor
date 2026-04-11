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
  const projectId = readRuntimeEnv(["NEXT", "PUBLIC", "FIREBASE", "PROJECT", "ID"]);
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

export function getMissingFirebaseAdminConfigKeys() {
  const { clientEmail, privateKey, projectId } = getAdminConfig();
  const missingKeys = [];

  if (!projectId) {
    missingKeys.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  }

  if (!clientEmail) {
    missingKeys.push("FIREBASE_ADMIN_CLIENT_EMAIL");
  }

  if (!privateKey) {
    missingKeys.push("FIREBASE_ADMIN_PRIVATE_KEY");
  }

  return missingKeys;
}

export function isFirebaseAdminConfigured() {
  return getMissingFirebaseAdminConfigKeys().length === 0;
}

function getFirebaseAdminApp() {
  if (!isFirebaseAdminConfigured()) {
    const missingKeys = getMissingFirebaseAdminConfigKeys().join(", ");

    throw new Error(
      `Firebase Admin is not configured. Missing: ${missingKeys}.`
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
