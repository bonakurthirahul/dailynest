"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { Notification } from "@/lib/types";

const TYPE_ICONS: Record<string, string> = {
  new_order: "🧾",
  order_status: "📦",
  low_stock: "⚠️",
  order_rejected: "❌",
  order_cancelled: "🚫",
  payment_marked: "💰",
};

export function OwnerNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/owner/notifications");
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as { notifications: Notification[] };
      setNotifications(json.notifications);
      setError(null);
    } catch {
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch
    load();
  }, [load]);

  // Realtime: append new notifications as they arrive.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("owner-notifications-page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function markAllRead() {
    try {
      await fetch("/api/owner/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      setError("Could not mark notifications as read.");
    }
  }

  async function markRead(n: Notification) {
    if (n.is_read) return;
    try {
      await fetch("/api/owner/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: n.id }),
      });
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
      );
    } catch {
      /* noop */
    }
  }

  async function clearAll() {
    if (!window.confirm("Delete all notifications? This cannot be undone.")) return;
    try {
      await fetch("/api/owner/notifications", { method: "DELETE" });
      setNotifications([]);
    } catch {
      setError("Could not clear notifications.");
    }
  }

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-charcoal">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted">
            {unread > 0
              ? `${unread} unread notification${unread === 1 ? "" : "s"}.`
              : "You are all caught up."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={markAllRead}
            disabled={unread === 0}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-charcoal-soft transition-colors hover:border-forest hover:text-forest disabled:opacity-40"
          >
            Mark all read
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-40"
          >
            Clear all
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-line/60" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-14 text-center">
          <span className="text-5xl" aria-hidden="true">🔔</span>
          <p className="mt-3 font-bold text-charcoal">No notifications</p>
          <p className="mt-1 text-sm text-muted">
            You will see alerts for new orders, low stock, and important events
            here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              onClick={() => markRead(n)}
              className={`card flex cursor-pointer items-start gap-3 p-4 transition-colors ${
                n.is_read ? "opacity-60" : "border-l-4 border-l-forest"
              }`}
            >
              <span className="mt-0.5 text-xl" aria-hidden="true">
                {TYPE_ICONS[n.kind] ?? "🔔"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-charcoal">{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                <p className="mt-1 text-xs text-muted">{formatDate(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-forest"
                  aria-label="Unread"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
