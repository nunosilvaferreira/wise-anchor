import {
  getUserDocument,
  sendPushToUser,
  verifyRequestUser,
} from "../../../../lib/push-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const { errorResponse, user } = await verifyRequestUser(request);

  if (errorResponse) {
    return errorResponse;
  }

  const userSnapshot = await getUserDocument(user.uid);
  const role = userSnapshot.data()?.role;

  if (role !== "caregiver") {
    return Response.json(
      {
        error: "Only caregiver accounts can register caregiver push alerts.",
      },
      { status: 403 }
    );
  }

  const link = new URL("/caregiver", request.url).toString();
  const result = await sendPushToUser({
    body: "This is a test notification from WiseAnchor caregiver alerts.",
    data: {
      alertType: "test",
      route: "/caregiver",
    },
    link,
    title: "WiseAnchor test notification",
    uid: user.uid,
  });

  return Response.json({
    ok: true,
    ...result,
  });
}
