import { useEffect, useState } from "react";
import {
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { ReviewsDB, type Review } from "../../index";

const T = {
  gold: "#C9A96E",
  goldHover: "#B8935A",
};

const CARD_COUNT = 3;
const MIN_RATING = 4;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const Stars = ({ rating }: { rating: number }) => (
  <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
    {[...Array(5)].map((_, i) => (
      <StarSolid
        key={i}
        style={{ width: 11, height: 11, color: i < rating ? T.gold : "rgba(201,169,110,0.22)" }}
      />
    ))}
  </div>
);

const CardSkeleton = () => (
  <div style={{
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(201,169,110,0.12)",
    borderRadius: 16, padding: "20px 22px",
    animation: "pulse 1.6s ease infinite",
  }}>
    <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
      {[...Array(5)].map((_, i) => <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />)}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
      {[100, 83, 67].map((w) => <div key={w} style={{ height: 11, background: "rgba(255,255,255,0.07)", borderRadius: 99, width: `${w}%` }} />)}
    </div>
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
      <div style={{ height: 11, background: "rgba(255,255,255,0.07)", borderRadius: 99, width: 100 }} />
    </div>
  </div>
);

export default function TestimonialsCTA({ onExplore }: { onExplore?: () => void }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ReviewsDB.featured(30)
      .then((all) => {
        if (cancelled) return;
        const qualified = all.filter((r) => r.rating >= MIN_RATING && r.body.trim().length > 0);
        setReviews(shuffle(qualified).slice(0, CARD_COUNT));
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setReviews([]);
      });
    return () => { cancelled = true; };
  }, []);

  const loading = reviews === null;
  const hasReviews = !loading && reviews.length > 0;

  return (
    <section style={{
      position: "relative",
      background: "#0a0908",
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      padding: "clamp(52px, 9vw, 88px) max(16px, env(safe-area-inset-left, 0px))",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .55; }
        }
        @keyframes act-fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Ambient texture */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          radial-gradient(ellipse 80% 55% at 50% -5%, rgba(201,169,110,0.13), transparent),
          radial-gradient(ellipse 55% 40% at 88% 100%, rgba(110,173,201,0.07), transparent),
          radial-gradient(ellipse 45% 35% at 5% 65%, rgba(201,169,110,0.05), transparent)
        `,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(36px, 6vw, 56px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 20, height: 1, background: T.gold }} />
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".26em", color: T.gold, textTransform: "uppercase" }}>
              Guest Stories
            </p>
            <div style={{ width: 20, height: 1, background: T.gold }} />
          </div>
          <h2 style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "clamp(28px, 6vw, 42px)",
            fontWeight: 500, color: "rgba(255,255,255,0.92)",
            lineHeight: 1.1, letterSpacing: "-.01em",
          }}>
            Real Guests,<br />
            <em style={{ fontStyle: "italic", color: T.gold }}>Real Stays</em>
          </h2>
          <div style={{ width: 28, height: 1.5, background: T.gold, borderRadius: 99, margin: "16px auto 0" }} />
          <p style={{
            color: "rgba(255,255,255,.45)", fontSize: 13, lineHeight: 1.75,
            maxWidth: 360, margin: "14px auto 0", fontWeight: 300,
          }}>
            Every review is from a verified Eden booking. We never edit or remove them.
          </p>
        </div>

        {/* Reviews */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {Array.from({ length: CARD_COUNT }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {!loading && !hasReviews && (
          <div style={{
            maxWidth: 380, margin: "0 auto",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(201,169,110,0.2)",
            borderRadius: 16, padding: "36px 24px", textAlign: "center",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", margin: "0 auto 14px",
              background: "rgba(201,169,110,0.12)",
              border: "1px solid rgba(201,169,110,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ChatBubbleLeftRightIcon style={{ width: 22, height: 22, color: T.gold }} />
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 300 }}>
              {error ? "Couldn't load reviews right now." : "No reviews yet — be the first to share your stay."}
            </p>
          </div>
        )}

        {hasReviews && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {reviews.map((r, i) => (
              <div
                key={r.id}
                style={{
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  textAlign: "left", padding: "20px 22px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(201,169,110,0.22)",
                  backdropFilter: "blur(10px)",
                  transition: "background .25s, border-color .25s",
                  cursor: "default",
                  animation: `act-fadeUp .45s ease ${i * 70}ms both`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.11)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,169,110,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,169,110,0.22)";
                }}
              >
                <div>
                  <Stars rating={r.rating} />
                  <p style={{
                    fontSize: 13, color: "rgba(255,255,255,.78)",
                    lineHeight: 1.8, fontWeight: 300, fontStyle: "italic",
                    display: "-webkit-box", WebkitLineClamp: 5,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    "{r.body}"
                  </p>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  marginTop: 18, paddingTop: 14,
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}>
                  {r.guestAvatar ? (
                    <img src={r.guestAvatar} alt="" loading="lazy"
                      style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(201,169,110,0.35)" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(201,169,110,0.18)",
                      border: "1px solid rgba(201,169,110,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 600, color: T.gold,
                    }}>
                      {initialsFrom(r.guestName || "Guest")}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.guestName || "Verified Guest"}
                    </p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 2, fontWeight: 400 }}>
                      Verified stay · Eden
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: "clamp(52px, 8vw, 72px)" }}>
          {/* Nigerian trust signals */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 20, marginBottom: 28, flexWrap: "wrap",
          }}>
            {[
              { icon: "₦", text: "Naira pricing" },
              { icon: "✓", text: "No hidden fees" },
              { icon: "🔒", text: "Paystack secure" },
            ].map((b) => (
              <div key={b.text} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.1)",
                padding: "5px 14px", borderRadius: 99,
              }}>
                <span style={{ fontSize: 12 }}>{b.icon}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)", fontWeight: 400 }}>{b.text}</span>
              </div>
            ))}
          </div>

          <h3 style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "clamp(24px, 5vw, 34px)",
            fontWeight: 500, color: "rgba(255,255,255,.92)",
            lineHeight: 1.2, marginBottom: 10,
          }}>
            Ready to Find Your Perfect Stay?
          </h3>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.42)", fontWeight: 300, marginBottom: 28 }}>
            Thousands of Nigerians have already booked through Eden — your turn.
          </p>

          <button
            onClick={onExplore}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: T.gold, color: "#1A1714",
              border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700, letterSpacing: ".03em",
              padding: "14px 32px", borderRadius: 99,
              transition: "background .18s, transform .15s",
              boxShadow: "0 8px 28px rgba(201,169,110,.3)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = T.goldHover;
              (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = T.gold;
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            }}
          >
            Explore Luxury Stays
            <ArrowRightIcon style={{ width: 14, height: 14 }} />
          </button>

          <p style={{ marginTop: 14, fontSize: 11, color: "rgba(255,255,255,.25)", fontWeight: 300 }}>
            No booking fees · Cancel for free · Pay in Naira
          </p>
        </div>
      </div>
    </section>
  );
}