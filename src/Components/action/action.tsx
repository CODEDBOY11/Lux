import { useEffect, useState } from "react";
import {
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { ReviewsDB, type Review } from "../../index";

const T = {
  gold: "#C9A96E",
  goldHover: "#d4b87e",
};

const CARD_COUNT = 3;
const MIN_RATING = 4;

/** Fisher-Yates shuffle — avoids the subtle bias of Array.sort(() => Math.random() - 0.5) */
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
  <div className="flex gap-1 mb-4">
    {[...Array(5)].map((_, i) => (
      <StarSolid
        key={i}
        className="w-[11px] h-[11px]"
        style={{ color: i < rating ? T.gold : "rgba(201,169,110,0.25)" }}
      />
    ))}
  </div>
);

const CardSkeleton = () => (
  <div
    className="animate-pulse rounded-2xl border p-5 sm:p-7"
    style={{
      background: "rgba(255,255,255,0.05)",
      borderColor: "rgba(201,169,110,0.15)",
    }}
  >
    <div className="flex gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-[11px] h-[11px] rounded-full bg-white/10" />
      ))}
    </div>
    <div className="space-y-2 mb-5">
      <div className="h-3 bg-white/10 rounded-full w-full" />
      <div className="h-3 bg-white/10 rounded-full w-5/6" />
      <div className="h-3 bg-white/10 rounded-full w-2/3" />
    </div>
    <div
      className="flex items-center gap-2.5 pt-4"
      style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)" }}
    >
      <div className="w-[34px] h-[34px] rounded-full bg-white/10 shrink-0" />
      <div className="h-3 bg-white/10 rounded-full w-24" />
    </div>
  </div>
);

export default function TestimonialsCTA() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    ReviewsDB.featured(30)
      .then((all) => {
        if (cancelled) return;
        const qualified = all.filter(
          (r) => r.rating >= MIN_RATING && r.body.trim().length > 0,
        );
        setReviews(shuffle(qualified).slice(0, CARD_COUNT));
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setReviews([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loading = reviews === null;
  const hasReviews = !loading && reviews.length > 0;

  return (
    <section
      className="relative py-16 sm:py-20 md:py-24 px-5 sm:px-8 md:px-10 overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif", background: "#0a0908" }}
    >
      {/* Ambient gradient texture — replaces the photo background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201,169,110,0.14), transparent),
                            radial-gradient(ellipse 60% 45% at 85% 105%, rgba(110,173,201,0.08), transparent),
                            radial-gradient(ellipse 50% 40% at 5% 60%, rgba(201,169,110,0.06), transparent)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center text-white">
        {/* Header */}
        <span className="inline-block text-[10px] sm:text-[11px] font-medium tracking-[0.16em] sm:tracking-[0.18em] uppercase text-[#C9A96E] mb-3">
          Guest Experiences
        </span>
        <h2
          className="text-[clamp(28px,6vw,40px)] font-semibold leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          What Our Guests Say
        </h2>
        <div className="w-10 h-[1.5px] bg-[#C9A96E] mx-auto mt-4 sm:mt-5 mb-9 sm:mb-12 rounded-full" />

        {/* Testimonial Cards */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: CARD_COUNT }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && !hasReviews && (
          <div
            className="rounded-2xl border p-10 max-w-md mx-auto"
            style={{
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(201,169,110,0.2)",
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: "rgba(201,169,110,0.15)",
                border: "1px solid rgba(201,169,110,0.3)",
              }}
            >
              <ChatBubbleLeftRightIcon
                className="w-5 h-5"
                style={{ color: T.gold }}
              />
            </div>
            <p className="text-white/60 text-sm">
              {error
                ? "Couldn't load guest reviews right now."
                : "No reviews yet — be the first to share your stay."}
            </p>
          </div>
        )}

        {hasReviews && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {reviews.map((r, i) => (
              <div
                key={r.id}
                className={`group flex flex-col justify-between text-left p-5 sm:p-7 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
                  // On a 2-up tablet layout, let an odd one out span both columns
                  reviews.length % 2 === 1 && i === reviews.length - 1
                    ? "sm:col-span-2 lg:col-span-1"
                    : ""
                }`}
                style={{
                  background: "rgba(255,255,255,0.07)",
                  borderColor: "rgba(201,169,110,0.25)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.borderColor = "rgba(201,169,110,0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.borderColor = "rgba(201,169,110,0.25)";
                }}
              >
                <div>
                  <Stars rating={r.rating} />
                  <p className="text-[13px] text-white/80 leading-[1.8] font-light italic line-clamp-5">
                    "{r.body}"
                  </p>
                </div>
                <div
                  className="flex items-center gap-2.5 mt-5 pt-4"
                  style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)" }}
                >
                  {r.guestAvatar ? (
                    <img
                      src={r.guestAvatar}
                      alt=""
                      loading="lazy"
                      className="w-[34px] h-[34px] rounded-full object-cover flex-shrink-0 border"
                      style={{ borderColor: "rgba(201,169,110,0.4)" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-medium text-[#C9A96E] flex-shrink-0 border"
                      style={{
                        background: "rgba(201,169,110,0.2)",
                        borderColor: "rgba(201,169,110,0.4)",
                      }}
                    >
                      {initialsFrom(r.guestName || "Guest")}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-white leading-tight truncate">
                      {r.guestName || "Verified Guest"}
                    </p>
                    <p className="text-[11px] text-white/45 mt-0.5 truncate">
                      Verified stay
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 sm:mt-20">
          <h3
            className="text-[clamp(22px,5vw,30px)] font-semibold text-white leading-snug px-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Ready to Find Your Perfect Stay?
          </h3>
          <p className="text-sm text-white/55 font-light mt-2">
            Start exploring luxury stays tailored just for you
          </p>
          <button
            className="inline-flex items-center gap-2 mt-7 px-7 sm:px-8 py-3.5 rounded-full text-[13px] font-medium tracking-wide transition-transform duration-200 hover:scale-[1.04]"
            style={{ background: T.gold, color: "#1a1a1a" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = T.goldHover)
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = T.gold)}
          >
            Get Started
            <ArrowRightIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
    </section>
  );
}
