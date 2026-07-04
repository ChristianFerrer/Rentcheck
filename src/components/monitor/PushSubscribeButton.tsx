"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  maxPrice?: number;
  minSqm?: number;
  minBedrooms?: number;
}

type State = "idle" | "subscribed" | "denied" | "unsupported" | "loading";

export default function PushSubscribeButton({ maxPrice, minSqm, minBedrooms }: Props) {
  const [state, setState] = useState<State>("idle");
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      setRegistration(reg);
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setState("subscribed");
      });
    });
  }, []);

  async function subscribe() {
    if (!registration) return;
    setState("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("denied"); return; }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      await fetch("/api/monitor/push-subscribe", {
        method: "POST",
        headers,
        body: JSON.stringify({
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          max_price: maxPrice ?? null,
          min_sqm: minSqm ?? null,
          min_bedrooms: minBedrooms ?? null,
        }),
      });

      setState("subscribed");
    } catch {
      setState("idle");
    }
  }

  async function unsubscribe() {
    if (!registration) return;
    setState("loading");
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/monitor/push-subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setState("idle");
  }

  if (state === "unsupported") {
    return (
      <p className="text-sm text-gray-400">Tu navegador no soporta notificaciones push.</p>
    );
  }

  return (
    <button
      onClick={state === "subscribed" ? unsubscribe : subscribe}
      disabled={state === "loading"}
      className={state === "subscribed" ? "btn-secondary text-sm" : "btn-primary text-sm"}
    >
      {state === "loading" ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Configurando...
        </span>
      ) : state === "subscribed" ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5" />
          </svg>
          Activo · Cancelar alertas
        </span>
      ) : state === "denied" ? (
        "Notificaciones bloqueadas"
      ) : (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5" />
          </svg>
          Activar alertas push
        </span>
      )}
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
