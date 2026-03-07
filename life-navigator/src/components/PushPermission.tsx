"use client";
import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushPermission() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "default") {
      setShow(true);
    }
  }, []);

  async function subscribe() {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setShow(false);
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-blue-600 text-white rounded-xl p-4 shadow-lg z-50 max-w-lg mx-auto">
      <p className="text-sm font-bold mb-1">朝・夜にリマインドしますか？</p>
      <p className="text-xs mb-3 opacity-90">通知をONにすると、毎朝最優先事項の設定・毎晩振り返りをお知らせします</p>
      <div className="flex gap-2">
        <button
          onClick={subscribe}
          className="flex-1 bg-white text-blue-600 font-bold text-sm py-2 rounded-lg"
        >
          通知をON
        </button>
        <button
          onClick={() => setShow(false)}
          className="flex-1 bg-blue-500 text-white text-sm py-2 rounded-lg"
        >
          あとで
        </button>
      </div>
    </div>
  );
}
