import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
  getFirebaseAdminMessaging,
  isFirebaseAdminConfigured,
} from "./firebase-admin";

const STALE_TOKEN_ERRORS = new Set([
  "messaging/invalid-argument",
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

function createTokenDocumentId(token) {
  return createHash("sha256").update(token).digest("hex");
}

function jsonResponse(payload, status = 200) {
  return NextResponse.json(payload, { status });
}

export function pushConfigErrorResponse() {
  return jsonResponse(
    {
      error:
        "Firebase Admin is not configured. Add NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.",
    },
    503
  );
}

export async function verifyRequestUser(request) {
  if (!isFirebaseAdminConfigured()) {
    return {
      errorResponse: pushConfigErrorResponse(),
      user: null,
    };
  }

  const authorizationHeader = request.headers.get("authorization") ?? "";
  const idToken = authorizationHeader.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length)
    : "";

  if (!idToken) {
    return {
      errorResponse: jsonResponse({ error: "Missing Firebase ID token." }, 401),
      user: null,
    };
  }

  try {
    const user = await getFirebaseAdminAuth().verifyIdToken(idToken);
    return {
      errorResponse: null,
      user,
    };
  } catch {
    return {
      errorResponse: jsonResponse({ error: "Invalid or expired Firebase ID token." }, 401),
      user: null,
    };
  }
}

export async function upsertPushToken(uid, tokenPayload) {
  const tokenId = createTokenDocumentId(tokenPayload.token);
  const timestamp = new Date().toISOString();

  await getFirebaseAdminDb()
    .collection("users")
    .doc(uid)
    .collection("pushTokens")
    .doc(tokenId)
    .set(
      {
        ...tokenPayload,
        createdAt: tokenPayload.createdAt ?? timestamp,
        updatedAt: timestamp,
      },
      { merge: true }
    );

  return tokenId;
}

export async function deletePushToken(uid, token) {
  const tokenId = createTokenDocumentId(token);

  await getFirebaseAdminDb()
    .collection("users")
    .doc(uid)
    .collection("pushTokens")
    .doc(tokenId)
    .delete();
}

export async function getUserDocument(uid) {
  return getFirebaseAdminDb().collection("users").doc(uid).get();
}

export async function getProfileDocument(profileId) {
  return getFirebaseAdminDb().collection("profiles").doc(profileId).get();
}

export async function sendPushToUser({
  body,
  data = {},
  link,
  requireInteraction = false,
  title,
  uid,
}) {
  const tokensSnapshot = await getFirebaseAdminDb()
    .collection("users")
    .doc(uid)
    .collection("pushTokens")
    .get();

  if (tokensSnapshot.empty) {
    return {
      failureCount: 0,
      skipped: "no_registered_tokens",
      successCount: 0,
    };
  }

  const tokenDocs = tokensSnapshot.docs.filter((snapshot) => {
    const token = snapshot.data().token;
    return typeof token === "string" && token.length > 0;
  });

  if (!tokenDocs.length) {
    return {
      failureCount: 0,
      skipped: "no_registered_tokens",
      successCount: 0,
    };
  }

  const tokens = tokenDocs.map((snapshot) => snapshot.data().token);
  const response = await getFirebaseAdminMessaging().sendEachForMulticast({
    data: Object.fromEntries(
      Object.entries({
        ...data,
        link,
      }).map(([key, value]) => [key, value == null ? "" : String(value)])
    ),
    notification: {
      body,
      title,
    },
    tokens,
    webpush: {
      fcmOptions: {
        link,
      },
      notification: {
        badge: "/wiseanchor-logo.png",
        body,
        icon: "/wiseanchor-logo.png",
        requireInteraction,
        tag: data.alertType ?? "wiseanchor-alert",
        title,
      },
    },
  });

  const staleRefs = response.responses.flatMap((result, index) => {
    const errorCode = result.error?.code;

    if (!errorCode || !STALE_TOKEN_ERRORS.has(errorCode)) {
      return [];
    }

    return [tokenDocs[index].ref];
  });

  if (staleRefs.length) {
    await Promise.all(staleRefs.map((reference) => reference.delete()));
  }

  return {
    failureCount: response.failureCount,
    successCount: response.successCount,
  };
}
