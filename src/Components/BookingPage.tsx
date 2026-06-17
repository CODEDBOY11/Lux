import { useState, useEffect, useRef } from "react";
import { MessagesDB, type Conversation } from "../index";
import SEO from "../seo";
import { WalletDB } from "../index";
import {
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
  UserIcon,
  ShieldCheckIcon,
  HeartIcon,
  ShareIcon,
  ChevronDownIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import {
  StarIcon,
  HeartIcon as HeartSolid,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import { useAuth } from "../AuthContext";
import { BookingsDB, ReviewsDB, type Hotel, type Booking } from "../index";

declare global {
  interface Window {
    PaystackPop: {
      setup(options: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref: string;
        metadata?: Record<string, unknown>;
        onClose: () => void;
        callback: (response: { reference: string; status: string }) => void;
      }): { openIframe(): void };
    };
  }
}

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=75";
const getSafeImage = (url?: string) =>
  !url || url.includes("bing.com") ? DEFAULT_IMAGE : url;

const AMENITY_ICONS: Record<string, string> = {
  "Free WiFi": "📶",
  "Private Pool": "🏊",
  "Butler Service": "🛎",
  "Coral Reef Diving": "🤿",
  "Water Sports": "🚤",
  "Spa Island": "💆",
  "Sunset Cruise": "🌅",
  Aquarium: "🐠",
  "Airport Transfer": "✈️",
  "Fine Dining": "🍽",
  "Kids Club": "🧒",
  "Overwater Bungalow": "🌊",
  "Sea View": "🌊",
  "Air Conditioning": "❄️",
  BBQ: "🍖",
  "Wine Cellar": "🍷",
  Netflix: "🎬",
  "Daily Cleaning": "🧹",
  Gym: "🏋️",
  Parking: "🚗",
  Concierge: "🔔",
  "Hot Tub": "♨️",
};

function StarPicker({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);

        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            style={{
              background: "none",
              border: "none",
              padding: 2,
              cursor: "pointer",
              transform: hovered === star ? "scale(1.2)" : "scale(1)",
              transition: "transform 0.15s",
            }}
          >
            {filled ? (
              <StarIcon
                style={{ width: size, height: size, color: "#C9A96E" }}
              />
            ) : (
              <StarOutline
                style={{
                  width: size,
                  height: size,
                  color: "rgba(201,169,110,0.3)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function SubRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid rgba(245,240,232,0.06)",
      }}
    >
      <span style={{ fontSize: 13, color: "rgba(245,240,232,0.55)" }}>
        {label}
      </span>
      <StarPicker value={value} onChange={onChange} size={18} />
    </div>
  );
}

function GuestReviewModal({
  booking,
  hotel,
  onClose,
  onReviewSaved,
}: {
  booking: Booking;
  hotel: Hotel;
  onClose: () => void;
  onReviewSaved?: () => void;
}) {
  const { user } = useAuth();
  const [alreadyReviewed, setAlreadyReviewed] = useState<boolean | null>(null);
  const [reviewStep, setReviewStep] = useState<"write" | "done">("write");
  const [rating, setRating] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [service, setService] = useState(0);
  const [locationRating, setLocationRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    ReviewsDB.existsForBooking(booking.id).then(setAlreadyReviewed);
  }, [booking.id]);

  const handleReviewSubmit = async () => {
    if (rating === 0) return setReviewError("Please select an overall rating.");
    if (!body.trim()) return setReviewError("Please write a short review.");
    if (!user)
      return setReviewError("You must be signed in to leave a review.");
    setReviewError("");
    setSaving(true);
    try {
      await ReviewsDB.add({
        bookingId: booking.id,
        listingId: hotel.id,
        guestId: user.id,
        hostId: hotel.hostId,
        guestName: `${user.firstName} ${user.lastName}`.trim() || "Guest",
        guestAvatar:
          (
            (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")
          ).toUpperCase() || "G",
        rating,
        title: title.trim(),
        body: body.trim(),
        cleanliness: cleanliness || undefined,
        service: service || undefined,
        location: locationRating || undefined,
        value: valueRating || undefined,
        guestPhone: user.phone ?? "",
      });
      setReviewStep("done");
      onReviewSaved?.();
    } catch (err: any) {
      setReviewError(err.message ?? "Failed to submit review.");
    } finally {
      setSaving(false);
    }
  };

  if (alreadyReviewed === null || alreadyReviewed) return null;
  const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Exceptional"];
  <SEO
    url={`https://lux-d1ok.vercel.app/listing/${hotel.id}`}
    listing={{
      name: hotel.name,
      location: hotel.location,
      city: hotel.city,
      country: hotel.country,
      category: hotel.category,
      pricePerNight: hotel.pricePerNight,
      rating: hotel.rating,
      images: hotel.images,
    }}
  />;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={reviewStep === "done" ? onClose : undefined}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.82)",
          backdropFilter: "blur(10px)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 540,
          maxHeight: "94dvh",
          overflowY: "auto",
          background: "#141210",
          border: "1px solid rgba(245,240,232,0.1)",
          borderRadius: "24px 24px 0 0",
          scrollbarWidth: "none",
        }}
      >
        {reviewStep === "write" && (
          <>
            <div
              style={{
                position: "sticky",
                top: 0,
                background: "#141210",
                borderBottom: "1px solid rgba(245,240,232,0.08)",
                padding: "20px 24px 16px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                zIndex: 2,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    color: "#C9A96E",
                    textTransform: "uppercase",
                    marginBottom: 5,
                  }}
                >
                  Share Your Experience
                </p>
                <h2
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: 22,
                    fontWeight: 600,
                    color: "#f5f0e8",
                  }}
                >
                  Leave a Review
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(245,240,232,0.07)",
                  border: "none",
                  color: "#f5f0e8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <XMarkIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div style={{ padding: "20px 24px 32px" }}>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  background: "rgba(245,240,232,0.04)",
                  border: "1px solid rgba(245,240,232,0.08)",
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 28,
                }}
              >
                <img
                  src={getSafeImage(hotel.images?.[0])}
                  alt={hotel.name}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 10,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                  onError={(e) =>
                    ((e.target as HTMLImageElement).src = DEFAULT_IMAGE)
                  }
                />
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#f5f0e8",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hotel.name}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(245,240,232,0.38)",
                      marginTop: 2,
                    }}
                  >
                    {hotel.location}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "rgba(245,240,232,0.25)",
                      marginTop: 3,
                    }}
                  >
                    Ref:{" "}
                    <span style={{ fontFamily: "monospace", color: "#C9A96E" }}>
                      {booking.ref}
                    </span>
                  </p>
                </div>
              </div>
              <div style={{ marginBottom: 28, textAlign: "center" }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    color: "rgba(245,240,232,0.35)",
                    textTransform: "uppercase",
                    marginBottom: 14,
                  }}
                >
                  Overall Rating
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <StarPicker value={rating} onChange={setRating} size={36} />
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: rating > 0 ? "#C9A96E" : "rgba(245,240,232,0.2)",
                      minHeight: 20,
                    }}
                  >
                    {ratingLabels[rating]}
                  </p>
                </div>
              </div>
              <div
                style={{
                  background: "rgba(245,240,232,0.03)",
                  border: "1px solid rgba(245,240,232,0.07)",
                  borderRadius: 14,
                  padding: "4px 16px 0",
                  marginBottom: 22,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "rgba(245,240,232,0.28)",
                    textTransform: "uppercase",
                    paddingTop: 14,
                    marginBottom: 2,
                  }}
                >
                  Category Ratings (optional)
                </p>
                <SubRating
                  label="Cleanliness"
                  value={cleanliness}
                  onChange={setCleanliness}
                />
                <SubRating
                  label="Service"
                  value={service}
                  onChange={setService}
                />
                <SubRating
                  label="Location"
                  value={locationRating}
                  onChange={setLocationRating}
                />
                <SubRating
                  label="Value for Money"
                  value={valueRating}
                  onChange={setValueRating}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "rgba(245,240,232,0.35)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 7,
                  }}
                >
                  Review Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarise your stay…"
                  maxLength={100}
                  style={{
                    width: "100%",
                    background: "rgba(245,240,232,0.05)",
                    border: "1px solid rgba(245,240,232,0.1)",
                    borderRadius: 12,
                    padding: "11px 14px",
                    fontSize: 13,
                    color: "#f5f0e8",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(245,240,232,0.1)")
                  }
                />
              </div>
              <div style={{ marginBottom: 22 }}>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "rgba(245,240,232,0.35)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 7,
                  }}
                >
                  Your Review <span style={{ color: "#C9A96E" }}>*</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  maxLength={1500}
                  placeholder="Tell future guests about the property…"
                  style={{
                    width: "100%",
                    background: "rgba(245,240,232,0.05)",
                    border: "1px solid rgba(245,240,232,0.1)",
                    borderRadius: 12,
                    padding: "11px 14px",
                    fontSize: 13,
                    color: "#f5f0e8",
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(245,240,232,0.1)")
                  }
                />
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(245,240,232,0.2)",
                    textAlign: "right",
                    marginTop: 4,
                  }}
                >
                  {body.length}/1500
                </p>
              </div>
              {reviewError && (
                <div
                  style={{
                    background: "rgba(220,60,60,0.1)",
                    border: "1px solid rgba(220,60,60,0.28)",
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 13,
                    color: "#e07070",
                    marginBottom: 16,
                  }}
                >
                  {reviewError}
                </div>
              )}
              <button
                onClick={handleReviewSubmit}
                disabled={saving}
                style={{
                  width: "100%",
                  background: "#C9A96E",
                  color: "#0e0d0b",
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "16px 0",
                  borderRadius: 14,
                  border: "none",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.75 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {saving ? (
                  <>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(0,0,0,0.2)",
                        borderTopColor: "#0e0d0b",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    Submitting…
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </>
        )}
        {reviewStep === "done" && (
          <div
            style={{
              padding: "48px 32px 40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: "rgba(201,169,110,0.1)",
                border: "2px solid rgba(201,169,110,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 22,
              }}
            >
              <CheckCircleIcon
                style={{ width: 34, height: 34, color: "#C9A96E" }}
              />
            </div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: "#C9A96E",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Thank You
            </p>
            <h2
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: 28,
                fontWeight: 600,
                color: "#f5f0e8",
                marginBottom: 12,
              }}
            >
              Review Submitted
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "#C9A96E",
                color: "#0e0d0b",
                fontWeight: 700,
                fontSize: 13,
                padding: "13px 36px",
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type ChatMsg = { role: "user" | "concierge"; text: string; time: string };
const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const CONCIERGE_RESPONSES = [
  "Thank you for reaching out! I'd be delighted to assist you.",
  "Great question! Our team is available 24/7 to ensure your experience is flawless.",
  "Absolutely, we can arrange that for you. Anything else?",
  "Of course! We'd be happy to accommodate that.",
  "I've passed your request to our host team — you'll see their reply here shortly.",
  "That's a wonderful choice! I'll make sure everything is prepared before your arrival.",
];

function ConciergeChat({
  hotel,
  guestName,
  guestId,
  onClose,
}: {
  hotel: Hotel;
  guestName?: string;
  guestId?: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "concierge",
      text: `Welcome to ${hotel.name}! I'm your personal concierge${guestName ? `, ${guestName.split(" ")[0]}` : ""}. How can I make your stay exceptional?`,
      time: nowTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [convLoading, setConvLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!guestId || !hotel.hostId || convLoading || conversation) return;
    setConvLoading(true);
    MessagesDB.getOrCreateConversation({
      guestId,
      hostId: hotel.hostId,
      listingId: hotel.id,
      listingName: hotel.name,
      guestName: guestName ?? "Guest",
      hostName: hotel.hostName ?? "Host",
    })
      .then(setConversation)
      .catch(console.error)
      .finally(() => setConvLoading(false));
  }, [guestId, hotel, guestName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text, time: nowTime() }]);
    if (guestId && conversation)
      MessagesDB.sendMessage({
        conversationId: conversation.id,
        senderId: guestId,
        senderName: guestName ?? "Guest",
        senderAvatar: guestName?.[0]?.toUpperCase() ?? "G",
        senderRole: "guest",
        body: text,
      }).catch(console.error);
    setTyping(true);
    setTimeout(
      () => {
        setMessages((m) => [
          ...m,
          {
            role: "concierge",
            text: CONCIERGE_RESPONSES[
              Math.floor(Math.random() * CONCIERGE_RESPONSES.length)
            ],
            time: nowTime(),
          },
        ]);
        setTyping(false);
      },
      1200 + Math.random() * 800,
    );
  };

  const QUICK_REPLIES = [
    "Early check-in?",
    "Airport transfer",
    "Special occasion",
    "Dietary needs",
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        pointerEvents: "none",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          pointerEvents: "auto",
        }}
        className="md:hidden"
      />
      <div
        style={{
          position: "relative",
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          background: "#141210",
          border: "1px solid rgba(245,240,232,0.12)",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        }}
        className="w-full rounded-t-3xl md:w-[390px] md:rounded-3xl md:mr-6 md:mb-6"
      >
        <div
          style={{
            background: "rgba(201,169,110,0.08)",
            borderBottom: "1px solid rgba(245,240,232,0.08)",
            padding: "18px 20px 14px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "rgba(201,169,110,0.15)",
                  border: "1px solid rgba(201,169,110,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserIcon style={{ width: 18, height: 18, color: "#C9A96E" }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#f5f0e8" }}>
                  {hotel.hostName ?? "Host"} · Concierge
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#4ade80",
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{ fontSize: 11, color: "rgba(245,240,232,0.4)" }}
                  >
                    {convLoading
                      ? "Connecting…"
                      : "Online · messages go to host inbox"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(245,240,232,0.07)",
                border: "none",
                color: "#f5f0e8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <XMarkIcon style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minHeight: 0,
            height: "min(420px, 55dvh)",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                flexDirection: m.role === "user" ? "row-reverse" : "row",
                alignItems: "flex-end",
              }}
            >
              {m.role === "concierge" && (
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "rgba(201,169,110,0.12)",
                    border: "1px solid rgba(201,169,110,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <UserIcon
                    style={{ width: 13, height: 13, color: "#C9A96E" }}
                  />
                </div>
              )}
              <div
                style={{
                  maxWidth: "75%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  alignItems: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius:
                      m.role === "user"
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                    fontSize: 13,
                    lineHeight: 1.5,
                    background:
                      m.role === "user" ? "#C9A96E" : "rgba(245,240,232,0.07)",
                    color: m.role === "user" ? "#0e0d0b" : "#f5f0e8",
                  }}
                >
                  {m.text}
                </div>
                <span style={{ fontSize: 10, color: "rgba(245,240,232,0.25)" }}>
                  {m.time}
                </span>
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "rgba(201,169,110,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserIcon style={{ width: 13, height: 13, color: "#C9A96E" }} />
              </div>
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "18px 18px 18px 4px",
                  background: "rgba(245,240,232,0.07)",
                  display: "flex",
                  gap: 4,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "rgba(245,240,232,0.4)",
                      display: "inline-block",
                      animation: "bounce 1.2s ease infinite",
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div
          style={{
            padding: "8px 16px",
            display: "flex",
            gap: 6,
            overflowX: "auto",
            flexShrink: 0,
            borderTop: "1px solid rgba(245,240,232,0.05)",
          }}
        >
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              onClick={() => {
                setInput(q);
                inputRef.current?.focus();
              }}
              style={{
                fontSize: 11,
                color: "#C9A96E",
                border: "1px solid rgba(201,169,110,0.3)",
                background: "rgba(201,169,110,0.05)",
                borderRadius: 99,
                padding: "5px 12px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {q}
            </button>
          ))}
        </div>
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid rgba(245,240,232,0.08)",
            display: "flex",
            gap: 8,
            flexShrink: 0,
            paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about your stay…"
            style={{
              flex: 1,
              background: "rgba(245,240,232,0.06)",
              border: "1px solid rgba(245,240,232,0.1)",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 13,
              color: "#f5f0e8",
              outline: "none",
              minWidth: 0,
            }}
            onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(245,240,232,0.1)")
            }
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: input.trim() ? "#C9A96E" : "rgba(201,169,110,0.2)",
              border: "none",
              cursor: input.trim() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PaperAirplaneIcon
              style={{
                width: 16,
                height: 16,
                color: input.trim() ? "#0e0d0b" : "rgba(14,13,11,0.4)",
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniCalendar({
  value,
  onChange,
  min,
  label,
}: {
  value: string;
  onChange: (d: string) => void;
  min?: string;
  label: string;
}) {
  const today = new Date();
  const initial = value ? new Date(value + "T00:00:00") : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const minDate = min ? new Date(min + "T00:00:00") : today;
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const selected = value ? new Date(value + "T00:00:00") : null;
  const toISO = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const prev = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const next = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };
  const navBtn: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "rgba(245,240,232,0.06)",
    border: "none",
    color: "#f5f0e8",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  return (
    <div style={{ width: "100%" }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.15em",
          color: "rgba(245,240,232,0.4)",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <button onClick={prev} style={navBtn}>
          ‹
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#f5f0e8" }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={next} style={navBtn}>
          ›
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          marginBottom: 4,
        }}
      >
        {DAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 10,
              color: "rgba(245,240,232,0.3)",
              fontWeight: 600,
              padding: "2px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 2,
        }}
      >
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const iso = toISO(viewYear, viewMonth, day);
          const isSelected = selected && iso === value;
          const isDisabled = new Date(iso + "T00:00:00") < minDate;
          const isToday =
            iso ===
            toISO(today.getFullYear(), today.getMonth(), today.getDate());
          return (
            <button
              key={day}
              disabled={isDisabled}
              onClick={() => onChange(iso)}
              style={{
                padding: "5px 0",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: isSelected ? 700 : 400,
                border:
                  isToday && !isSelected
                    ? "1px solid rgba(201,169,110,0.4)"
                    : "1px solid transparent",
                background: isSelected ? "#C9A96E" : "transparent",
                color: isSelected
                  ? "#0e0d0b"
                  : isDisabled
                    ? "rgba(245,240,232,0.18)"
                    : "#f5f0e8",
                cursor: isDisabled ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !isDisabled)
                  (e.target as HTMLButtonElement).style.background =
                    "rgba(201,169,110,0.15)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  (e.target as HTMLButtonElement).style.background =
                    "transparent";
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Gallery({
  hotel,
  activeImg,
  setActiveImg,
  setGalleryOpen,
  prevImg,
  nextImg,
}: {
  hotel: Hotel;
  activeImg: number;
  setActiveImg: (i: number) => void;
  setGalleryOpen: (b: boolean) => void;
  prevImg: () => void;
  nextImg: () => void;
}) {
  const circleBtn: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.97)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
          {activeImg + 1} / {hotel.images.length}
        </span>
        <button
          onClick={() => setGalleryOpen(false)}
          style={{ ...circleBtn, background: "rgba(255,255,255,0.1)" }}
        >
          <XMarkIcon style={{ width: 18, height: 18 }} />
        </button>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: "0 56px",
          minHeight: 0,
        }}
      >
        <button
          onClick={prevImg}
          style={{
            ...circleBtn,
            position: "absolute",
            left: 12,
            background: "rgba(255,255,255,0.08)",
          }}
        >
          <ChevronLeftIcon style={{ width: 20, height: 20 }} />
        </button>
        <img
          src={getSafeImage(hotel.images[activeImg])}
          alt=""
          style={{
            maxHeight: "70vh",
            maxWidth: "100%",
            objectFit: "contain",
            borderRadius: 12,
          }}
        />
        <button
          onClick={nextImg}
          style={{
            ...circleBtn,
            position: "absolute",
            right: 12,
            background: "rgba(255,255,255,0.08)",
          }}
        >
          <ChevronRightIcon style={{ width: 20, height: 20 }} />
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          padding: "0 16px 24px",
          overflowX: "auto",
        }}
      >
        {hotel.images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveImg(i)}
            style={{
              width: 64,
              height: 44,
              borderRadius: 8,
              overflow: "hidden",
              flexShrink: 0,
              border: `2px solid ${i === activeImg ? "#C9A96E" : "transparent"}`,
              opacity: i === activeImg ? 1 : 0.4,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <img
              src={getSafeImage(img)}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

const makeRoomTypes = (hotel: Hotel) => {
  const baseFeatures = hotel.amenities.slice(0, 5);
  const stdPrice = hotel.pricePerNight;
  const premPrice = Math.round(stdPrice * 1.22);
  return [
    {
      id: "standard",
      name: `${hotel.category} Suite`,
      size: `${Math.max(hotel.bedrooms * 28, 60)} m²`,
      guests: hotel.maxGuests,
      bed: hotel.bedrooms > 1 ? `${hotel.bedrooms} bedrooms` : "1 bedroom",
      price: stdPrice,
      features: baseFeatures,
      image: hotel.images[0],
      badge: hotel.featured ? "Featured" : null,
    },
    {
      id: "premium",
      name: "Grand Reserve",
      size: `${Math.max(hotel.bedrooms * 34, 80)} m²`,
      guests: hotel.maxGuests,
      bed: hotel.bedrooms > 1 ? `${hotel.bedrooms} bedrooms` : "1 bedroom",
      price: premPrice,
      features: baseFeatures,
      image: hotel.images[1] ?? hotel.images[0],
      badge: "Best Value",
    },
  ];
};

type Props = {
  hotel: Hotel;
  onBack?: () => void;
  onBookingComplete?: () => void;
};

export default function BookingPage({
  hotel,
  onBack,
  onBookingComplete,
}: Props) {
  const { user } = useAuth();
  const roomTypes = makeRoomTypes(hotel);

  const [activeImg, setActiveImg] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(roomTypes[0].id);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [step, setStep] = useState<"idle" | "form" | "confirm" | "done">(
    "idle",
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "rooms" | "reviews">(
    "overview",
  );
  const [scrolled, setScrolled] = useState(false);
  const [showCheckInCal, setShowCheckInCal] = useState(false);
  const [showCheckOutCal, setShowCheckOutCal] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(
    null,
  );
  const [listingReviews, setListingReviews] = useState<
    import("../index").Review[]
  >([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [guestInfo, setGuestInfo] = useState({
    name: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    requests: "",
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (activeTab !== "reviews") return;
    setReviewsLoading(true);
    ReviewsDB.byListing(hotel.id)
      .then(setListingReviews)
      .catch(console.error)
      .finally(() => setReviewsLoading(false));
  }, [activeTab, hotel.id]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      step !== "idle" || chatOpen || showReviewModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [step, chatOpen, showReviewModal]);

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(
      0,
      Math.round(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000,
      ),
    );
  })();

  const room = roomTypes.find((r) => r.id === selectedRoom) ?? roomTypes[0];
  const subtotal = room.price * Math.max(nights, 1);
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + taxes;

  const nextImg = () => setActiveImg((i) => (i + 1) % hotel.images.length);
  const prevImg = () =>
    setActiveImg((i) => (i - 1 + hotel.images.length) % hotel.images.length);

  const formatDate = (iso: string) => {
    if (!iso) return "Select date";
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const generateRef = () =>
    `ZB-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  /* ══════════════════════════════════════
     PAYSTACK — key fix:
     NO setSaving(true) or any state update
     before handler.openIframe(). All async
     work happens inside the callback only.
  ══════════════════════════════════════ */
  const handlePayWithPaystack = () => {
    if (!window.PaystackPop) {
      setSaveError("Paystack script not loaded. Check your index.html.");
      return;
    }
    if (!PAYSTACK_KEY) {
      setSaveError("Missing VITE_PAYSTACK_PUBLIC_KEY in .env.local");
      return;
    }

    setSaveError(""); // ✅ only a clear, no re-render that blocks popup

    // ✅ Setup synchronously — no await, no state updates before openIframe
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_KEY,
      email: guestInfo.email,
      amount: total * 100,
      currency: "NGN", // change to "USD" if needed
      ref: generateRef(),
      metadata: {
        listingId: hotel.id,
        listingName: hotel.name,
        guestName: guestInfo.name,
        guestPhone: guestInfo.phone,
        checkIn,
        checkOut,
        nights,
        guests,
        roomType: room.name,
      },
      onClose: () => {
        // ✅ state updates are safe here — popup is already open/closed
        setSaving(false);
        setSaveError("Payment was cancelled. Please try again.");
      },
      callback: (response) => {
        if (response.status !== "success") {
          setSaving(false);
          setSaveError("Payment was not completed. Please try again.");
          return;
        }
        setSaving(true);
        BookingsDB.add({
          guestId: user?.id ?? "guest_anonymous",
          guestName: guestInfo.name,
          guestEmail: guestInfo.email,
          guestPhone: guestInfo.phone,
          listingId: hotel.id,
          listingName: hotel.name,
          hostId: hotel.hostId,
          checkIn: checkIn || today,
          checkOut:
            checkOut ||
            new Date(Date.now() + 86400000).toISOString().split("T")[0],
          guests,
          nights: Math.max(nights, 1),
          totalAmount: total,
          specialRequests: guestInfo.requests,
        })
          .then(async (booking) => {
            // Split payment: 90% to host, 10% to platform
            await WalletDB.splitBookingPayment(
              booking.hostId,
              booking.id,
              booking.totalAmount,
              booking.listingName,
            );
            setBookingRef(response.reference);
            setCompletedBooking(booking);
            setStep("done");
          })
          .catch((err) => {
            setSaveError(
              err.message ??
                "Payment succeeded but booking failed. Contact support.",
            );
          })
          .finally(() => {
            setSaving(false);
          });
      },
    });
    handler.openIframe(); // ✅ called synchronously, no prior state updates
  };

  const calInRef = useRef<HTMLDivElement>(null);
  const calOutRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (calInRef.current && !calInRef.current.contains(e.target as Node))
        setShowCheckInCal(false);
      if (calOutRef.current && !calOutRef.current.contains(e.target as Node))
        setShowCheckOutCal(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const BookingModal = () => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      className="sm:items-center"
    >
      <div
        onClick={() => step !== "done" && setStep("idle")}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(8px)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 10,
          background: "#141210",
          border: "1px solid rgba(245,240,232,0.1)",
          width: "100%",
          maxWidth: 520,
          borderRadius: "24px 24px 0 0",
          maxHeight: "92dvh",
          overflowY: "auto",
        }}
        className="sm:rounded-3xl"
      >
        {/* FORM */}
        {step === "form" && (
          <>
            <div
              style={{
                position: "sticky",
                top: 0,
                background: "#141210",
                borderBottom: "1px solid rgba(245,240,232,0.08)",
                padding: "20px 24px 16px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                zIndex: 2,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    color: "#C9A96E",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Your Reservation
                </p>
                <h2
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: 22,
                    color: "#f5f0e8",
                    fontWeight: 600,
                  }}
                >
                  {room.name}
                </h2>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(245,240,232,0.4)",
                    marginTop: 2,
                  }}
                >
                  {nights > 0
                    ? `${nights} night${nights > 1 ? "s" : ""}`
                    : "Select dates below"}{" "}
                  · {hotel.location}
                </p>
              </div>
              <button
                onClick={() => setStep("idle")}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(245,240,232,0.07)",
                  border: "none",
                  color: "#f5f0e8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 4,
                }}
              >
                <XMarkIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  background: "rgba(245,240,232,0.04)",
                  borderRadius: 16,
                  border: "1px solid rgba(245,240,232,0.08)",
                  padding: 16,
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                <img
                  src={getSafeImage(room.image)}
                  alt=""
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 10,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: 15,
                      color: "#f5f0e8",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hotel.name}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(245,240,232,0.4)",
                      marginTop: 2,
                    }}
                  >
                    {room.name}
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#C9A96E",
                      marginTop: 4,
                    }}
                  >
                    ${total.toLocaleString()}{" "}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 400,
                        color: "rgba(245,240,232,0.35)",
                      }}
                    >
                      total est.
                    </span>
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {[
                  {
                    label: "Check-in",
                    val: checkIn,
                    setVal: setCheckIn,
                    minVal: today,
                  },
                  {
                    label: "Check-out",
                    val: checkOut,
                    setVal: setCheckOut,
                    minVal: checkIn || today,
                  },
                ].map(({ label, val, setVal, minVal }) => (
                  <div key={label}>
                    <label
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        color: "rgba(245,240,232,0.35)",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      {label}
                    </label>
                    <input
                      type="date"
                      min={minVal}
                      value={val}
                      onChange={(e) => setVal(e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(245,240,232,0.05)",
                        border: "1px solid rgba(245,240,232,0.1)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontSize: 13,
                        color: "#f5f0e8",
                        outline: "none",
                        boxSizing: "border-box",
                        colorScheme: "dark",
                      }}
                    />
                  </div>
                ))}
              </div>
              {[
                {
                  label: "Full Name",
                  key: "name",
                  type: "text",
                  placeholder: "Your full name",
                },
                {
                  label: "Email Address",
                  key: "email",
                  type: "email",
                  placeholder: "your@email.com",
                },
                {
                  label: "Phone (optional)",
                  key: "phone",
                  type: "tel",
                  placeholder: "+1 234 567 8900",
                },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      color: "rgba(245,240,232,0.35)",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    {label}
                  </label>
                  <input
                    type={type}
                    value={guestInfo[key as keyof typeof guestInfo]}
                    onChange={(e) =>
                      setGuestInfo((g) => ({ ...g, [key]: e.target.value }))
                    }
                    placeholder={placeholder}
                    style={{
                      width: "100%",
                      background: "rgba(245,240,232,0.05)",
                      border: "1px solid rgba(245,240,232,0.1)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#f5f0e8",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
                    onBlur={(e) =>
                      (e.target.style.borderColor = "rgba(245,240,232,0.1)")
                    }
                  />
                </div>
              ))}
              <div>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "rgba(245,240,232,0.35)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Special Requests
                </label>
                <textarea
                  value={guestInfo.requests}
                  onChange={(e) =>
                    setGuestInfo((g) => ({ ...g, requests: e.target.value }))
                  }
                  rows={3}
                  placeholder="Early check-in, dietary requirements…"
                  style={{
                    width: "100%",
                    background: "rgba(245,240,232,0.05)",
                    border: "1px solid rgba(245,240,232,0.1)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#f5f0e8",
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(245,240,232,0.1)")
                  }
                />
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(245,240,232,0.08)",
                  paddingTop: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {[
                  [
                    `₦${room.price.toLocaleString()} × ${Math.max(nights, 1)} nights`,
                    `₦${subtotal.toLocaleString()}`,
                  ],
                  ["Taxes & resort fees (12%)", `₦${taxes.toLocaleString()}`],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      color: "rgba(245,240,232,0.45)",
                    }}
                  >
                    <span>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#f5f0e8",
                    paddingTop: 10,
                    borderTop: "1px solid rgba(245,240,232,0.08)",
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: "#C9A96E" }}>
                    ₦{total.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (guestInfo.name && guestInfo.email) setStep("confirm");
                }}
                disabled={!guestInfo.name || !guestInfo.email}
                style={{
                  width: "100%",
                  background:
                    guestInfo.name && guestInfo.email
                      ? "#C9A96E"
                      : "rgba(201,169,110,0.3)",
                  color:
                    guestInfo.name && guestInfo.email
                      ? "#0e0d0b"
                      : "rgba(14,13,11,0.5)",
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "16px 0",
                  borderRadius: 14,
                  border: "none",
                  cursor:
                    guestInfo.name && guestInfo.email
                      ? "pointer"
                      : "not-allowed",
                  letterSpacing: "0.04em",
                }}
              >
                Continue to Payment →
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "center",
                  fontSize: 12,
                  color: "rgba(245,240,232,0.3)",
                }}
              >
                <ShieldCheckIcon
                  style={{ width: 14, height: 14, color: "#C9A96E" }}
                />
                Free cancellation · No charge until confirmed
              </div>
            </div>
          </>
        )}

        {/* CONFIRM — PAYSTACK */}
        {step === "confirm" && (
          <>
            <div
              style={{
                position: "sticky",
                top: 0,
                background: "#141210",
                borderBottom: "1px solid rgba(245,240,232,0.08)",
                padding: "20px 24px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    color: "#C9A96E",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Final Step
                </p>
                <h2
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: 22,
                    color: "#f5f0e8",
                    fontWeight: 600,
                  }}
                >
                  Confirm & Pay
                </h2>
              </div>
              <button
                onClick={() => setStep("form")}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#C9A96E",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ← Edit details
              </button>
            </div>
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  background: "rgba(245,240,232,0.04)",
                  border: "1px solid rgba(245,240,232,0.08)",
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "rgba(245,240,232,0.35)",
                    textTransform: "uppercase",
                    marginBottom: 14,
                  }}
                >
                  Reservation Summary
                </p>
                {[
                  ["Property", hotel.name],
                  ["Room", room.name],
                  ["Guest", guestInfo.name],
                  ["Email", guestInfo.email],
                  ["Check-in", checkIn ? formatDate(checkIn) : "—"],
                  ["Check-out", checkOut ? formatDate(checkOut) : "—"],
                  ["Nights", nights || "—"],
                  ["Guests", guests],
                ].map(([k, v]) => (
                  <div
                    key={String(k)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ color: "rgba(245,240,232,0.4)" }}>{k}</span>
                    <span
                      style={{
                        color: "#f5f0e8",
                        fontWeight: 500,
                        textAlign: "right",
                        maxWidth: "55%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    borderTop: "1px solid rgba(245,240,232,0.08)",
                    paddingTop: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: "#f5f0e8" }}>Total Charge</span>
                  <span style={{ color: "#C9A96E" }}>
                    ₦{total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(0,100,50,0.08)",
                  border: "1px solid rgba(0,180,80,0.2)",
                  borderRadius: 16,
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(0,180,80,0.12)",
                      border: "1px solid rgba(0,180,80,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>🔐</span>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#f5f0e8",
                      }}
                    >
                      Pay with Paystack
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "rgba(245,240,232,0.4)",
                        marginTop: 2,
                      }}
                    >
                      Cards, bank transfer, USSD, mobile money & more
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    "Visa",
                    "Mastercard",
                    "Verve",
                    "Bank Transfer",
                    "USSD",
                    "Mobile Money",
                  ].map((m) => (
                    <span
                      key={m}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "rgba(245,240,232,0.5)",
                        background: "rgba(245,240,232,0.05)",
                        border: "1px solid rgba(245,240,232,0.08)",
                        borderRadius: 6,
                        padding: "3px 8px",
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {saveError && (
                <div
                  style={{
                    background: "rgba(220,60,60,0.12)",
                    border: "1px solid rgba(220,60,60,0.3)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    fontSize: 13,
                    color: "#e07070",
                  }}
                >
                  {saveError}
                </div>
              )}

              {/* ✅ PAY BUTTON — direct onClick, no wrapper, no disabled during payment */}
              <button
                onClick={handlePayWithPaystack}
                style={{
                  width: "100%",
                  background: "#00b451",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "16px 0",
                  borderRadius: 14,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  letterSpacing: "0.04em",
                }}
              >
                {saving ? (
                  <>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    Processing…
                  </>
                ) : (
                  <>🔐 Pay ₦{total.toLocaleString()} securely</>
                )}
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "center",
                  fontSize: 11,
                  color: "rgba(245,240,232,0.28)",
                }}
              >
                <ShieldCheckIcon
                  style={{ width: 13, height: 13, color: "#00b451" }}
                />
                Secured by Paystack · PCI DSS compliant
              </div>
            </div>
          </>
        )}

        {/* DONE */}
        {step === "done" && (
          <div
            style={{
              padding: 40,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(201,169,110,0.12)",
                border: "2px solid rgba(201,169,110,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <CheckCircleIcon
                style={{ width: 32, height: 32, color: "#C9A96E" }}
              />
            </div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: "#C9A96E",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Booking Confirmed
            </p>
            <h2
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: 28,
                color: "#f5f0e8",
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              Payment Successful!
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "rgba(245,240,232,0.45)",
                lineHeight: 1.7,
                maxWidth: 320,
                marginBottom: 24,
              }}
            >
              Your reservation at{" "}
              <strong style={{ color: "#f5f0e8" }}>{hotel.name}</strong> is
              confirmed and paid. A confirmation has been sent to{" "}
              <strong style={{ color: "#f5f0e8" }}>{guestInfo.email}</strong>.
            </p>
            <div
              style={{
                background: "rgba(201,169,110,0.06)",
                border: "1px solid rgba(201,169,110,0.2)",
                borderRadius: 16,
                padding: "16px 32px",
                width: "100%",
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  color: "rgba(245,240,232,0.4)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Payment Reference
              </p>
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  color: "#C9A96E",
                  fontFamily: "monospace",
                }}
              >
                {bookingRef}
              </p>
            </div>
            <div
              style={{
                background: "rgba(0,180,80,0.06)",
                border: "1px solid rgba(0,180,80,0.2)",
                borderRadius: 12,
                padding: "10px 20px",
                marginBottom: 24,
                width: "100%",
              }}
            >
              <p style={{ fontSize: 12, color: "rgba(245,240,232,0.5)" }}>
                Status:{" "}
                <strong style={{ color: "#4ade80" }}>✓ Confirmed & Paid</strong>
              </p>
            </div>
            {completedBooking && user && (
              <button
                onClick={() => {
                  setStep("idle");
                  setShowReviewModal(true);
                }}
                style={{
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(201,169,110,0.08)",
                  border: "1px solid rgba(201,169,110,0.25)",
                  borderRadius: 14,
                  padding: "13px 24px",
                  cursor: "pointer",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <StarIcon style={{ width: 16, height: 16, color: "#C9A96E" }} />
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: "#C9A96E" }}
                >
                  Leave a Review
                </span>
              </button>
            )}
            <button
              onClick={() => {
                setStep("idle");
                setGuestInfo({
                  name: user ? `${user.firstName} ${user.lastName}`.trim() : "",
                  email: user?.email ?? "",
                  phone: user?.phone ?? "",
                  requests: "",
                });
                if (onBookingComplete) onBookingComplete();
                else if (onBack) onBack();
              }}
              style={{
                marginTop: 4,
                fontSize: 13,
                fontWeight: 700,
                color: "#C9A96E",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              Back to Explore →
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0d0b",
        color: "#f5f0e8",
        fontFamily: "sans-serif",
      }}
    >
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-6px); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .tab-btn { background:none; border:none; cursor:pointer; padding:12px 16px; font-size:13px; font-weight:600; color:rgba(245,240,232,0.4); border-bottom:2px solid transparent; transition:all 0.2s; margin-bottom:-1px; white-space:nowrap; }
        .tab-btn.active { color:#C9A96E; border-bottom-color:#C9A96E; }
        .tab-btn:hover:not(.active) { color:rgba(245,240,232,0.7); }
        .room-card { cursor:pointer; transition:all 0.2s; }
        .room-card:hover { border-color:rgba(201,169,110,0.3) !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(1); opacity:0.4; cursor:pointer; }
        textarea::placeholder, input::placeholder { color:rgba(245,240,232,0.2); }
        @media (max-width: 767px) {
          .hero-grid { display:none !important; } .hero-mobile { display:block !important; }
          .main-grid { grid-template-columns:1fr !important; } .booking-widget-col { display:none !important; }
          .quick-stats-grid { grid-template-columns:1fr 1fr !important; } .amenities-grid { grid-template-columns:1fr 1fr !important; }
          .policies-grid { grid-template-columns:1fr !important; } .reviews-grid { grid-template-columns:1fr !important; }
          .reviews-summary { flex-direction:column !important; gap:16px !important; } .room-card-inner { flex-direction:column !important; }
          .room-card-img { width:100% !important; height:180px !important; } .title-h1 { font-size:28px !important; }
          .tabs-row { overflow-x:auto; -webkit-overflow-scrolling:touch; } .page-padding { padding-left:16px !important; padding-right:16px !important; }
          .hero-grid-wrap { padding:12px 16px 16px !important; } .content-wrap { padding:0 16px 140px !important; }
        }
        @media (min-width: 768px) { .hero-mobile { display:none !important; } .hero-grid { display:grid !important; } }
      `}</style>

      {galleryOpen && (
        <Gallery
          hotel={hotel}
          activeImg={activeImg}
          setActiveImg={setActiveImg}
          setGalleryOpen={setGalleryOpen}
          prevImg={prevImg}
          nextImg={nextImg}
        />
      )}
      {step !== "idle" && <BookingModal />}
      {chatOpen && (
        <ConciergeChat
          hotel={hotel}
          guestName={guestInfo.name || user?.firstName}
          guestId={user?.id}
          onClose={() => setChatOpen(false)}
        />
      )}
      {showReviewModal && completedBooking && user && (
        <GuestReviewModal
          booking={completedBooking}
          hotel={hotel}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      {/* STICKY NAV */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: scrolled ? "rgba(14,13,11,0.97)" : "transparent",
          borderBottom: scrolled
            ? "1px solid rgba(245,240,232,0.07)"
            : "1px solid transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          transition: "all 0.3s",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 0,
            }}
          >
            <button
              onClick={onBack}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(245,240,232,0.08)",
                border: "1px solid rgba(245,240,232,0.1)",
                color: "#f5f0e8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ChevronLeftIcon style={{ width: 16, height: 16 }} />
            </button>
            <div
              style={{
                opacity: scrolled ? 1 : 0,
                transition: "opacity 0.3s",
                pointerEvents: scrolled ? "auto" : "none",
                minWidth: 0,
              }}
            >
              <p
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#f5f0e8",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {hotel.name}
              </p>
              <p style={{ fontSize: 11, color: "rgba(245,240,232,0.4)" }}>
                ${room.price.toLocaleString()} / night
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setWishlisted((w) => !w)}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(245,240,232,0.06)",
                border: "1px solid rgba(245,240,232,0.1)",
                color: wishlisted ? "#e05c6e" : "#f5f0e8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {wishlisted ? (
                <HeartSolid style={{ width: 16, height: 16 }} />
              ) : (
                <HeartIcon style={{ width: 16, height: 16 }} />
              )}
            </button>
            <button
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(245,240,232,0.06)",
                border: "1px solid rgba(245,240,232,0.1)",
                color: "#f5f0e8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShareIcon style={{ width: 16, height: 16 }} />
            </button>
            <button
              onClick={() => setStep("form")}
              style={{
                display: "none",
                background: "#C9A96E",
                color: "#0e0d0b",
                fontWeight: 700,
                fontSize: 13,
                padding: "10px 22px",
                borderRadius: 99,
                border: "none",
                cursor: "pointer",
              }}
              className="md:flex"
            >
              Reserve Now
            </button>
          </div>
        </div>
      </header>

      {/* HERO mobile */}
      <div
        className="hero-mobile"
        style={{ display: "none", position: "relative" }}
      >
        <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
          <img
            src={
              imgErrors[activeImg]
                ? DEFAULT_IMAGE
                : getSafeImage(hotel.images[activeImg])
            }
            alt={hotel.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgErrors((e) => ({ ...e, [activeImg]: true }))}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(14,13,11,0.6) 0%, transparent 50%)",
            }}
          />
          <button
            onClick={prevImg}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(14,13,11,0.6)",
              border: "none",
              color: "#f5f0e8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeftIcon style={{ width: 16, height: 16 }} />
          </button>
          <button
            onClick={nextImg}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(14,13,11,0.6)",
              border: "none",
              color: "#f5f0e8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRightIcon style={{ width: 16, height: 16 }} />
          </button>
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 6,
            }}
          >
            {hotel.images.slice(0, 6).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                style={{
                  width: i === activeImg ? 18 : 6,
                  height: 6,
                  borderRadius: 99,
                  background:
                    i === activeImg ? "#C9A96E" : "rgba(255,255,255,0.4)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* HERO desktop */}
      <div
        className="hero-grid-wrap page-padding"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px 24px" }}
      >
        <div
          className="hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: 4,
            borderRadius: 20,
            overflow: "hidden",
            height: 460,
          }}
        >
          <button
            onClick={() => setGalleryOpen(true)}
            style={{
              gridRow: "1 / 3",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
              border: "none",
              padding: 0,
            }}
          >
            <img
              src={imgErrors[0] ? DEFAULT_IMAGE : getSafeImage(hotel.images[0])}
              alt={hotel.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.6s",
              }}
              onError={() => setImgErrors((e) => ({ ...e, 0: true }))}
              onMouseOver={(e) =>
                ((e.target as HTMLImageElement).style.transform = "scale(1.04)")
              }
              onMouseOut={(e) =>
                ((e.target as HTMLImageElement).style.transform = "scale(1)")
              }
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(14,13,11,0.5) 0%, transparent 40%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                display: "flex",
                gap: 8,
              }}
            >
              <span
                style={{
                  background: "rgba(14,13,11,0.75)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(245,240,232,0.1)",
                  borderRadius: 99,
                  padding: "6px 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#C9A96E",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {hotel.category}
              </span>
              {hotel.featured && (
                <span
                  style={{
                    background: "#C9A96E",
                    borderRadius: 99,
                    padding: "6px 14px",
                    fontSize: 10,
                    fontWeight: 900,
                    color: "#0e0d0b",
                    textTransform: "uppercase",
                  }}
                >
                  Featured
                </span>
              )}
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: 16,
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(14,13,11,0.75)",
                backdropFilter: "blur(10px)",
                borderRadius: 99,
                padding: "6px 12px",
              }}
            >
              <StarIcon style={{ width: 13, height: 13, color: "#C9A96E" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f5f0e8" }}>
                {hotel.rating}
              </span>
              <span style={{ fontSize: 11, color: "rgba(245,240,232,0.4)" }}>
                ({hotel.reviewCount.toLocaleString()})
              </span>
            </div>
          </button>
          {hotel.images.slice(1, 5).map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveImg(i + 1);
                setGalleryOpen(true);
              }}
              style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                border: "none",
                padding: 0,
              }}
            >
              <img
                src={imgErrors[i + 1] ? DEFAULT_IMAGE : getSafeImage(img)}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.5s",
                }}
                onError={() => setImgErrors((e) => ({ ...e, [i + 1]: true }))}
                onMouseOver={(e) =>
                  ((e.target as HTMLImageElement).style.transform =
                    "scale(1.06)")
                }
                onMouseOut={(e) =>
                  ((e.target as HTMLImageElement).style.transform = "scale(1)")
                }
              />
              {i === 3 && hotel.images.length > 5 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(14,13,11,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{ color: "#f5f0e8", fontWeight: 700, fontSize: 14 }}
                  >
                    +{hotel.images.length - 5} more
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        className="content-wrap page-padding"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 120px" }}
      >
        <div
          className="main-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 40,
            alignItems: "start",
          }}
        >
          {/* LEFT */}
          <div style={{ animation: "fadeUp 0.5s ease both", minWidth: 0 }}>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {hotel.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#C9A96E",
                      background: "rgba(201,169,110,0.1)",
                      border: "1px solid rgba(201,169,110,0.2)",
                      borderRadius: 99,
                      padding: "4px 12px",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <h1
                className="title-h1"
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: 38,
                  fontWeight: 600,
                  color: "#f5f0e8",
                  lineHeight: 1.1,
                  marginBottom: 12,
                }}
              >
                {hotel.name}
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      style={{
                        width: 14,
                        height: 14,
                        color:
                          i < Math.floor(hotel.rating)
                            ? "#C9A96E"
                            : "rgba(245,240,232,0.15)",
                      }}
                    />
                  ))}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#f5f0e8",
                      marginLeft: 6,
                    }}
                  >
                    {hotel.rating}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "rgba(245,240,232,0.4)",
                      marginLeft: 2,
                    }}
                  >
                    ({hotel.reviewCount.toLocaleString()} reviews)
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "rgba(245,240,232,0.5)",
                  }}
                >
                  <MapPinIcon
                    style={{ width: 14, height: 14, color: "#C9A96E" }}
                  />
                  {hotel.location}
                </div>
              </div>
            </div>

            <div
              className="quick-stats-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 10,
                marginBottom: 28,
              }}
            >
              {[
                { icon: "🛏", label: "Bedrooms", val: hotel.bedrooms },
                { icon: "🚿", label: "Bathrooms", val: hotel.bathrooms },
                { icon: "👥", label: "Max Guests", val: hotel.maxGuests },
                {
                  icon: "✦",
                  label: "Per Night",
                  val: `₦${hotel.pricePerNight.toLocaleString()}`,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "rgba(245,240,232,0.04)",
                    border: "1px solid rgba(245,240,232,0.07)",
                    borderRadius: 14,
                    padding: "14px 12px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                  <div
                    style={{ fontSize: 15, fontWeight: 700, color: "#f5f0e8" }}
                  >
                    {s.val}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(245,240,232,0.35)",
                      marginTop: 2,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div
              className="tabs-row"
              style={{
                borderBottom: "1px solid rgba(245,240,232,0.08)",
                marginBottom: 28,
                display: "flex",
                gap: 0,
              }}
            >
              {(["overview", "rooms", "reviews"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`tab-btn${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                  style={{ textTransform: "capitalize" }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 32 }}
              >
                <div>
                  <h2
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#f5f0e8",
                      marginBottom: 12,
                    }}
                  >
                    About this property
                  </h2>
                  <p
                    style={{
                      fontSize: 14,
                      color: "rgba(245,240,232,0.6)",
                      lineHeight: 1.8,
                    }}
                  >
                    {hotel.description}
                  </p>
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#f5f0e8",
                      marginBottom: 14,
                    }}
                  >
                    Amenities
                  </h2>
                  <div
                    className="amenities-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 10,
                    }}
                  >
                    {(showAllAmenities
                      ? hotel.amenities
                      : hotel.amenities.slice(0, 6)
                    ).map((a) => (
                      <div
                        key={a}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          background: "rgba(245,240,232,0.04)",
                          border: "1px solid rgba(245,240,232,0.07)",
                          borderRadius: 12,
                          padding: "10px 14px",
                          fontSize: 13,
                          color: "rgba(245,240,232,0.7)",
                        }}
                      >
                        <span style={{ fontSize: 16 }}>
                          {AMENITY_ICONS[a] || "✦"}
                        </span>
                        {a}
                      </div>
                    ))}
                  </div>
                  {hotel.amenities.length > 6 && (
                    <button
                      onClick={() => setShowAllAmenities((s) => !s)}
                      style={{
                        marginTop: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#C9A96E",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {showAllAmenities
                        ? "Show less"
                        : `Show all ${hotel.amenities.length} amenities`}
                      <ChevronDownIcon
                        style={{
                          width: 14,
                          height: 14,
                          transform: showAllAmenities
                            ? "rotate(180deg)"
                            : "none",
                        }}
                      />
                    </button>
                  )}
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#f5f0e8",
                      marginBottom: 14,
                    }}
                  >
                    Policies
                  </h2>
                  <div
                    className="policies-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    {[
                      {
                        icon: "🕐",
                        title: "Check-in",
                        desc: "From 3:00 PM · Early check-in on request",
                      },
                      {
                        icon: "🧳",
                        title: "Check-out",
                        desc: "Until 12:00 PM · Late check-out available",
                      },
                      {
                        icon: "❌",
                        title: "Cancellation",
                        desc: "Free cancellation up to 48h before arrival",
                      },
                      {
                        icon: "🐾",
                        title: "Pets",
                        desc: "Not permitted at this property",
                      },
                      {
                        icon: "🚭",
                        title: "Smoking",
                        desc: "Non-smoking property throughout",
                      },
                      {
                        icon: "💳",
                        title: "Payment",
                        desc: "Paystack — cards, bank transfer, USSD, mobile money",
                      },
                    ].map((p) => (
                      <div
                        key={p.title}
                        style={{
                          background: "rgba(245,240,232,0.04)",
                          border: "1px solid rgba(245,240,232,0.07)",
                          borderRadius: 14,
                          padding: "14px 16px",
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                        }}
                      >
                        <span style={{ fontSize: 20, marginTop: 1 }}>
                          {p.icon}
                        </span>
                        <div>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#f5f0e8",
                              marginBottom: 4,
                            }}
                          >
                            {p.title}
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              color: "rgba(245,240,232,0.4)",
                              lineHeight: 1.5,
                            }}
                          >
                            {p.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "rooms" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(245,240,232,0.45)",
                    marginBottom: 4,
                  }}
                >
                  Select your preferred room type.
                </p>
                {roomTypes.map((rt) => (
                  <div
                    key={rt.id}
                    className="room-card"
                    onClick={() => setSelectedRoom(rt.id)}
                    style={{
                      background: "rgba(245,240,232,0.03)",
                      border: `2px solid ${selectedRoom === rt.id ? "#C9A96E" : "rgba(245,240,232,0.07)"}`,
                      borderRadius: 18,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="room-card-inner"
                      style={{ display: "flex" }}
                    >
                      <div
                        className="room-card-img"
                        style={{
                          width: 180,
                          flexShrink: 0,
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={getSafeImage(rt.image)}
                          alt={rt.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            minHeight: 140,
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, padding: 20, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 6,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 4,
                                flexWrap: "wrap",
                              }}
                            >
                              <h3
                                style={{
                                  fontFamily: "Cormorant Garamond, serif",
                                  fontSize: 17,
                                  fontWeight: 600,
                                  color: "#f5f0e8",
                                }}
                              >
                                {rt.name}
                              </h3>
                              {rt.badge && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: "#C9A96E",
                                    background: "rgba(201,169,110,0.12)",
                                    borderRadius: 99,
                                    padding: "3px 10px",
                                  }}
                                >
                                  {rt.badge}
                                </span>
                              )}
                            </div>
                            <p
                              style={{
                                fontSize: 12,
                                color: "rgba(245,240,232,0.4)",
                              }}
                            >
                              {rt.size} · {rt.bed} · Up to {rt.guests} guests
                            </p>
                          </div>
                          <div
                            style={{
                              textAlign: "right",
                              flexShrink: 0,
                              marginLeft: 12,
                            }}
                          >
                            <p
                              style={{
                                fontFamily: "Cormorant Garamond, serif",
                                fontSize: 20,
                                fontWeight: 700,
                                color: "#C9A96E",
                              }}
                            >
                              ₦{rt.price.toLocaleString()}
                            </p>
                            <p
                              style={{
                                fontSize: 11,
                                color: "rgba(245,240,232,0.35)",
                              }}
                            >
                              / night
                            </p>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            marginTop: 10,
                          }}
                        >
                          {rt.features.map((f) => (
                            <span
                              key={f}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                color: "rgba(245,240,232,0.55)",
                                background: "rgba(245,240,232,0.05)",
                                border: "1px solid rgba(245,240,232,0.08)",
                                borderRadius: 99,
                                padding: "3px 10px",
                              }}
                            >
                              <CheckIcon
                                style={{
                                  width: 10,
                                  height: 10,
                                  color: "#C9A96E",
                                }}
                              />{" "}
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "0 16px",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: `2px solid ${selectedRoom === rt.id ? "#C9A96E" : "rgba(245,240,232,0.2)"}`,
                            background:
                              selectedRoom === rt.id
                                ? "#C9A96E"
                                : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {selectedRoom === rt.id && (
                            <CheckIcon
                              style={{
                                width: 11,
                                height: 11,
                                color: "#0e0d0b",
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" &&
              (() => {
                const avgRating = listingReviews.length
                  ? listingReviews.reduce((s, r) => s + r.rating, 0) /
                    listingReviews.length
                  : hotel.rating;
                const subAvg = (
                  key: "cleanliness" | "service" | "location" | "value",
                ) => {
                  const vals = listingReviews
                    .map((r) => r[key] as number | undefined)
                    .filter((v): v is number => typeof v === "number");
                  return vals.length
                    ? vals.reduce((s, v) => s + v, 0) / vals.length
                    : null;
                };
                const fmtDate = (iso: string) =>
                  new Date(iso).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                return (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 20,
                    }}
                  >
                    <div
                      className="reviews-summary"
                      style={{
                        background: "rgba(245,240,232,0.04)",
                        border: "1px solid rgba(245,240,232,0.07)",
                        borderRadius: 18,
                        padding: 24,
                        display: "flex",
                        gap: 32,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ textAlign: "center", flexShrink: 0 }}>
                        <p
                          style={{
                            fontFamily: "Cormorant Garamond, serif",
                            fontSize: 52,
                            fontWeight: 700,
                            color: "#f5f0e8",
                            lineHeight: 1,
                          }}
                        >
                          {avgRating.toFixed(1)}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: 3,
                            justifyContent: "center",
                            margin: "8px 0",
                          }}
                        >
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              style={{
                                width: 14,
                                height: 14,
                                color:
                                  i < Math.floor(avgRating)
                                    ? "#C9A96E"
                                    : "rgba(245,240,232,0.15)",
                              }}
                            />
                          ))}
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            color: "rgba(245,240,232,0.4)",
                          }}
                        >
                          {listingReviews.length} review
                          {listingReviews.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          minWidth: 200,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {(
                          [
                            ["Cleanliness", "cleanliness"],
                            ["Service", "service"],
                            ["Location", "location"],
                            ["Value", "value"],
                          ] as [
                            string,
                            "cleanliness" | "service" | "location" | "value",
                          ][]
                        ).map(([label, key]) => {
                          const val = subAvg(key);
                          return (
                            <div
                              key={label}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "rgba(245,240,232,0.45)",
                                  width: 80,
                                  flexShrink: 0,
                                }}
                              >
                                {label}
                              </span>
                              <div
                                style={{
                                  flex: 1,
                                  height: 4,
                                  background: "rgba(245,240,232,0.08)",
                                  borderRadius: 99,
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    borderRadius: 99,
                                    background: "#C9A96E",
                                    width: `${val !== null ? (val / 5) * 100 : 0}%`,
                                    transition: "width 0.6s ease",
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "rgba(245,240,232,0.6)",
                                  width: 28,
                                  textAlign: "right",
                                }}
                              >
                                {val !== null ? val.toFixed(1) : "—"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {reviewsLoading ? (
                      <div
                        className="reviews-grid"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 14,
                        }}
                      >
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            style={{
                              background: "rgba(245,240,232,0.04)",
                              border: "1px solid rgba(245,240,232,0.07)",
                              borderRadius: 16,
                              padding: 20,
                              height: 140,
                              animation: "pulse 1.4s ease infinite",
                            }}
                          />
                        ))}
                      </div>
                    ) : listingReviews.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "48px 24px",
                          background: "rgba(245,240,232,0.03)",
                          border: "1px solid rgba(245,240,232,0.07)",
                          borderRadius: 18,
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "Cormorant Garamond, serif",
                            fontSize: 20,
                            fontWeight: 600,
                            color: "#f5f0e8",
                            marginBottom: 8,
                          }}
                        >
                          No reviews yet
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            color: "rgba(245,240,232,0.35)",
                          }}
                        >
                          Be the first to share your experience at {hotel.name}.
                        </p>
                      </div>
                    ) : (
                      <div
                        className="reviews-grid"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 14,
                        }}
                      >
                        {listingReviews.map((r) => (
                          <div
                            key={r.id}
                            style={{
                              background: "rgba(245,240,232,0.04)",
                              border: "1px solid rgba(245,240,232,0.07)",
                              borderRadius: 16,
                              padding: 20,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                marginBottom: 12,
                              }}
                            >
                              <div
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: "50%",
                                  background: "rgba(201,169,110,0.12)",
                                  border: "1px solid rgba(201,169,110,0.2)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#C9A96E",
                                  flexShrink: 0,
                                }}
                              >
                                {r.guestAvatar ||
                                  r.guestName?.[0]?.toUpperCase() ||
                                  "G"}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#f5f0e8",
                                  }}
                                >
                                  {r.guestName || "Guest"}
                                </p>
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: "rgba(245,240,232,0.35)",
                                  }}
                                >
                                  {fmtDate(r.createdAt)}
                                </p>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 2,
                                  flexShrink: 0,
                                }}
                              >
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    style={{
                                      width: 11,
                                      height: 11,
                                      color:
                                        i < Math.round(r.rating)
                                          ? "#C9A96E"
                                          : "rgba(245,240,232,0.15)",
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                            {r.title && (
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "rgba(245,240,232,0.85)",
                                  marginBottom: 6,
                                }}
                              >
                                {r.title}
                              </p>
                            )}
                            <p
                              style={{
                                fontSize: 12,
                                color: "rgba(245,240,232,0.45)",
                                lineHeight: 1.65,
                              }}
                            >
                              {r.body}
                            </p>
                            {r.hostReply && (
                              <div
                                style={{
                                  marginTop: 14,
                                  background: "rgba(201,169,110,0.06)",
                                  border: "1px solid rgba(201,169,110,0.15)",
                                  borderRadius: 12,
                                  padding: "12px 14px",
                                }}
                              >
                                <p
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#C9A96E",
                                    marginBottom: 4,
                                  }}
                                >
                                  {hotel.hostName ?? "Host"} replied
                                </p>
                                <p
                                  style={{
                                    fontSize: 12,
                                    color: "rgba(245,240,232,0.5)",
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {r.hostReply}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>

          {/* RIGHT — Booking widget */}
          <div
            className="booking-widget-col"
            style={{
              position: "sticky",
              top: 88,
              alignSelf: "start",
              animation: "fadeUp 0.5s ease 100ms both",
            }}
          >
            <div
              style={{
                background: "#141210",
                border: "1px solid rgba(245,240,232,0.1)",
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
              }}
            >
              <div
                style={{
                  background: "rgba(201,169,110,0.06)",
                  borderBottom: "1px solid rgba(245,240,232,0.08)",
                  padding: "22px 24px",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    color: "#C9A96E",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Selected Room
                </p>
                <h3
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#f5f0e8",
                    marginBottom: 2,
                  }}
                >
                  {room.name}
                </h3>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(245,240,232,0.35)",
                    marginBottom: 14,
                  }}
                >
                  {room.size} · {room.bed} · Up to {room.guests} guests
                </p>
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 4 }}
                >
                  <span
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: 32,
                      fontWeight: 700,
                      color: "#f5f0e8",
                    }}
                  >
                    ₦{room.price.toLocaleString()}
                  </span>
                  <span
                    style={{ fontSize: 13, color: "rgba(245,240,232,0.35)" }}
                  >
                    / night
                  </span>
                </div>
              </div>
              <div
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div style={{ position: "relative" }} ref={calInRef}>
                    <button
                      onClick={() => {
                        setShowCheckInCal((s) => !s);
                        setShowCheckOutCal(false);
                      }}
                      style={{
                        width: "100%",
                        background: "rgba(245,240,232,0.05)",
                        border: `1px solid ${showCheckInCal ? "#C9A96E" : "rgba(245,240,232,0.1)"}`,
                        borderRadius: 12,
                        padding: "10px 12px",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.15em",
                          color: "rgba(245,240,232,0.35)",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Check-in
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: checkIn ? "#f5f0e8" : "rgba(245,240,232,0.3)",
                        }}
                      >
                        {checkIn ? formatDate(checkIn) : "Select date"}
                      </p>
                    </button>
                    {showCheckInCal && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 8px)",
                          left: 0,
                          zIndex: 50,
                          background: "#1a1712",
                          border: "1px solid rgba(245,240,232,0.12)",
                          borderRadius: 16,
                          padding: 16,
                          minWidth: 260,
                          boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                        }}
                      >
                        <MiniCalendar
                          value={checkIn}
                          onChange={(d) => {
                            setCheckIn(d);
                            setShowCheckInCal(false);
                            if (checkOut && d >= checkOut) setCheckOut("");
                          }}
                          min={today}
                          label="Check-in date"
                        />
                      </div>
                    )}
                  </div>
                  <div style={{ position: "relative" }} ref={calOutRef}>
                    <button
                      onClick={() => {
                        setShowCheckOutCal((s) => !s);
                        setShowCheckInCal(false);
                      }}
                      style={{
                        width: "100%",
                        background: "rgba(245,240,232,0.05)",
                        border: `1px solid ${showCheckOutCal ? "#C9A96E" : "rgba(245,240,232,0.1)"}`,
                        borderRadius: 12,
                        padding: "10px 12px",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.15em",
                          color: "rgba(245,240,232,0.35)",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Check-out{" "}
                        {nights > 0 && (
                          <span style={{ color: "#C9A96E" }}>· {nights}n</span>
                        )}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: checkOut ? "#f5f0e8" : "rgba(245,240,232,0.3)",
                        }}
                      >
                        {checkOut ? formatDate(checkOut) : "Select date"}
                      </p>
                    </button>
                    {showCheckOutCal && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 8px)",
                          right: 0,
                          zIndex: 50,
                          background: "#1a1712",
                          border: "1px solid rgba(245,240,232,0.12)",
                          borderRadius: 16,
                          padding: 16,
                          minWidth: 260,
                          boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                        }}
                      >
                        <MiniCalendar
                          value={checkOut}
                          onChange={(d) => {
                            setCheckOut(d);
                            setShowCheckOutCal(false);
                          }}
                          min={checkIn || today}
                          label="Check-out date"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(245,240,232,0.05)",
                    border: "1px solid rgba(245,240,232,0.1)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        color: "rgba(245,240,232,0.35)",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Guests
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#f5f0e8",
                      }}
                    >
                      {guests} {guests === 1 ? "guest" : "guests"}
                    </p>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <button
                      onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "rgba(245,240,232,0.08)",
                        border: "1px solid rgba(245,240,232,0.1)",
                        color: "#f5f0e8",
                        cursor: "pointer",
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#f5f0e8",
                        minWidth: 20,
                        textAlign: "center",
                      }}
                    >
                      {guests}
                    </span>
                    <button
                      onClick={() =>
                        setGuests((g) => Math.min(room.guests, g + 1))
                      }
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "rgba(245,240,232,0.08)",
                        border: "1px solid rgba(245,240,232,0.1)",
                        color: "#f5f0e8",
                        cursor: "pointer",
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      color: "rgba(245,240,232,0.35)",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    Room Type
                  </p>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {roomTypes.map((rt) => (
                      <button
                        key={rt.id}
                        onClick={() => setSelectedRoom(rt.id)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: 10,
                          background:
                            selectedRoom === rt.id
                              ? "rgba(201,169,110,0.1)"
                              : "rgba(245,240,232,0.03)",
                          border: `1px solid ${selectedRoom === rt.id ? "rgba(201,169,110,0.35)" : "rgba(245,240,232,0.07)"}`,
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#f5f0e8",
                          }}
                        >
                          {rt.name}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color:
                              selectedRoom === rt.id
                                ? "#C9A96E"
                                : "rgba(245,240,232,0.4)",
                            flexShrink: 0,
                            marginLeft: 8,
                          }}
                        >
                          ${rt.price.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                {nights > 0 && (
                  <div
                    style={{
                      borderTop: "1px solid rgba(245,240,232,0.07)",
                      paddingTop: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {[
                      [
                        `₦${room.price.toLocaleString()} × ${nights} nights`,
                        `₦${subtotal.toLocaleString()}`,
                      ],
                      ["Taxes & resort fees", `₦${taxes.toLocaleString()}`],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: "rgba(245,240,232,0.4)",
                        }}
                      >
                        <span>{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#f5f0e8",
                        paddingTop: 10,
                        borderTop: "1px solid rgba(245,240,232,0.07)",
                      }}
                    >
                      <span>Total</span>
                      <span style={{ color: "#C9A96E" }}>
                        ₦{total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setStep("form")}
                  style={{
                    width: "100%",
                    background: "#C9A96E",
                    color: "#0e0d0b",
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "16px 0",
                    borderRadius: 14,
                    border: "none",
                    cursor: "pointer",
                    letterSpacing: "0.04em",
                  }}
                  onMouseOver={(e) =>
                    ((e.target as HTMLButtonElement).style.background =
                      "#dfc08a")
                  }
                  onMouseOut={(e) =>
                    ((e.target as HTMLButtonElement).style.background =
                      "#C9A96E")
                  }
                >
                  Reserve ·{" "}
                  {nights > 0
                    ? `₦${total.toLocaleString()}`
                    : `From ₦${room.price.toLocaleString()}`}
                </button>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "center",
                    fontSize: 12,
                    color: "rgba(245,240,232,0.3)",
                  }}
                >
                  <ShieldCheckIcon
                    style={{ width: 14, height: 14, color: "#C9A96E" }}
                  />
                  Free cancellation · No charge until confirmed
                </div>
                <div
                  style={{
                    borderTop: "1px solid rgba(245,240,232,0.07)",
                    paddingTop: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "rgba(245,240,232,0.08)",
                      border: "1px solid rgba(245,240,232,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <UserIcon
                      style={{ width: 16, height: 16, color: "#C9A96E" }}
                    />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#f5f0e8",
                      }}
                    >
                      Speak to a Concierge
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 2,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#4ade80",
                          display: "inline-block",
                        }}
                      />
                      <p
                        style={{
                          fontSize: 11,
                          color: "rgba(245,240,232,0.35)",
                        }}
                      >
                        Available 24/7 · Avg reply 4 min
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setChatOpen(true)}
                    style={{
                      marginLeft: "auto",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#C9A96E",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Chat →
                  </button>
                </div>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                marginTop: 10,
              }}
            >
              {[
                ["🔒", "Secure", "256-bit SSL"],
                ["✓", "Verified", "Official listing"],
                ["🏅", "Best Price", "Guaranteed"],
              ].map(([icon, title, sub]) => (
                <div
                  key={String(title)}
                  style={{
                    background: "#141210",
                    border: "1px solid rgba(245,240,232,0.08)",
                    borderRadius: 14,
                    padding: "12px 8px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                  <p
                    style={{ fontSize: 11, fontWeight: 700, color: "#f5f0e8" }}
                  >
                    {title}
                  </p>
                  <p style={{ fontSize: 10, color: "rgba(245,240,232,0.3)" }}>
                    {sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(14,13,11,0.97)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(245,240,232,0.08)",
          padding: "12px 20px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 30,
          gap: 12,
        }}
        className="lg:hidden"
      >
        <div>
          <p
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: 20,
              fontWeight: 700,
              color: "#f5f0e8",
            }}
          >
            ₦{room.price.toLocaleString()}{" "}
            <span
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "rgba(245,240,232,0.4)",
              }}
            >
              / night
            </span>
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <StarIcon style={{ width: 12, height: 12, color: "#C9A96E" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#f5f0e8" }}>
              {hotel.rating}
            </span>
            <span style={{ fontSize: 11, color: "rgba(245,240,232,0.4)" }}>
              ({hotel.reviewCount.toLocaleString()})
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setChatOpen(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(245,240,232,0.07)",
              border: "1px solid rgba(245,240,232,0.12)",
              color: "#f5f0e8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <ChatBubbleLeftRightIcon style={{ width: 20, height: 20 }} />
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#4ade80",
                border: "1.5px solid #0e0d0b",
              }}
            />
          </button>
          <button
            onClick={() => setStep("form")}
            style={{
              background: "#C9A96E",
              color: "#0e0d0b",
              fontWeight: 700,
              fontSize: 14,
              padding: "12px 24px",
              borderRadius: 14,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Reserve{nights > 0 ? ` · ₦${total.toLocaleString()}` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
