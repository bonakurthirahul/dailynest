"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatTime } from "@/lib/format";
import type { AppNotification } from "@/lib/types";

// Real-time owner notification bell. Subscribes to the owner-audience
// notifications table and plays a short chime on new arrivals (only after the
// user has interacted with the page, per browser autoplay rules).
export function OwnerNotificationBell() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushState, setPushState] = useState<NotificationPermission | "unsupported">(
    "default"
  );
  const audioRef = useRef<AudioContext | null>(null);
  const armedRef = useRef(false);

  // Arm audio playback after the first user gesture (browser autoplay policy).
  useEffect(() => {
    function arm() {
      armedRef.current = true;
    }
    window.addEventListener("pointerdown", arm, { once: true });
    window.addEventListener("keydown", arm, { once: true });
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser capability detection
    setPushSupported(typeof window !== "undefined" && "Notification" in window);
    if (typeof window !== "undefined" && "Notification" in window) {
       
      setPushState(Notification.permission);
    }
  }, []);

  const playChime = useCallback(() => {
    if (!soundOn || !armedRef.current) return;
    try {
      const ctx =
        audioRef.current ??
        new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      audioRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch {
      // Audio is best-effort; never break the UI.
    }
  }, [soundOn]);

  // Load recent notifications + subscribe to realtime inserts.
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("audience", "owner")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!cancelled && data) setItems(data as AppNotification[]);
    }
    load();

    const channel = supabase
      .channel("owner-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: "audience=eq.owner",
        },
        (payload) => {
          if (cancelled || !payload.new) return;
          const note = payload.new as AppNotification;
          setItems((prev) => [note, ...prev].slice(0, 40));
          playChime();

          // Browser push, if permission has been granted and configured.
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted" &&
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          ) {
            try {
              new Notification(note.title, { body: note.body, tag: note.kind });
            } catch {
              // ignore
            }
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [playChime]);

  async function requestPush() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setPushState(permission);
  }

  const unread = items.filter((n) => !n.is_read).length;

  async function markAllRead() {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("audience", "owner")
      .eq("is_read", false);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-charcoal-soft transition-colors hover:border-forest hover:text-forest"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 21a1.9 1.9 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1 text-[0.65rem] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-extrabold text-charcoal">Notifications</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSoundOn((v) => !v)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                    soundOn
                      ? "border-forest bg-forest text-white"
                      : "border-line text-muted hover:border-forest hover:text-forest"
                  }`}
                  title={soundOn ? "Sound on" : "Sound off"}
                >
                  {soundOn ? "🔔" : "🔕"}
                </button>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs font-semibold text-forest hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <ul className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <li className="p-8 text-center text-sm text-muted">
                  No notifications yet. New orders will appear here instantly.
                </li>
              ) : (
                items.map((note) => (
                  <li
                    key={note.id}
                    className={`border-b border-line px-4 py-3 last:border-b-0 ${
                      note.is_read ? "opacity-70" : "bg-fresh/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-charcoal">{note.title}</p>
                      <span className="shrink-0 text-xs text-muted">
                        {formatTime(note.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{note.body}</p>
                    {note.order_id && (
                      <Link
                        href={`/store-control-7x9/dashboard/orders?order=${note.order_id}`}
                        onClick={() => setOpen(false)}
                        className="mt-1.5 inline-block text-xs font-semibold text-forest hover:underline"
                      >
                        View order →
                      </Link>
                    )}
                  </li>
                ))
              )}
            </ul>

            <div className="border-t border-line px-4 py-3">
              {pushSupported && pushState !== "granted" && (
                <button
                  type="button"
                  onClick={requestPush}
                  className="w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-charcoal-soft transition-colors hover:border-forest hover:text-forest"
                >
                  Enable browser push alerts
                </button>
              )}
              {pushSupported && pushState === "granted" && (
                <p className="text-center text-xs text-muted">
                  Browser push is enabled.
                </p>
              )}
              {!pushSupported && (
                <p className="text-center text-xs text-muted">
                  Browser push is not supported in this browser.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
