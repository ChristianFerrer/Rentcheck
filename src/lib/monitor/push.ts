import webpush from "web-push";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails("mailto:admin@rentcheck.app", VAPID_PUBLIC, VAPID_PRIVATE);
}

export interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  icon?: string;
}

export async function sendPush(sub: PushSubscription, payload: PushPayload): Promise<void> {
  await webpush.sendNotification(
    {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth_key },
    },
    JSON.stringify(payload),
    { TTL: 86400 }
  );
}
