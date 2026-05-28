// src/Components/MessagesInbox.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Drop-in replacement for the <Messages /> placeholder in Dashboard.tsx.
// Handles host inbox AND guest sent messages in one component.
// Import and swap:
//   import MessagesInbox from "./Components/MessagesInbox";
//   // replace <Messages /> with <MessagesInbox />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../AuthContext";
import { MessagesDB, type Conversation, type Message } from "../index";
import { supabase } from "../index";

/* ── helpers ── */
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const Avatar = ({
  name,
  size = 10,
  accent = "#C9A96E",
}: {
  name: string;
  size?: number;
  accent?: string;
}) => (
  <div
    style={{
      width: size * 4,
      height: size * 4,
      borderRadius: "50%",
      background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: size * 1.5,
      color: "#fff",
      flexShrink: 0,
    }}
  >
    {name?.[0]?.toUpperCase() ?? "?"}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function MessagesInbox() {
  const { user } = useAuth();
  const role = (user?.role ?? "guest") as "host" | "guest";
  const accent = role === "host" ? "#C9A96E" : "#6EADC9";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── load conversations ── */
  useEffect(() => {
    if (!user) return;
    MessagesDB.conversationsByUser(user.id, role)
      .then(setConversations)
      .finally(() => setLoadingConvs(false));
  }, [user, role]);

  /* ── Realtime: inbox badge updates ── */
  useEffect(() => {
    if (!user) return;
    const channel = MessagesDB.subscribeToInbox(user.id, role, (updated) => {
      setConversations((prev) =>
        prev
          .map((c) => (c.id === updated.id ? updated : c))
          .sort(
            (a, b) =>
              new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
          ),
      );
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);

  /* ── load messages for selected conversation ── */
  useEffect(() => {
    if (!selected) return;
    setLoadingMsgs(true);
    MessagesDB.messagesByConversation(selected.id)
      .then(setMessages)
      .finally(() => setLoadingMsgs(false));
    MessagesDB.markRead(selected.id, role);
    // Clear unread badge locally
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              unreadHost: role === "host" ? 0 : c.unreadHost,
              unreadGuest: role === "guest" ? 0 : c.unreadGuest,
            }
          : c,
      ),
    );
  }, [selected, role]);

  /* ── Realtime: new messages in open conversation ── */
  useEffect(() => {
    if (!selected) return;
    const channel = MessagesDB.subscribeToConversation(selected.id, (msg) => {
      setMessages((prev) => {
        // Avoid duplicates (optimistic + realtime)
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Mark read immediately if it's from the other side
      if (msg.senderRole !== role) {
        MessagesDB.markRead(selected.id, role);
      }
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected, role]);

  /* ── scroll to bottom on new messages ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── send ── */
  const send = async () => {
    if (!draft.trim() || !selected || !user) return;
    const body = draft.trim();
    setDraft("");
    setSending(true);

    // Optimistic update
    const optimistic: Message = {
      id: `opt_${Date.now()}`,
      conversationId: selected.id,
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      senderAvatar: user.avatar ?? user.firstName?.[0] ?? "",
      senderRole: role,
      body,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const real = await MessagesDB.sendMessage({
        conversationId: selected.id,
        senderId: user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        senderAvatar: user.avatar ?? user.firstName?.[0] ?? "",
        senderRole: role,
        body,
      });
      // Replace optimistic with real
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? real : m)),
      );
      // Update conversation last message
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === selected.id
              ? { ...c, lastMessage: body, lastAt: real.createdAt }
              : c,
          )
          .sort(
            (a, b) =>
              new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
          ),
      );
    } catch (e) {
      console.error("send failed", e);
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(body); // restore
    } finally {
      setSending(false);
    }
  };

  const filteredConvs = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.guestName.toLowerCase().includes(q) ||
      c.hostName.toLowerCase().includes(q) ||
      c.listingName.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  });

  const otherName = (c: Conversation) =>
    role === "host" ? c.guestName : c.hostName;

  const unreadCount = (c: Conversation) =>
    role === "host" ? c.unreadHost : c.unreadGuest;

  const totalUnread = conversations.reduce((s, c) => s + unreadCount(c), 0);

  /* ── Empty state ── */
  if (!loadingConvs && conversations.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-10 text-center"
        style={{ animation: "fadeUp 0.3s ease both" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: `${accent}18`,
            border: `1px solid ${accent}30`,
          }}
        >
          <ChatBubbleLeftRightIcon
            className="w-7 h-7"
            style={{ color: accent }}
          />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          No messages yet
        </h2>
        <p className="text-gray-400 text-sm max-w-xs">
          {role === "host"
            ? "When guests message you about a property, their conversations will appear here."
            : "Start a conversation with a host from the booking page."}
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex overflow-hidden bg-gray-50"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      {/* ── Conversation list ── */}
      <div
        className={`flex flex-col bg-white border-r border-gray-100 shrink-0 ${selected ? "hidden md:flex" : "flex"} w-full md:w-80`}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">
              Messages
              {totalUnread > 0 && (
                <span
                  className="ml-2 text-xs font-bold text-white px-2 py-0.5 rounded-full"
                  style={{ background: accent }}
                >
                  {totalUnread}
                </span>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <XMarkIcon className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loadingConvs
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="p-4 flex gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                  </div>
                </div>
              ))
            : filteredConvs.map((c) => {
                const unread = unreadCount(c);
                const isActive = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-gray-50 ${isActive ? "bg-gray-50" : ""}`}
                  >
                    <Avatar name={otherName(c)} size={10} accent={accent} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p
                          className={`text-sm truncate ${unread > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}
                        >
                          {otherName(c)}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {fmtTime(c.lastAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mb-0.5">
                        {c.listingName}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-xs truncate ${unread > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}
                        >
                          {c.lastMessage || "No messages yet"}
                        </p>
                        {unread > 0 && (
                          <span
                            className="text-[10px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: accent }}
                          >
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
        </div>
      </div>

      {/* ── Message thread ── */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Thread header */}
          <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-3 shrink-0">
            <button
              onClick={() => setSelected(null)}
              className="md:hidden w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 mr-1"
            >
              ←
            </button>
            <Avatar name={otherName(selected)} size={9} accent={accent} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">
                {otherName(selected)}
              </p>
              <p className="text-xs text-gray-400 truncate">
                Re: {selected.listingName}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-gray-50">
            {loadingMsgs
              ? [...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex ${i % 2 === 0 ? "" : "flex-row-reverse"} gap-2 animate-pulse`}
                  >
                    <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
                    <div
                      className="h-10 rounded-2xl bg-gray-200"
                      style={{ width: `${40 + Math.random() * 30}%` }}
                    />
                  </div>
                ))
              : messages.map((m) => {
                  const isMe = m.senderId === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}
                    >
                      {!isMe && (
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: `${accent}20`,
                            border: `1px solid ${accent}30`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            fontSize: 11,
                            fontWeight: 700,
                            color: accent,
                            marginTop: 2,
                          }}
                        >
                          {m.senderName?.[0]?.toUpperCase() ?? (
                            <UserIcon style={{ width: 12, height: 12 }} />
                          )}
                        </div>
                      )}
                      <div
                        className={`flex flex-col gap-1 max-w-[70%] ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                          style={{
                            background: isMe ? accent : "#fff",
                            color: isMe
                              ? role === "host"
                                ? "#0e0d0b"
                                : "#fff"
                              : "#374151",
                            borderRadius: isMe
                              ? "18px 18px 4px 18px"
                              : "18px 18px 18px 4px",
                            border: isMe ? "none" : "1px solid #f3f4f6",
                            boxShadow: isMe
                              ? `0 4px 12px ${accent}30`
                              : "0 1px 4px rgba(0,0,0,0.05)",
                          }}
                        >
                          {m.body}
                        </div>
                        <span className="text-[10px] text-gray-400 px-1">
                          {fmtTime(m.createdAt)}
                          {isMe && (
                            <span className="ml-1">
                              {m.read ? " · Read" : " · Sent"}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-100 px-4 py-3 shrink-0">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder={`Reply to ${otherName(selected)}…`}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400"
                style={{ "--tw-ring-color": accent } as React.CSSProperties}
                onFocus={(e) => (e.target.style.borderColor = accent)}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
              <button
                onClick={send}
                disabled={!draft.trim() || sending}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: accent }}
              >
                {sending ? (
                  <span
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: "rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                    }}
                  />
                ) : (
                  <PaperAirplaneIcon className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* No conversation selected (desktop placeholder) */
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{
                background: `${accent}18`,
                border: `1px solid ${accent}30`,
              }}
            >
              <ChatBubbleLeftRightIcon
                className="w-6 h-6"
                style={{ color: accent }}
              />
            </div>
            <p className="text-gray-500 text-sm font-medium">
              Select a conversation
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Pick one from the left to start chatting
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
