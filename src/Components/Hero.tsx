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

/* ─────────────────────────────────────────────────────────
   Hotel Card — refined dark card
───────────────────────────────────────────────────────── */
const HotelCard = ({
  hotel,
  nights,
  onBook,
  index = 0,
}: {
  hotel: Hotel;
  nights: number;
  onBook?: (hotel: Hotel) => void;
  index?: number;
}) => (
  <div
    style={{
      animation: `fadeUp 0.5s ease ${index * 60}ms both`,
      background: "#1A1814",
      border: "1px solid rgba(245,240,232,0.08)",
      borderRadius: 20,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      transition: "border-color 0.25s, transform 0.25s",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor =
        "rgba(201,169,110,0.35)";
      (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor =
        "rgba(245,240,232,0.08)";
      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
    }}
  >
    <div style={{ position: "relative", height: 210, overflow: "hidden" }}>
      <img
        src={hotel.thumbnail}
        alt={hotel.name}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.6s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
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
            "linear-gradient(to top, rgba(15,14,12,0.7) 0%, transparent 50%)",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          background: "rgba(15,14,12,0.75)",
          backdropFilter: "blur(10px)",
          color: "#C9A96E",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          padding: "5px 12px",
          borderRadius: 99,
          border: "1px solid rgba(201,169,110,0.25)",
        }}
      >
        {hotel.category}
      </span>
      {hotel.featured && (
        <span
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "#C9A96E",
            color: "#0F0E0C",
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "5px 12px",
            borderRadius: 99,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <FireIcon style={{ width: 10, height: 10 }} /> Featured
        </span>
      )}
      {hotel.rating > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 14,
            left: 14,
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "rgba(15,14,12,0.75)",
            backdropFilter: "blur(8px)",
            padding: "5px 10px",
            borderRadius: 99,
          }}
        >
          <StarIcon style={{ width: 11, height: 11, color: "#C9A96E" }} />
          <span style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 700 }}>
            {hotel.rating}
          </span>
          {hotel.reviewCount > 0 && (
            <span style={{ color: "rgba(245,240,232,0.4)", fontSize: 10 }}>
              ({hotel.reviewCount})
            </span>
          )}
        </div>
      )}
    </div>

    <div
      style={{
        padding: "20px 22px 22px",
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}
    >
      <h3
        style={{
          fontFamily: "Cormorant Garamond, serif",
          fontWeight: 600,
          color: "#F5F0E8",
          fontSize: 18,
          lineHeight: 1.2,
          marginBottom: 6,
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
          marginBottom: 12,
        }}
      >
        <MapPinIcon
          style={{ width: 13, height: 13, color: "#C9A96E", flexShrink: 0 }}
        />
        <span
          style={{
            color: "rgba(245,240,232,0.4)",
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
          color: "rgba(245,240,232,0.45)",
          fontSize: 12.5,
          lineHeight: 1.7,
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
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}
      >
        {hotel.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#C9A96E",
              background: "rgba(201,169,110,0.1)",
              border: "1px solid rgba(201,169,110,0.2)",
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
          borderTop: "1px solid rgba(245,240,232,0.07)",
          paddingTop: 14,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#F5F0E8",
              }}
            >
              ₦{hotel.pricePerNight.toLocaleString()}
            </span>
            <span style={{ color: "rgba(245,240,232,0.35)", fontSize: 11 }}>
              / night
            </span>
          </div>
          {nights > 0 && (
            <p
              style={{
                fontSize: 11,
                color: "rgba(245,240,232,0.3)",
                marginTop: 2,
              }}
            >
              ₦{(hotel.pricePerNight * nights).toLocaleString()} · {nights}n
              total
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onBook?.(hotel)}
          style={{
            background: "#C9A96E",
            color: "#0F0E0C",
            fontSize: 12,
            fontWeight: 700,
            padding: "10px 20px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.04em",
            transition: "background 0.2s, transform 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#DFC08A";
            (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#C9A96E";
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
        >
          Reserve
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   Results Panel
───────────────────────────────────────────────────────── */
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
  onBook?: (hotel: Hotel) => void;
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
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    />
    <div
      style={{
        position: "relative",
        zIndex: 10,
        background: "#0F0E0C",
        border: "1px solid rgba(245,240,232,0.1)",
        width: "100%",
        maxHeight: "92dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      className="sm:max-w-2xl md:max-w-4xl lg:max-w-6xl sm:rounded-3xl rounded-t-3xl"
    >
      {/* Header */}
      <div
        style={{
          padding: "22px 28px",
          background: "#141210",
          borderBottom: "1px solid rgba(245,240,232,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
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
            Search Results
          </p>
          <h2
            style={{
              fontFamily: "Cormorant Garamond, serif",
              color: "#F5F0E8",
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
            <p
              style={{
                color: "rgba(245,240,232,0.35)",
                fontSize: 13,
                marginTop: 2,
              }}
            >
              for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "rgba(245,240,232,0.07)",
            border: "1px solid rgba(245,240,232,0.1)",
            color: "#F5F0E8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <XMarkIcon style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Body */}
      <div style={{ overflowY: "auto", flex: 1, padding: "24px 28px 32px" }}>
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: 20,
            }}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  background: "#1A1814",
                  borderRadius: 20,
                  overflow: "hidden",
                  border: "1px solid rgba(245,240,232,0.06)",
                  animation: "pulse 1.4s ease infinite",
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div
                  style={{ height: 210, background: "rgba(245,240,232,0.04)" }}
                />
                <div
                  style={{
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      height: 14,
                      background: "rgba(245,240,232,0.06)",
                      borderRadius: 99,
                      width: "70%",
                    }}
                  />
                  <div
                    style={{
                      height: 10,
                      background: "rgba(245,240,232,0.04)",
                      borderRadius: 99,
                      width: "45%",
                    }}
                  />
                  <div
                    style={{
                      height: 10,
                      background: "rgba(245,240,232,0.04)",
                      borderRadius: 99,
                      width: "90%",
                    }}
                  />
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
              justifyContent: "center",
              padding: "64px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: "rgba(201,169,110,0.08)",
                border: "1px solid rgba(201,169,110,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <MagnifyingGlassIcon
                style={{ width: 28, height: 28, color: "#C9A96E" }}
              />
            </div>
            <h3
              style={{
                fontFamily: "Cormorant Garamond, serif",
                color: "#F5F0E8",
                fontWeight: 600,
                fontSize: 22,
                marginBottom: 8,
              }}
            >
              No stays matched
            </h3>
            <p
              style={{
                color: "rgba(245,240,232,0.35)",
                fontSize: 13,
                maxWidth: 300,
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              Try adjusting your location, dates, or guest count.
            </p>
            <button
              onClick={onClose}
              style={{
                background: "#C9A96E",
                color: "#0F0E0C",
                fontWeight: 700,
                fontSize: 13,
                padding: "12px 28px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
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
              gap: 20,
            }}
          >
            {results.map((hotel, i) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
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

/* ─────────────────────────────────────────────────────────
   HERO
───────────────────────────────────────────────────────── */
const Hero = ({
  onBook,
  onLogin,
  onSignup,
}: {
  onBook?: (hotel: Hotel) => void;
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<Hotel[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

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
      setShowSuggestions(false);
      return;
    }
    getLocationSuggestions(form.query).then((s) => {
      setSuggestions(s);
      setShowSuggestions(s.length > 0);
    });
  }, [form.query]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(e.target as Node)
      )
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setHasSearched(true);
    setSearchResults(null);
    try {
      const params: SearchParams = {
        query: form.query.trim() || undefined,
        checkIn: form.checkIn || undefined,
        checkOut: form.checkOut || undefined,
        guests: form.guests ? parseInt(form.guests) : undefined,
      };
      setSearchResults(await searchHotels(params));
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
      setShowSuggestions(false);
    }
  }, [form]);

  const quickSearch = async (chip: string) => {
    setForm((f) => ({ ...f, query: chip }));
    setHasSearched(true);
    setSearchResults(null);
    setIsSearching(true);
    try {
      setSearchResults(await searchHotels({ query: chip }));
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  /* shared input style */
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#F5F0E8",
    fontSize: 13,
    fontWeight: 500,
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7) sepia(1) saturate(0.5) hue-rotate(5deg); cursor:pointer; opacity:0.5; }
        input::placeholder { color: rgba(245,240,232,0.25) !important; }
        input[type="date"] { color-scheme: dark; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,169,110,0.25); border-radius:99px; }
        .field-wrap:focus-within { border-color: rgba(201,169,110,0.5) !important; }
      `}</style>

      {hasSearched && (
        <ResultsPanel
          results={searchResults ?? []}
          nights={nights}
          query={form.query}
          loading={isSearching}
          onClose={() => {
            setSearchResults(null);
            setHasSearched(false);
          }}
          onBook={onBook}
        />
      )}

      <section
        style={{
          background: "#0F0E0C",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
        }}
      >
        {/* ── NAV ── */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 48px",
            height: 72,
            borderBottom: "1px solid rgba(245,240,232,0.07)",
          }}
          className="px-5 sm:px-8 md:px-12"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <img src={logo} alt="LuxStay" style={{ width: 36, height: 36 }} />
            <span
              style={{
                fontFamily: "Cormorant Garamond, serif",
                color: "#F5F0E8",
                fontSize: 19,
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              LuxStay
            </span>
          </div>

          {/* Desktop nav */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 32 }}
            className="hidden md:flex"
          >
            {["Explore", "For Hosts", "About"].map((label) => (
              <a
                key={label}
                href="#"
                style={{
                  color: "rgba(245,240,232,0.5)",
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                  letterSpacing: "0.01em",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A96E")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(245,240,232,0.5)")
                }
              >
                {label}
              </a>
            ))}
            <div
              style={{
                width: 1,
                height: 18,
                background: "rgba(245,240,232,0.1)",
              }}
            />
            <button
              type="button"
              onClick={onLogin}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(245,240,232,0.55)",
                fontSize: 13,
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F0E8")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(245,240,232,0.55)")
              }
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onSignup}
              style={{
                background: "#C9A96E",
                color: "#0F0E0C",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                padding: "9px 22px",
                borderRadius: 99,
                letterSpacing: "0.03em",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#DFC08A")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#C9A96E")
              }
            >
              List Your Property
            </button>
          </div>

          {/* Mobile nav */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 10 }}
            className="flex md:hidden"
          >
            <button
              type="button"
              onClick={onLogin}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(245,240,232,0.6)",
                fontSize: 13,
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onSignup}
              style={{
                background: "#C9A96E",
                color: "#0F0E0C",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                padding: "8px 16px",
                borderRadius: 99,
              }}
            >
              Join
            </button>
          </div>
        </nav>

        {/* ── HERO CONTENT ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 24px 80px",
            maxWidth: 1000,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 32,
              animation: "fadeUp 0.5s ease 50ms both",
            }}
          >
            <div
              style={{
                height: 1,
                width: 40,
                background:
                  "linear-gradient(to right, transparent, rgba(201,169,110,0.6))",
              }}
            />
            <p
              style={{
                color: "#C9A96E",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}
            >
              Curated Luxury Properties
            </p>
            <div
              style={{
                height: 1,
                width: 40,
                background:
                  "linear-gradient(to left, transparent, rgba(201,169,110,0.6))",
              }}
            />
          </div>

          {/* Headline — the signature: large serif with restrained color */}
          <h1
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "clamp(42px, 7.5vw, 88px)",
              fontWeight: 500,
              lineHeight: 1.06,
              color: "#F5F0E8",
              textAlign: "center",
              marginBottom: 22,
              letterSpacing: "-0.01em",
              animation: "fadeUp 0.6s ease 100ms both",
            }}
          >
            Where You Stay
            <br />
            <em style={{ fontStyle: "italic", color: "#C9A96E" }}>
              Defines
            </em>{" "}
            the Journey
          </h1>

          <p
            style={{
              color: "rgba(245,240,232,0.45)",
              fontSize: 15,
              maxWidth: 440,
              lineHeight: 1.75,
              textAlign: "center",
              marginBottom: 52,
              animation: "fadeUp 0.6s ease 150ms both",
            }}
          >
            Handpicked estates, villas, and retreats — chosen for guests who
            expect more than a room.
          </p>

          {/* ── SEARCH BAR — Desktop ── */}
          <div
            style={{
              width: "100%",
              animation: "fadeUp 0.6s ease 200ms both",
            }}
          >
            {/* Desktop */}
            <div
              className="hidden sm:grid"
              style={{
                gridTemplateColumns: "1fr 160px 160px 110px auto",
                background: "#141210",
                border: "1px solid rgba(245,240,232,0.1)",
                borderRadius: 18,
                overflow: "visible",
                boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
                position: "relative",
                gap: 0,
              }}
            >
              {/* Location */}
              <div
                ref={suggestionRef}
                className="field-wrap"
                style={{
                  padding: "18px 22px",
                  borderRight: "1px solid rgba(245,240,232,0.08)",
                  position: "relative",
                  borderRadius: "18px 0 0 18px",
                  transition: "background 0.2s",
                }}
                onFocus={() => {}}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    color: "rgba(245,240,232,0.3)",
                    textTransform: "uppercase",
                    marginBottom: 7,
                  }}
                >
                  Destination
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPinIcon
                    style={{
                      width: 14,
                      height: 14,
                      color: "#C9A96E",
                      flexShrink: 0,
                    }}
                  />
                  <input
                    type="text"
                    value={form.query}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, query: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    onFocus={() =>
                      suggestions.length > 0 && setShowSuggestions(true)
                    }
                    placeholder="City, country or style…"
                    autoComplete="off"
                    style={{ ...inputStyle }}
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
                        style={{
                          width: 13,
                          height: 13,
                          color: "rgba(245,240,232,0.3)",
                        }}
                      />
                    </button>
                  )}
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      left: 0,
                      zIndex: 40,
                      background: "#1A1814",
                      border: "1px solid rgba(245,240,232,0.12)",
                      borderRadius: 14,
                      overflow: "hidden",
                      minWidth: 260,
                      boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                    }}
                  >
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setForm((f) => ({ ...f, query: s }));
                          setShowSuggestions(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "rgba(245,240,232,0.7)",
                          background: "none",
                          border: "none",
                          borderBottom: "1px solid rgba(245,240,232,0.06)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          transition: "background 0.15s, color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(201,169,110,0.08)";
                          (e.currentTarget as HTMLElement).style.color =
                            "#F5F0E8";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            "none";
                          (e.currentTarget as HTMLElement).style.color =
                            "rgba(245,240,232,0.7)";
                        }}
                      >
                        <MapPinIcon
                          style={{
                            width: 13,
                            height: 13,
                            color: "#C9A96E",
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
                className="field-wrap"
                style={{
                  padding: "18px 18px",
                  borderRight: "1px solid rgba(245,240,232,0.08)",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    color: "rgba(245,240,232,0.3)",
                    textTransform: "uppercase",
                    marginBottom: 7,
                  }}
                >
                  Check-in
                </label>
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
                  style={{ ...inputStyle, fontSize: 12 }}
                />
              </div>

              {/* Check-out */}
              <div
                className="field-wrap"
                style={{
                  padding: "18px 18px",
                  borderRight: "1px solid rgba(245,240,232,0.08)",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    color: "rgba(245,240,232,0.3)",
                    textTransform: "uppercase",
                    marginBottom: 7,
                  }}
                >
                  Check-out
                  {nights > 0 && (
                    <span
                      style={{
                        color: "#C9A96E",
                        marginLeft: 6,
                        fontWeight: 700,
                        textTransform: "none",
                      }}
                    >
                      {nights}n
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  min={form.checkIn || today}
                  value={form.checkOut}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, checkOut: e.target.value }))
                  }
                  style={{ ...inputStyle, fontSize: 12 }}
                />
              </div>

              {/* Guests */}
              <div
                className="field-wrap"
                style={{
                  padding: "18px 16px",
                  borderRight: "1px solid rgba(245,240,232,0.08)",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    color: "rgba(245,240,232,0.3)",
                    textTransform: "uppercase",
                    marginBottom: 7,
                  }}
                >
                  Guests
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.guests}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, guests: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Any"
                  style={{ ...inputStyle, fontSize: 13 }}
                />
              </div>

              {/* Button */}
              <div
                style={{
                  padding: "10px 10px 10px 0",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  style={{
                    background: "#C9A96E",
                    color: "#0F0E0C",
                    border: "none",
                    cursor: isSearching ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    fontSize: 13,
                    padding: "0 26px",
                    height: "100%",
                    minHeight: 52,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    letterSpacing: "0.04em",
                    transition: "background 0.2s",
                    opacity: isSearching ? 0.75 : 1,
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSearching)
                      (e.currentTarget as HTMLElement).style.background =
                        "#DFC08A";
                  }}
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "#C9A96E")
                  }
                >
                  {isSearching ? (
                    <>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          border: "2px solid rgba(0,0,0,0.2)",
                          borderTopColor: "#0F0E0C",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                          display: "inline-block",
                        }}
                      />{" "}
                      Searching
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon style={{ width: 15, height: 15 }} />{" "}
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile stacked */}
            <div
              className="flex sm:hidden flex-col"
              style={{
                background: "#141210",
                border: "1px solid rgba(245,240,232,0.1)",
                borderRadius: 18,
                overflow: "hidden",
                boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
              }}
            >
              <div
                ref={suggestionRef}
                style={{
                  position: "relative",
                  padding: "16px 18px",
                  borderBottom: "1px solid rgba(245,240,232,0.07)",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    color: "rgba(245,240,232,0.3)",
                    textTransform: "uppercase",
                    marginBottom: 7,
                  }}
                >
                  Destination
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPinIcon
                    style={{
                      width: 14,
                      height: 14,
                      color: "#C9A96E",
                      flexShrink: 0,
                    }}
                  />
                  <input
                    type="text"
                    value={form.query}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, query: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    onFocus={() =>
                      suggestions.length > 0 && setShowSuggestions(true)
                    }
                    placeholder="City, country or style…"
                    autoComplete="off"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 40,
                      background: "#1A1814",
                      border: "1px solid rgba(245,240,232,0.1)",
                      borderRadius: "0 0 14px 14px",
                      overflow: "hidden",
                    }}
                  >
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setForm((f) => ({ ...f, query: s }));
                          setShowSuggestions(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "12px 18px",
                          fontSize: 13,
                          color: "rgba(245,240,232,0.7)",
                          background: "none",
                          border: "none",
                          borderBottom: "1px solid rgba(245,240,232,0.05)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <MapPinIcon
                          style={{
                            width: 13,
                            height: 13,
                            color: "#C9A96E",
                            flexShrink: 0,
                          }}
                        />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  borderBottom: "1px solid rgba(245,240,232,0.07)",
                }}
              >
                {[
                  {
                    label: "Check-in",
                    type: "date",
                    key: "checkIn",
                    min: today,
                    placeholder: "",
                  },
                  {
                    label: "Check-out",
                    type: "date",
                    key: "checkOut",
                    min: form.checkIn || today,
                    placeholder: "",
                  },
                  {
                    label: "Guests",
                    type: "number",
                    key: "guests",
                    min: "1",
                    placeholder: "Any",
                  },
                ].map(({ label, type, key, min, placeholder }, i) => (
                  <div
                    key={key}
                    style={{
                      padding: "14px 14px",
                      borderRight:
                        i < 2 ? "1px solid rgba(245,240,232,0.07)" : "none",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        color: "rgba(245,240,232,0.3)",
                        textTransform: "uppercase",
                        marginBottom: 6,
                      }}
                    >
                      {label}
                    </label>
                    <input
                      type={type}
                      min={min}
                      value={form[key as keyof SearchState]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                      placeholder={placeholder}
                      style={{ ...inputStyle, fontSize: 12 }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ padding: "14px 16px" }}>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  style={{
                    width: "100%",
                    background: "#C9A96E",
                    color: "#0F0E0C",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "14px 0",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {isSearching ? (
                    <>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          border: "2px solid rgba(0,0,0,0.2)",
                          borderTopColor: "#0F0E0C",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                          display: "inline-block",
                        }}
                      />{" "}
                      Searching…
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon style={{ width: 15, height: 15 }} />{" "}
                      Search Luxury Stays
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick chips */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 20,
                justifyContent: "center",
                flexWrap: "wrap",
                animation: "fadeUp 0.6s ease 320ms both",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(245,240,232,0.25)",
                  letterSpacing: "0.1em",
                }}
              >
                Explore
              </span>
              {["Paris", "Bali", "Maldives", "Safari", "Overwater"].map(
                (chip) => (
                  <button
                    key={chip}
                    onClick={() => quickSearch(chip)}
                    style={{
                      background: "rgba(245,240,232,0.05)",
                      color: "rgba(245,240,232,0.55)",
                      border: "1px solid rgba(245,240,232,0.1)",
                      fontSize: 12,
                      padding: "6px 16px",
                      borderRadius: 99,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(201,169,110,0.4)";
                      (e.currentTarget as HTMLElement).style.color = "#C9A96E";
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(201,169,110,0.07)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(245,240,232,0.1)";
                      (e.currentTarget as HTMLElement).style.color =
                        "rgba(245,240,232,0.55)";
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(245,240,232,0.05)";
                    }}
                  >
                    {chip}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* ── TRUST STRIP ── */}
        <div
          style={{
            borderTop: "1px solid rgba(245,240,232,0.07)",
            padding: "24px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {[
            { value: "500+", label: "Curated Properties" },
            { value: "4.9★", label: "Average Rating" },
            { value: "24/7", label: "Concierge Support" },
            { value: "50+", label: "Countries" },
          ].map(({ value, label }, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && (
                <div
                  style={{
                    width: 1,
                    height: 28,
                    background: "rgba(245,240,232,0.08)",
                    margin: "0 32px",
                  }}
                />
              )}
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: 22,
                    fontWeight: 600,
                    color: "#F5F0E8",
                    lineHeight: 1,
                  }}
                >
                  {value}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "rgba(245,240,232,0.3)",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    marginTop: 5,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </section>
    </>
  );
};

export default Hero;
