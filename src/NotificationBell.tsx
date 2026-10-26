/**
 * NotificationBell.tsx
 *
 * Drop-in replacement for the bare bell button in DashboardHeader.
 * - Fetches unread notifications for the current user on mount
 * - Subscribes to Supabase Realtime for live updates
 * - Shows a gold dot badge for unread count
 * - Clicking opens a dropdown panel with all notifications
 * - Clicking a notification marks it read and follows its link
 * - "Mark all read" button
 *
 * USAGE — in HostDashboard.tsx, replace the bare bell <button> with:
 *
 *   import NotificationBell from "./NotificationBell";
 *   ...
 *   <NotificationBell userId={user!.id} isGuest={isGuest} />
 *
 * The `pending` prop passed to DashboardHeader can stay for bookings badge
 * or be removed — this component is self-contained.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  BellIcon,
  CheckCircleIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "./index";

/* ── types ─────────────────────────────────────────────────── */
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

function toNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    title: row.title as string,
    body: row.body as string,
    link: row.link as string,
    read: row.read as boolean,
    createdAt: row.created_at as string,
  };
}

/* ── icon per notification type ────────────────────────────── */
function NotifIcon({ type, isGuest }: { type: string; isGuest: boolean }) {
  const gold = isGuest ? "#6EADC9" : "#C9A96E";
  const size = { width: 16, height: 16 };
  if (type === "booking_confirmed")
    return <CalendarDaysIcon style={{ ...size, color: gold }} />;
  if (type === "payment")
    return <CreditCardIcon style={{ ...size, color: gold }} />;
  if (type === "subscription")
    return <ShieldCheckIcon style={{ ...size, color: gold }} />;
  return <CheckCircleIcon style={{ ...size, color: gold }} />;
}

/* ── time ago ───────────────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ── main component ─────────────────────────────────────────── */
export default function NotificationBell({
  userId,
  isGuest = false,
}: {
  userId: string;
  isGuest?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const gold = isGuest ? "#6EADC9" : "#C9A96E";
  const unread = notifications.filter((n) => !n.read).length;

  /* ── fetch ─────────────────────────────────────────────── */
  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setNotifications(data.map(toNotification));
    setLoading(false);
  }, [userId]);

  /* ── realtime subscription ─────────────────────────────── */
  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [
            toNotification(payload.new as Record<string, unknown>),
            ...prev,
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  /* ── close on outside click ────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* ── mark one read ─────────────────────────────────────── */
  const markRead = async (notif: Notification) => {
    if (!notif.read) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
      );
    }
    if (notif.link) {
      setOpen(false);
      // Navigate — works with react-router or plain href
      window.location.href = notif.link;
    }
  };

  /* ── mark all read ─────────────────────────────────────── */
  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  /* ── render ────────────────────────────────────────────── */
  return (
    <div style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <BellIcon className="w-4 h-4" />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: gold,
              border: "2px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 360,
            maxHeight: 480,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid #f3f4f6",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                Notifications
              </span>
              {unread > 0 && (
                <span
                  style={{
                    background: gold,
                    color: "#fff",
                    borderRadius: 99,
                    padding: "1px 7px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {unread}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    color: gold,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 6px",
                  }}
                >
                  <CheckIcon style={{ width: 12, height: 12 }} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                }}
              >
                <XMarkIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "32px 16px",
                  color: "#9ca3af",
                  fontSize: 13,
                }}
              >
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 16px",
                  gap: 8,
                }}
              >
                <BellIcon style={{ width: 28, height: 28, color: "#d1d5db" }} />
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#9ca3af",
                    textAlign: "center",
                  }}
                >
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => markRead(notif)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 16px",
                    background: notif.read ? "#fff" : `${gold}0d`, // ~5% tint
                    border: "none",
                    borderBottom: "1px solid #f3f4f6",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      notif.read ? "#fff" : `${gold}0d`;
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: `${gold}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <NotifIcon type={notif.type} isGuest={isGuest} />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: notif.read ? 500 : 700,
                        color: "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {notif.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        marginTop: 2,
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {notif.body}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}
                    >
                      {timeAgo(notif.createdAt)}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: gold,
                        flexShrink: 0,
                        marginTop: 6,
                      }}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
