import { useState, useRef, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { StarIcon, FireIcon } from "@heroicons/react/24/solid";
import logo from "../../public/logo.svg";
import {
  searchHotels,
  getLocationSuggestions,
  type Hotel,
  type SearchParams,
} from "../index";

type SearchState = {
  query: string;
  checkIn: string;
  checkOut: string;
  guests: string;
};

/* ─── tokens ─────────────────────────────────────────── */
const T = {
  white: "#FFFFFF",
  surface: "#F7F6F3",
  border: "#E8E5E0",
  text: "#1A1814",
  sub: "#6B6560",
  muted: "#A09890",
  gold: "#C9A96E",
  goldDim: "rgba(201,169,110,0.15)",
  goldBorder: "rgba(201,169,110,0.3)",
};

/* ─── Hotel Card (light) ─────────────────────────────── */
const HotelCard = ({
  hotel,
  nights,
  onBook,
  index = 0,
}: {
  hotel: Hotel;
  nights: number;
  onBook?: (h: Hotel) => void;
  index?: number;
}) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.white,
        border: `1px solid ${hov ? T.goldBorder : T.border}`,
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color .22s, box-shadow .22s, transform .22s",
        boxShadow: hov
          ? "0 12px 40px rgba(0,0,0,0.10)"
          : "0 2px 8px rgba(0,0,0,0.04)",
        transform: hov ? "translateY(-2px)" : "none",
        animation: `fadeUp .45s ease ${index * 55}ms both`,
      }}
    >
      <div style={{ position: "relative", height: 196, overflow: "hidden" }}>
        <img
          src={hotel.thumbnail}
          alt={hotel.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform .6s",
            transform: hov ? "scale(1.04)" : "scale(1)",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400";
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(26,24,20,.45) 0%, transparent 55%)",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "rgba(255,255,255,.88)",
            backdropFilter: "blur(8px)",
            color: T.text,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            padding: "4px 11px",
            borderRadius: 99,
            border: `1px solid ${T.border}`,
          }}
        >
          {hotel.category}
        </span>
        {hotel.featured && (
          <span
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: T.gold,
              color: T.white,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              padding: "4px 11px",
              borderRadius: 99,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FireIcon style={{ width: 9, height: 9 }} /> Featured
          </span>
        )}
        {hotel.rating > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(255,255,255,.88)",
              backdropFilter: "blur(8px)",
              padding: "4px 10px",
              borderRadius: 99,
              border: `1px solid ${T.border}`,
            }}
          >
            <StarIcon style={{ width: 10, height: 10, color: T.gold }} />
            <span style={{ color: T.text, fontSize: 11, fontWeight: 700 }}>
              {hotel.rating}
            </span>
            {hotel.reviewCount > 0 && (
              <span style={{ color: T.muted, fontSize: 10 }}>
                ({hotel.reviewCount})
              </span>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          padding: "18px 20px 20px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <h3
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontWeight: 600,
            color: T.text,
            fontSize: 17,
            lineHeight: 1.25,
            marginBottom: 5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {hotel.name}
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginBottom: 10,
          }}
        >
          <MapPinIcon
            style={{ width: 12, height: 12, color: T.gold, flexShrink: 0 }}
          />
          <span
            style={{
              color: T.muted,
              fontSize: 12,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {hotel.location}
          </span>
        </div>
        <p
          style={{
            color: T.sub,
            fontSize: 12.5,
            lineHeight: 1.65,
            marginBottom: 14,
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {hotel.shortDescription}
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            marginBottom: 16,
          }}
        >
          {hotel.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: T.gold,
                background: T.goldDim,
                border: `1px solid ${T.goldBorder}`,
                padding: "3px 10px",
                borderRadius: 99,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${T.border}`,
            paddingTop: 14,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: 21,
                  fontWeight: 700,
                  color: T.text,
                }}
              >
                ₦{hotel.pricePerNight.toLocaleString()}
              </span>
              <span style={{ color: T.muted, fontSize: 11 }}>/ night</span>
            </div>
            {nights > 0 && (
              <p style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>
                ₦{(hotel.pricePerNight * nights).toLocaleString()} · {nights}n
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onBook?.(hotel)}
            style={{
              background: T.gold,
              color: T.white,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              padding: "10px 20px",
              borderRadius: 10,
              letterSpacing: ".03em",
              transition: "background .18s, transform .15s",
              boxShadow: "0 4px 14px rgba(201,169,110,.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#B8935A";
              (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = T.gold;
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            }}
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Results Panel ──────────────────────────────────── */
const ResultsPanel = ({
  results,
  nights,
  query,
  loading,
  onClose,
  onBook,
}: {
  results: Hotel[];
  nights: number;
  query: string;
  loading: boolean;
  onClose: () => void;
  onBook?: (h: Hotel) => void;
}) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 50,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
    }}
    className="sm:items-center sm:p-4 md:p-6"
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(26,24,20,.55)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    />
    <div
      style={{
        position: "relative",
        zIndex: 10,
        background: "#F7F6F3",
        border: `1px solid ${T.border}`,
        width: "100%",
        maxHeight: "92dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      className="sm:max-w-2xl md:max-w-4xl lg:max-w-6xl sm:rounded-2xl rounded-t-2xl"
    >
      {/* header */}
      <div
        style={{
          padding: "20px 28px",
          background: T.white,
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: ".22em",
              color: T.gold,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Results
          </p>
          <h2
            style={{
              fontFamily: "Cormorant Garamond, serif",
              color: T.text,
              fontWeight: 600,
              fontSize: 22,
            }}
          >
            {loading
              ? "Searching…"
              : results.length > 0
                ? `${results.length} propert${results.length !== 1 ? "ies" : "y"} found`
                : "No properties matched"}
          </h2>
          {query && (
            <p style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>
              for "{query}"
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: T.surface,
            border: `1px solid ${T.border}`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <XMarkIcon style={{ width: 15, height: 15, color: T.sub }} />
        </button>
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: "24px 28px 32px" }}>
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: 18,
            }}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  background: T.white,
                  borderRadius: 16,
                  overflow: "hidden",
                  border: `1px solid ${T.border}`,
                  animationDelay: `${i * 70}ms`,
                }}
                className="animate-pulse"
              >
                <div style={{ height: 196, background: T.surface }} />
                <div
                  style={{
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {[70, 45, 90].map((w) => (
                    <div
                      key={w}
                      style={{
                        height: 11,
                        background: T.surface,
                        borderRadius: 99,
                        width: `${w}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "64px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: T.goldDim,
                border: `1px solid ${T.goldBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <MagnifyingGlassIcon
                style={{ width: 26, height: 26, color: T.gold }}
              />
            </div>
            <h3
              style={{
                fontFamily: "Cormorant Garamond, serif",
                color: T.text,
                fontWeight: 600,
                fontSize: 21,
                marginBottom: 8,
              }}
            >
              No stays matched
            </h3>
            <p
              style={{
                color: T.sub,
                fontSize: 13,
                maxWidth: 290,
                lineHeight: 1.7,
                marginBottom: 22,
              }}
            >
              Try a different destination, adjust your dates, or change the
              guest count.
            </p>
            <button
              onClick={onClose}
              style={{
                background: T.gold,
                color: T.white,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                padding: "12px 28px",
                borderRadius: 10,
              }}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: 18,
            }}
          >
            {results.map((h, i) => (
              <HotelCard
                key={h.id}
                hotel={h}
                nights={nights}
                onBook={onBook}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

/* ─── Hero ───────────────────────────────────────────── */
const Hero = ({
  onBook,
  onLogin,
  onSignup,
}: {
  onBook?: (h: Hotel) => void;
  onLogin?: () => void;
  onSignup?: () => void;
}) => {
  const [form, setForm] = useState<SearchState>({
    query: "",
    checkIn: "",
    checkOut: "",
    guests: "",
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [results, setResults] = useState<Hotel[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audience, setAudience] = useState<"guest" | "host">("guest");
  const sugRef = useRef<HTMLDivElement>(null);

  const nights = (() => {
    if (!form.checkIn || !form.checkOut) return 0;
    return Math.max(
      0,
      Math.round(
        (new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) /
          86400000,
      ),
    );
  })();

  useEffect(() => {
    if (form.query.length < 1) {
      setSuggestions([]);
      setShowSug(false);
      return;
    }
    getLocationSuggestions(form.query).then((s) => {
      setSuggestions(s);
      setShowSug(s.length > 0);
    });
  }, [form.query]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (sugRef.current && !sugRef.current.contains(e.target as Node))
        setShowSug(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const doSearch = useCallback(
    async (override?: Partial<SearchParams>) => {
      setLoading(true);
      setSearched(true);
      setResults(null);
      try {
        setResults(
          await searchHotels({
            query: form.query.trim() || undefined,
            checkIn: form.checkIn || undefined,
            checkOut: form.checkOut || undefined,
            guests: form.guests ? parseInt(form.guests) : undefined,
            ...override,
          }),
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setShowSug(false);
      }
    },
    [form],
  );

  const today = new Date().toISOString().split("T")[0];

  /* shared field label */
  const Label = ({ children }: { children: React.ReactNode }) => (
    <p
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: ".2em",
        color: T.muted,
        textTransform: "uppercase",
        marginBottom: 5,
      }}
    >
      {children}
    </p>
  );

  const guestCopy = {
    eyebrow: "For Guests",
    headline: (
      <>
        Every Stay,
        <br />
        <em style={{ fontStyle: "italic", color: T.gold }}>Carefully</em> Chosen
      </>
    ),
    sub: "Browse properties verified for quality — from city penthouses to island retreats. Book with confidence.",
    cta: "Explore Stays",
  };
  const hostCopy = {
    eyebrow: "For Hosts",
    headline: (
      <>
        Your Property,
        <br />
        <em style={{ fontStyle: "italic", color: T.gold }}>Properly</em>{" "}
        Presented
      </>
    ),
    sub: "List with a platform that values your property as much as you do. Reach guests who appreciate quality.",
    cta: "List a Property",
  };
  const copy = audience === "guest" ? guestCopy : hostCopy;

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap');
        * { box-sizing: border-box; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity:.4; cursor:pointer; }
        input::placeholder { color: ${T.muted} !important; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:99px; }
        .lux-field:focus-within { border-color: ${T.gold} !important; }
        .audience-pill { transition: background .2s, color .2s, border-color .2s; }
      `}</style>

      {searched && (
        <ResultsPanel
          results={results ?? []}
          nights={nights}
          query={form.query}
          loading={loading}
          onClose={() => {
            setResults(null);
            setSearched(false);
          }}
          onBook={onBook}
        />
      )}

      <div
        style={{
          background: T.white,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        }}
      >
        {/* ── NAV ── */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 52px",
            height: 68,
            borderBottom: `1px solid ${T.border}`,
            position: "sticky",
            top: 0,
            background: "rgba(255,255,255,.96)",
            backdropFilter: "blur(12px)",
            zIndex: 30,
          }}
          className="px-5 sm:px-10 md:px-[52px]"
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              cursor: "pointer",
            }}
          >
            <img src={logo} alt="LuxStay" style={{ width: 32, height: 32 }} />
            <span
              style={{
                fontFamily: "Cormorant Garamond, serif",
                color: T.text,
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: ".01em",
              }}
            >
              LuxStay
            </span>
          </div>

          {/* Desktop links */}
          <div
            className="hidden md:flex"
            style={{ display: "flex", alignItems: "center", gap: 28 }}
          >
            {["Explore", "How it Works", "For Hosts"].map((l) => (
              <a
                key={l}
                href="#"
                style={{
                  color: T.sub,
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "color .18s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = T.sub)}
              >
                {l}
              </a>
            ))}
            <div style={{ width: 1, height: 16, background: T.border }} />
            <button
              type="button"
              onClick={onLogin}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: T.sub,
                fontSize: 13,
                fontWeight: 500,
                transition: "color .18s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = T.sub)}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onSignup}
              style={{
                background: T.text,
                color: T.white,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                padding: "9px 22px",
                borderRadius: 99,
                letterSpacing: ".02em",
                transition: "background .18s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#2D2924")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = T.text)}
            >
              List a Property
            </button>
          </div>

          {/* Mobile */}
          <div
            className="flex md:hidden"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <button
              type="button"
              onClick={onLogin}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: T.sub,
                fontSize: 13,
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onSignup}
              style={{
                background: T.text,
                color: T.white,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                padding: "8px 16px",
                borderRadius: 99,
              }}
            >
              Join
            </button>
          </div>
        </nav>

        {/* ── HERO BODY ── */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 24px 80px",
          }}
        >
          <div style={{ width: "100%", maxWidth: 840 }}>
            {/* Audience toggle */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 99,
                padding: 4,
                marginBottom: 36,
                animation: "fadeUp .4s ease both",
              }}
            >
              {(["guest", "host"] as const).map((a) => (
                <button
                  key={a}
                  className="audience-pill"
                  onClick={() => setAudience(a)}
                  style={{
                    background: audience === a ? T.white : "transparent",
                    color: audience === a ? T.text : T.muted,
                    border:
                      audience === a
                        ? `1px solid ${T.border}`
                        : "1px solid transparent",
                    borderRadius: 99,
                    padding: "7px 20px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow:
                      audience === a ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                    letterSpacing: ".02em",
                  }}
                >
                  {a === "guest" ? "I'm a Guest" : "I'm a Host"}
                </button>
              ))}
            </div>

            {/* Eyebrow */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
                animation: "fadeUp .45s ease 40ms both",
              }}
            >
              <div style={{ width: 28, height: 1, background: T.gold }} />
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".28em",
                  color: T.gold,
                  textTransform: "uppercase",
                }}
              >
                {copy.eyebrow}
              </p>
            </div>

            {/* Headline — left-aligned, large Cormorant */}
            <h1
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "clamp(44px, 7vw, 80px)",
                fontWeight: 500,
                lineHeight: 1.08,
                color: T.text,
                marginBottom: 20,
                letterSpacing: "-.01em",
                animation: "fadeUp .5s ease 80ms both",
              }}
            >
              {copy.headline}
            </h1>

            <p
              style={{
                color: T.sub,
                fontSize: 15,
                lineHeight: 1.75,
                maxWidth: 480,
                marginBottom: 48,
                animation: "fadeUp .5s ease 120ms both",
              }}
            >
              {copy.sub}
            </p>

            {/* ── SEARCH PANEL ── */}
            <div style={{ animation: "fadeUp .5s ease 160ms both" }}>
              {/* Desktop */}
              <div
                className="hidden sm:flex"
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  background: T.white,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 16,
                  boxShadow:
                    "0 4px 24px rgba(0,0,0,.07), 0 1px 3px rgba(0,0,0,.04)",
                  overflow: "visible",
                  position: "relative",
                }}
              >
                {/* Location */}
                <div
                  ref={sugRef}
                  className="lux-field"
                  style={{
                    flex: "2 1 0",
                    padding: "16px 20px",
                    borderRight: `1px solid ${T.border}`,
                    borderRadius: "14px 0 0 14px",
                    border: `1.5px solid transparent`,
                    transition: "border-color .18s",
                    position: "relative",
                  }}
                >
                  <Label>Destination</Label>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <MapPinIcon
                      style={{
                        width: 14,
                        height: 14,
                        color: T.gold,
                        flexShrink: 0,
                      }}
                    />
                    <input
                      type="text"
                      value={form.query}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, query: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && doSearch()}
                      onFocus={() => suggestions.length > 0 && setShowSug(true)}
                      placeholder="City, country or style…"
                      autoComplete="off"
                      style={{
                        flex: 1,
                        background: "none",
                        border: "none",
                        outline: "none",
                        color: T.text,
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    />
                    {form.query && (
                      <button
                        onClick={() => setForm((f) => ({ ...f, query: "" }))}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          lineHeight: 0,
                        }}
                      >
                        <XMarkIcon
                          style={{ width: 13, height: 13, color: T.muted }}
                        />
                      </button>
                    )}
                  </div>
                  {showSug && suggestions.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: -1,
                        zIndex: 40,
                        background: T.white,
                        border: `1px solid ${T.border}`,
                        borderRadius: 14,
                        overflow: "hidden",
                        minWidth: 260,
                        boxShadow: "0 12px 40px rgba(0,0,0,.12)",
                      }}
                    >
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setForm((f) => ({ ...f, query: s }));
                            setShowSug(false);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "11px 16px",
                            fontSize: 13,
                            color: T.sub,
                            background: "none",
                            border: "none",
                            borderBottom: `1px solid ${T.border}`,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            transition: "background .14s, color .14s",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              T.surface;
                            (e.currentTarget as HTMLElement).style.color =
                              T.text;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "none";
                            (e.currentTarget as HTMLElement).style.color =
                              T.sub;
                          }}
                        >
                          <MapPinIcon
                            style={{
                              width: 13,
                              height: 13,
                              color: T.gold,
                              flexShrink: 0,
                            }}
                          />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Check-in */}
                <div
                  className="lux-field"
                  style={{
                    flex: "1 1 0",
                    padding: "16px 16px",
                    borderRight: `1px solid ${T.border}`,
                    border: `1.5px solid transparent`,
                    transition: "border-color .18s",
                  }}
                >
                  <Label>Check-in</Label>
                  <input
                    type="date"
                    min={today}
                    value={form.checkIn}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        checkIn: e.target.value,
                        checkOut:
                          f.checkOut && f.checkOut <= e.target.value
                            ? ""
                            : f.checkOut,
                      }))
                    }
                    style={{
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: form.checkIn ? T.text : T.muted,
                      fontSize: 12,
                      fontWeight: 500,
                      width: "100%",
                      colorScheme: "light",
                    }}
                  />
                </div>

                {/* Check-out */}
                <div
                  className="lux-field"
                  style={{
                    flex: "1 1 0",
                    padding: "16px 16px",
                    borderRight: `1px solid ${T.border}`,
                    border: `1.5px solid transparent`,
                    transition: "border-color .18s",
                  }}
                >
                  <Label>
                    Check-out
                    {nights > 0 && (
                      <span
                        style={{
                          color: T.gold,
                          marginLeft: 6,
                          fontWeight: 700,
                          textTransform: "none",
                          letterSpacing: 0,
                        }}
                      >
                        {nights}n
                      </span>
                    )}
                  </Label>
                  <input
                    type="date"
                    min={form.checkIn || today}
                    value={form.checkOut}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, checkOut: e.target.value }))
                    }
                    style={{
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: form.checkOut ? T.text : T.muted,
                      fontSize: 12,
                      fontWeight: 500,
                      width: "100%",
                      colorScheme: "light",
                    }}
                  />
                </div>

                {/* Guests */}
                <div
                  className="lux-field"
                  style={{
                    width: 100,
                    padding: "16px 16px",
                    borderRight: `1px solid ${T.border}`,
                    border: `1.5px solid transparent`,
                    transition: "border-color .18s",
                  }}
                >
                  <Label>Guests</Label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={form.guests}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guests: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && doSearch()}
                    placeholder="Any"
                    style={{
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: T.text,
                      fontSize: 13,
                      fontWeight: 500,
                      width: "100%",
                    }}
                  />
                </div>

                {/* CTA */}
                <div style={{ padding: "8px" }}>
                  <button
                    onClick={() => doSearch()}
                    disabled={loading}
                    style={{
                      background: T.gold,
                      color: T.white,
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.7 : 1,
                      fontWeight: 700,
                      fontSize: 13,
                      height: "100%",
                      padding: "0 24px",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      letterSpacing: ".03em",
                      whiteSpace: "nowrap",
                      boxShadow: "0 4px 16px rgba(201,169,110,.4)",
                      transition: "background .18s",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading)
                        (e.currentTarget as HTMLElement).style.background =
                          "#B8935A";
                    }}
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        T.gold)
                    }
                  >
                    {loading ? (
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          border: "2px solid rgba(255,255,255,.3)",
                          borderTopColor: T.white,
                          borderRadius: "50%",
                          display: "inline-block",
                        }}
                        className="animate-spin"
                      />
                    ) : (
                      <MagnifyingGlassIcon style={{ width: 15, height: 15 }} />
                    )}
                    {loading ? "Searching" : "Search"}
                  </button>
                </div>
              </div>

              {/* Mobile stacked */}
              <div
                className="flex sm:hidden flex-col"
                style={{
                  background: T.white,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 4px 24px rgba(0,0,0,.07)",
                }}
              >
                <div
                  ref={sugRef}
                  style={{
                    position: "relative",
                    padding: "14px 18px",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <Label>Destination</Label>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <MapPinIcon
                      style={{
                        width: 14,
                        height: 14,
                        color: T.gold,
                        flexShrink: 0,
                      }}
                    />
                    <input
                      type="text"
                      value={form.query}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, query: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && doSearch()}
                      placeholder="City, country or style…"
                      autoComplete="off"
                      style={{
                        flex: 1,
                        background: "none",
                        border: "none",
                        outline: "none",
                        color: T.text,
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 80px",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  {[
                    {
                      label: "Check-in",
                      type: "date",
                      key: "checkIn",
                      min: today,
                    },
                    {
                      label: "Check-out",
                      type: "date",
                      key: "checkOut",
                      min: form.checkIn || today,
                    },
                    {
                      label: "Guests",
                      type: "number",
                      key: "guests",
                      min: "1",
                    },
                  ].map(({ label, type, key, min }, i) => (
                    <div
                      key={key}
                      style={{
                        padding: "12px 14px",
                        borderRight: i < 2 ? `1px solid ${T.border}` : "none",
                      }}
                    >
                      <Label>{label}</Label>
                      <input
                        type={type}
                        min={min}
                        value={form[key as keyof SearchState]}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [key]: e.target.value }))
                        }
                        placeholder="Any"
                        style={{
                          background: "none",
                          border: "none",
                          outline: "none",
                          color: T.text,
                          fontSize: 12,
                          width: "100%",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <button
                    onClick={() => doSearch()}
                    disabled={loading}
                    style={{
                      width: "100%",
                      background: T.gold,
                      color: T.white,
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: 14,
                      padding: "13px 0",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <MagnifyingGlassIcon style={{ width: 15, height: 15 }} />
                    {loading ? "Searching…" : "Search Stays"}
                  </button>
                </div>
              </div>

              {/* Quick chips */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 18,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: T.muted,
                    letterSpacing: ".08em",
                  }}
                >
                  Popular:
                </span>
                {["Paris", "Bali", "Maldives", "Safari", "Overwater"].map(
                  (chip) => (
                    <button
                      key={chip}
                      onClick={() => doSearch({ query: chip })}
                      style={{
                        background: T.surface,
                        color: T.sub,
                        border: `1px solid ${T.border}`,
                        fontSize: 12,
                        padding: "5px 14px",
                        borderRadius: 99,
                        cursor: "pointer",
                        transition: "all .18s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          T.goldBorder;
                        (e.currentTarget as HTMLElement).style.color = T.gold;
                        (e.currentTarget as HTMLElement).style.background =
                          T.goldDim;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          T.border;
                        (e.currentTarget as HTMLElement).style.color = T.sub;
                        (e.currentTarget as HTMLElement).style.background =
                          T.surface;
                      }}
                    >
                      {chip}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ── TRUST STRIP ── */}
        <div
          style={{
            borderTop: `1px solid ${T.border}`,
            padding: "22px 52px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            background: T.surface,
          }}
          className="px-5 sm:px-10 md:px-[52px] flex-wrap gap-y-4"
        >
          {[
            { v: "500+", l: "Verified Properties" },
            { v: "4.9★", l: "Average Rating" },
            { v: "24/7", l: "Guest & Host Support" },
            { v: "50+", l: "Countries" },
          ].map(({ v, l }, i) => (
            <div key={l} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && (
                <div
                  style={{
                    width: 1,
                    height: 24,
                    background: T.border,
                    margin: "0 36px",
                  }}
                  className="hidden sm:block"
                />
              )}
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: 22,
                    fontWeight: 600,
                    color: T.text,
                    lineHeight: 1,
                  }}
                >
                  {v}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: T.muted,
                    letterSpacing: ".16em",
                    textTransform: "uppercase",
                    marginTop: 5,
                    fontWeight: 600,
                  }}
                >
                  {l}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </>
  );
};

export default Hero;
