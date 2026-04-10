import {
  getProfileDocument,
  sendPushToUser,
  verifyRequestUser,
} from "../../../../lib/push-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildFeelingBody(fullName, feelingLabel) {
  return `${fullName} reported feeling ${feelingLabel}. Open the caregiver area to review their current state.`;
}

function buildSosBody(fullName) {
  return `${fullName} triggered the SOS button and needs caregiver support now.`;
}

export async function POST(request) {
  const { errorResponse, user } = await verifyRequestUser(request);

  if (errorResponse) {
    return errorResponse;
  }

  const payload = await request.json().catch(() => null);
  const profileId = typeof payload?.profileId === "string" ? payload.profileId.trim() : "";
  const alertType = typeof payload?.alertType === "string" ? payload.alertType.trim() : "";

  if (!profileId || !alertType) {
    return Response.json(
      {
        error: "profileId and alertType are required.",
      },
      { status: 400 }
    );
  }

  const profileSnapshot = await getProfileDocument(profileId);

  if (!profileSnapshot.exists) {
    return Response.json({ error: "Profile not found." }, { status: 404 });
  }

  const profile = profileSnapshot.data();
  const isAuthorized =
    profile.ownerUid === user.uid || profile.caregiverUid === user.uid;

  if (!isAuthorized) {
    return Response.json(
      {
        error: "You are not allowed to send alerts for this profile.",
      },
      { status: 403 }
    );
  }

  const caregiverUid =
    typeof profile.caregiverUid === "string" ? profile.caregiverUid : "";

  if (!caregiverUid) {
    return Response.json({
      ok: true,
      skipped: "no_caregiver_link",
    });
  }

  const fullName =
    typeof profile.fullName === "string" && profile.fullName.trim()
      ? profile.fullName.trim()
      : "The dependent";
  const feelingLabel =
    typeof payload?.feelingLabel === "string" && payload.feelingLabel.trim()
      ? payload.feelingLabel.trim().toLowerCase()
      : "urgent";
  const link = new URL("/caregiver", request.url).toString();
  const title =
    alertType === "sos"
      ? `${fullName} needs support`
      : `${fullName} reported an urgent feeling`;
  const body =
    alertType === "sos"
      ? buildSosBody(fullName)
      : buildFeelingBody(fullName, feelingLabel);
  const result = await sendPushToUser({
    body,
    data: {
      alertType,
      feelingLabel,
      profileId,
      route: "/caregiver",
    },
    link,
    requireInteraction: alertType === "sos",
    title,
    uid: caregiverUid,
  });

  return Response.json({
    ok: true,
    ...result,
  });
}
