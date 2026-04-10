import {
  deletePushToken,
  upsertPushToken,
  verifyRequestUser,
} from "../../../../lib/push-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getTokenFromPayload(payload) {
  return typeof payload?.token === "string" ? payload.token.trim() : "";
}

export async function POST(request) {
  const { errorResponse, user } = await verifyRequestUser(request);

  if (errorResponse) {
    return errorResponse;
  }

  const payload = await request.json().catch(() => null);
  const token = getTokenFromPayload(payload);

  if (!token) {
    return Response.json({ error: "A device push token is required." }, { status: 400 });
  }

  await upsertPushToken(user.uid, {
    platform:
      typeof payload?.platform === "string" ? payload.platform.trim() : "unknown",
    scope: typeof payload?.scope === "string" ? payload.scope.trim() : "caregiver-dashboard",
    token,
    userAgent: typeof payload?.userAgent === "string" ? payload.userAgent : "",
  });

  return Response.json({
    ok: true,
  });
}

export async function DELETE(request) {
  const { errorResponse, user } = await verifyRequestUser(request);

  if (errorResponse) {
    return errorResponse;
  }

  const payload = await request.json().catch(() => null);
  const token = getTokenFromPayload(payload);

  if (!token) {
    return Response.json({ error: "A device push token is required." }, { status: 400 });
  }

  await deletePushToken(user.uid, token);

  return Response.json({
    ok: true,
  });
}
