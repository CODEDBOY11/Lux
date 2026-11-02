import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  Bars3Icon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid, FireIcon } from "@heroicons/react/24/solid";
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

/* ─── Design tokens ──────────────────────────────────── */
const T = {
  white: "#FFFFFF",
  surface: "#F8F7F4",
  border: "#E8E4DD",
  text: "#1A1714",
  sub: "#6A6359",
  muted: "#8A8278",
  gold: "#C9A96E",
  goldDim: "rgba(201,169,110,0.10)",
  goldBorder: "rgba(201,169,110,0.25)",
  goldHover: "#B8935A",
  danger: "#B3463F",
  dangerDim: "rgba(179,70,63,0.08)",
};

/* ─── Hotel Card ─────────────────────────────────────── */
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
        borderRadius: 12,
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
      <div style={{ position: "relative", height: 190, overflow: "hidden", flexShrink: 0 }}>
        <img
          src={hotel.thumbnail}
          alt={hotel.name}
          loading="lazy"
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transition: "transform .6s",
            transform: hov ? "scale(1.04)" : "scale(1)",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400";
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(26,24,20,.5) 0%, transparent 55%)",
        }} />
        <span style={{
          position: "absolute", top: 10, left: 10,
          background: "rgba(255,255,255,.92)", backdropFilter: "blur(8px)",
          color: T.text, fontSize: 9, fontWeight: 700,
          letterSpacing: ".18em", textTransform: "uppercase",
          padding: "3px 10px", borderRadius: 99, border: `1px solid ${T.border}`,
        }}>
          {hotel.category}
        </span>
        {hotel.featured && (
          <span style={{
            position: "absolute", top: 10, right: 10,
            background: T.gold, color: T.white,
            fontSize: 9, fontWeight: 800, letterSpacing: ".14em",
            textTransform: "uppercase", padding: "3px 10px", borderRadius: 99,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <FireIcon style={{ width: 9, height: 9 }} /> Featured
          </span>
        )}
        {hotel.rating > 0 ? (
          <div style={{
            position: "absolute", bottom: 10, left: 10,
            display: "flex", alignItems: "center", gap: 4,
            background: "rgba(255,255,255,.9)", backdropFilter: "blur(8px)",
            padding: "3px 9px", borderRadius: 99, border: `1px solid ${T.border}`,
          }}>
            <StarSolid style={{ width: 10, height: 10, color: T.gold }} />
            <span style={{ color: T.text, fontSize: 11, fontWeight: 700 }}>{hotel.rating}</span>
            {hotel.reviewCount > 0 && (
              <span style={{ color: T.muted, fontSize: 10 }}>({hotel.reviewCount})</span>
            )}
          </div>
        ) : (
          <div style={{
            position: "absolute", bottom: 10, left: 10,
            background: "rgba(255,255,255,.9)", backdropFilter: "blur(8px)",
            padding: "3px 9px", borderRadius: 99, border: `1px solid ${T.border}`,
          }}>
            <span style={{ color: T.muted, fontSize: 10, fontWeight: 600 }}>New listing</span>
          </div>
        )}
      </div>

      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3 style={{
          fontFamily: "Cormorant Garamond, serif", fontWeight: 600,
          color: T.text, fontSize: 17, lineHeight: 1.25, marginBottom: 4,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {hotel.name}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
          <MapPinIcon style={{ width: 11, height: 11, color: T.gold, flexShrink: 0 }} />
          <span style={{ color: T.muted, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {hotel.location}
          </span>
        </div>
        <p style={{
          color: T.sub, fontSize: 12, lineHeight: 1.65, marginBottom: 14, flex: 1,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {hotel.shortDescription}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
          {hotel.tags.slice(0, 3).map((tag) => (
            <span key={tag} style={{
              fontSize: 9, fontWeight: 600, color: T.gold,
              background: T.goldDim, border: `1px solid ${T.goldBorder}`,
              padding: "2px 9px", borderRadius: 99,
            }}>{tag}</span>
          ))}
        </div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: `1px solid ${T.border}`, paddingTop: 12, gap: 10,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{
                fontFamily: "Cormorant Garamond, serif", fontSize: 21,
                fontWeight: 700, color: T.text,
              }}>₦{hotel.pricePerNight.toLocaleString()}</span>
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
            aria-label={`Reserve ${hotel.name}`}
            style={{
              background: T.gold, color: T.white, border: "none",
              cursor: "pointer", fontSize: 12, fontWeight: 700,
              padding: "9px 18px", borderRadius: 8, letterSpacing: ".03em",
              transition: "background .18s, transform .15s",
              boxShadow: "0 4px 14px rgba(201,169,110,.3)", flexShrink: 0,
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
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Results Panel ──────────────────────────────────── */
const ResultsPanel = ({
  results, nights, query, loading, error, onClose, onBook, onRetry,
}: {
  results: Hotel[]; nights: number; query: string;
  loading: boolean; error: boolean;
  onClose: () => void; onBook?: (h: Hotel) => void; onRetry: () => void;
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Search results" style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(26,24,20,.55)", backdropFilter: "blur(6px)",
      }} onClick={onClose} />
      <div ref={panelRef} tabIndex={-1} style={{
        position: "relative", zIndex: 10, background: T.surface,
        border: `1px solid ${T.border}`, width: "100%",
        maxHeight: "92dvh", display: "flex", flexDirection: "column",
        overflow: "hidden", borderRadius: "18px 18px 0 0", outline: "none",
      }} className="sm:max-w-2xl md:max-w-4xl lg:max-w-6xl sm:mb-4 sm:rounded-2xl">
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: T.border }} />
        </div>
        <div style={{
          padding: "12px 16px 16px", background: T.white,
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: ".22em",
              color: error ? T.danger : T.gold,
              textTransform: "uppercase", marginBottom: 3,
            }}>
              {error ? "Something went wrong" : "Results"}
            </p>
            <h2 style={{
              fontFamily: "Cormorant Garamond, serif", color: T.text,
              fontWeight: 600, fontSize: "clamp(17px, 4vw, 20px)",
            }}>
              {loading ? "Searching…" : error ? "Couldn't load results"
                : results.length > 0 ? `${results.length} propert${results.length !== 1 ? "ies" : "y"} found`
                : "No properties matched"}
            </h2>
            {query && !error && (
              <p style={{
                color: T.muted, fontSize: 12, marginTop: 2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>for "{query}"</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close search results" style={{
            width: 36, height: 36, borderRadius: "50%",
            background: T.surface, border: `1px solid ${T.border}`,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
          }}>
            <XMarkIcon style={{ width: 15, height: 15, color: T.sub }} />
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 16px 32px" }} aria-live="polite">
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{
                  background: T.white, borderRadius: 12,
                  overflow: "hidden", border: `1px solid ${T.border}`,
                  animationDelay: `${i * 70}ms`,
                }} className="animate-pulse">
                  <div style={{ height: 190, background: T.surface }} />
                  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                    {[70, 45, 90].map((w) => (
                      <div key={w} style={{ height: 11, background: T.surface, borderRadius: 99, width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, background: T.dangerDim,
                border: `1px solid rgba(179,70,63,0.25)`,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <ExclamationTriangleIcon style={{ width: 24, height: 24, color: T.danger }} />
              </div>
              <h3 style={{ fontFamily: "Cormorant Garamond, serif", color: T.text, fontWeight: 600, fontSize: 20, marginBottom: 8 }}>
                Search didn't go through
              </h3>
              <p style={{ color: T.sub, fontSize: 13, maxWidth: 280, lineHeight: 1.7, marginBottom: 20 }}>
                That's on us, not your search. Check your connection and try again.
              </p>
              <button onClick={onRetry} style={{
                background: T.gold, color: T.white, border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 13, padding: "12px 28px", borderRadius: 9,
              }}>Try Again</button>
            </div>
          ) : results.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, background: T.goldDim,
                border: `1px solid ${T.goldBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <MagnifyingGlassIcon style={{ width: 24, height: 24, color: T.gold }} />
              </div>
              <h3 style={{ fontFamily: "Cormorant Garamond, serif", color: T.text, fontWeight: 600, fontSize: 20, marginBottom: 8 }}>
                No stays matched
              </h3>
              <p style={{ color: T.sub, fontSize: 13, maxWidth: 280, lineHeight: 1.7, marginBottom: 20 }}>
                Try a different destination, adjust your dates, or change the guest count.
              </p>
              <button onClick={onClose} style={{
                background: T.gold, color: T.white, border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 13, padding: "12px 28px", borderRadius: 9,
              }}>Clear Search</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {results.map((h, i) => (
                <HotelCard key={h.id} hotel={h} nights={nights} onBook={onBook} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Hero ───────────────────────────────────────────── */
export default function Hero({
  onBook, onLogin, onSignup,
}: {
  onBook?: (h: Hotel) => void;
  onLogin?: () => void;
  onSignup?: () => void;
}) {
  const [form, setForm] = useState<SearchState>({ query: "", checkIn: "", checkOut: "", guests: "" });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [activeSugIndex, setActiveSugIndex] = useState(-1);
  const [results, setResults] = useState<Hotel[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [audience, setAudience] = useState<"guest" | "host">("guest");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [lastParams, setLastParams] = useState<Partial<SearchParams>>({});

  const sugRef = useRef<HTMLDivElement>(null);
  const queryInputRef = useRef<HTMLInputElement>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchSeqRef = useRef(0);

  const nights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 0;
    return Math.max(0, Math.round(
      (new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000,
    ));
  }, [form.checkIn, form.checkOut]);

  useEffect(() => {
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    if (form.query.length < 1) { setSuggestions([]); setShowSug(false); setActiveSugIndex(-1); return; }
    suggestDebounceRef.current = setTimeout(() => {
      getLocationSuggestions(form.query).then((s) => {
        setSuggestions(s); setShowSug(s.length > 0); setActiveSugIndex(-1);
      });
    }, 250);
    return () => { if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current); };
  }, [form.query]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (sugRef.current && !sugRef.current.contains(e.target as Node)) setShowSug(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileNavOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const runSearch = useCallback(async (params: Partial<SearchParams>) => {
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    const seq = ++searchSeqRef.current;
    setLoading(true); setSearched(true); setSearchError(false); setResults(null); setLastParams(params);
    try {
      const data = await searchHotels({ ...params, signal: controller.signal } as SearchParams);
      if (seq !== searchSeqRef.current) return;
      setResults(data);
    } catch (err) {
      if (seq !== searchSeqRef.current) return;
      if ((err as { name?: string })?.name === "AbortError") return;
      setSearchError(true); setResults([]);
    } finally {
      if (seq === searchSeqRef.current) { setLoading(false); setShowSug(false); }
    }
  }, []);

  const doSearch = useCallback((override?: Partial<SearchParams> & { displayQuery?: string }) => {
    const { displayQuery, ...overrideParams } = override ?? {};
    if (displayQuery !== undefined) setForm((f) => ({ ...f, query: displayQuery }));
    const params: Partial<SearchParams> = {
      query: (overrideParams.query ?? form.query)?.trim() || undefined,
      checkIn: form.checkIn || undefined, checkOut: form.checkOut || undefined,
      guests: form.guests ? parseInt(form.guests, 10) : undefined, ...overrideParams,
    };
    runSearch(params);
  }, [form, runSearch]);

  const handleChipClick = (chip: string) => { doSearch({ query: chip, displayQuery: chip }); };
  const handleSugSelect = (s: string) => { setForm((f) => ({ ...f, query: s })); setShowSug(false); setActiveSugIndex(-1); };

  const handleQueryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSug || suggestions.length === 0) {
      if (e.key === "Enter") doSearch();
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveSugIndex((i) => (i + 1) % suggestions.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveSugIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSugIndex >= 0) {
        const picked = suggestions[activeSugIndex];
        setForm((f) => ({ ...f, query: picked }));
        setShowSug(false); setActiveSugIndex(-1);
        doSearch({ query: picked });
      } else { setShowSug(false); doSearch(); }
    } else if (e.key === "Escape") { setShowSug(false); setActiveSugIndex(-1); }
  };

  const handleGuestsChange = (raw: string) => {
    if (raw === "") { setForm((f) => ({ ...f, guests: "" })); return; }
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    setForm((f) => ({ ...f, guests: String(Math.min(20, Math.max(1, n))) }));
  };

  const today = new Date().toISOString().split("T")[0];

  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <p style={{
      fontSize: 9, fontWeight: 700, letterSpacing: ".2em",
      color: T.muted, textTransform: "uppercase", marginBottom: 5, lineHeight: 1,
    }}>{children}</p>
  );

  const copy = audience === "guest" ? {
    eyebrow: "Nigeria's finest stays",
    headline: (<>Every Stay,<br /><em style={{ fontStyle: "italic", color: T.gold }}>Verified</em> for You</>),
    sub: "Shortlets and hotels across Lagos, Abuja, Port Harcourt — every property checked, every price in Naira.",
    cta: "Explore Stays",
  } : {
    eyebrow: "For Property Owners",
    headline: (<>Your Property,<br /><em style={{ fontStyle: "italic", color: T.gold }}>Properly</em> Presented</>),
    sub: "Join Nigeria's fastest-growing short-let platform. Get verified, get booked, get paid — directly to your bank.",
    cta: "List a Property",
  };

  // Trust badges
  const trustBadges = [
    { label: "Naira pricing", sub: "No FX surprises", icon: "₦" },
    { label: "Verified stays", sub: "Photos checked", icon: "✓" },
    { label: "Paystack secure", sub: "Trusted payments", icon: "🔒" },
    { label: "24/7 support", sub: "Real people", icon: "☎" },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { -webkit-font-smoothing: antialiased; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: .4; cursor: pointer; }
        input::placeholder { color: ${T.muted} !important; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
        .lux-field:focus-within { border-color: ${T.gold} !important; }
        a, button, input { -webkit-tap-highlight-color: transparent; }
        button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid ${T.gold}; outline-offset: 2px; }
        .nav-link { color: ${T.sub}; font-size: 13px; font-weight: 500; text-decoration: none; transition: color .18s; background: none; border: none; cursor: pointer; }
        .nav-link:hover { color: ${T.text}; }
        .chip-btn { background: ${T.surface}; color: ${T.sub}; border: 1px solid ${T.border}; font-size: 12px; padding: 6px 14px; border-radius: 99px; cursor: pointer; transition: all .18s; white-space: nowrap; font-family: inherit; }
        .chip-btn:hover { border-color: ${T.goldBorder}; color: ${T.gold}; background: ${T.goldDim}; }
        .audience-btn { border-radius: 99px; padding: 8px 20px; font-size: 12px; font-weight: 600; cursor: pointer; letter-spacing: .02em; transition: background .2s, color .2s, border-color .2s, box-shadow .2s; font-family: inherit; white-space: nowrap; }
        .gold-btn { background: ${T.gold}; color: #fff; border: none; cursor: pointer; font-weight: 700; letter-spacing: .03em; transition: background .18s; font-family: inherit; display: flex; align-items: center; gap: 7px; box-shadow: 0 4px 16px rgba(201,169,110,.35); }
        .gold-btn:hover { background: ${T.goldHover}; }
        .gold-btn:disabled { opacity: .7; cursor: not-allowed; }
        .desktop-nav-links { display: none; }
        .nav-auth-desktop { display: none; }
        .nav-burger { display: flex; }
        .nav-list-link { color: ${T.sub}; font-size: 13px; font-weight: 500; text-decoration: none; background: none; border: none; cursor: pointer; font-family: inherit; padding: 14px 4px; text-align: left; border-bottom: 1px solid ${T.border}; width: 100%; }
        @media (min-width: 768px) { .desktop-nav-links { display: flex; } .nav-auth-desktop { display: flex; } .nav-burger { display: none; } }
        .search-date-guest-row { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; }
        .search-date-guest-row .field-checkin { border-right: 1px solid ${T.border}; border-bottom: 1px solid ${T.border}; }
        .search-date-guest-row .field-checkout { border-bottom: 1px solid ${T.border}; }
        .search-date-guest-row .field-guests { grid-column: 1 / -1; }
        @media (min-width: 480px) {
          .search-date-guest-row { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: auto; }
          .search-date-guest-row .field-checkin { border-bottom: none; }
          .search-date-guest-row .field-checkout { border-right: 1px solid ${T.border}; border-bottom: none; }
          .search-date-guest-row .field-guests { grid-column: auto; }
        }
        .trust-strip-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; }
        @media (min-width: 480px) { .trust-strip-grid { grid-template-columns: repeat(4, 1fr); } }
        .trust-item { border-right: none; }
        .trust-item:nth-child(odd) { border-right: 1px solid ${T.border}; }
        @media (min-width: 480px) { .trust-item:nth-child(odd) { border-right: none; } .trust-item:not(:last-child) { border-right: 1px solid ${T.border}; } }
        .verified-badge { display: inline-flex; align-items: center; gap: 5px; background: rgba(34,120,70,0.08); border: 1px solid rgba(34,120,70,0.2); color: #1a7040; border-radius: 99px; padding: 4px 10px; font-size: 10px; font-weight: 600; }
      `}</style>

      {searched && (
        <ResultsPanel
          results={results ?? []} nights={nights} query={form.query}
          loading={loading} error={searchError}
          onClose={() => { searchAbortRef.current?.abort(); setResults(null); setSearched(false); setSearchError(false); }}
          onBook={onBook}
          onRetry={() => runSearch(lastParams)}
        />
      )}

      <div style={{ background: T.white, minHeight: "100dvh", display: "flex", flexDirection: "column", fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
        {/* ── NAV ── */}
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", height: 68,
          borderBottom: `1px solid ${T.border}`,
          position: "sticky", top: 0,
          background: "rgba(255,255,255,.97)", backdropFilter: "blur(12px)",
          zIndex: 30, gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}>
            <img src={logo} alt="" style={{ width: 44, height: 44, flexShrink: 0 }} />
            <span style={{
              fontFamily: "Cormorant Garamond, serif", color: T.text,
              fontSize: 22, fontWeight: 700, letterSpacing: "-.01em", whiteSpace: "nowrap",
            }}>EDEN</span>
          </div>

          <div className="desktop-nav-links" style={{ alignItems: "center", gap: 24, flex: 1, justifyContent: "center" }}>
            {["Explore", "How it Works", "For Hosts"].map((l) => (
              <a key={l} href="#" className="nav-link">{l}</a>
            ))}
          </div>

          <div className="nav-auth-desktop" style={{ alignItems: "center", gap: 10, flexShrink: 0 }}>
            {/* Nigerian trust badge */}
            <span className="verified-badge">
              <ShieldCheckIcon style={{ width: 11, height: 11 }} />
              Verified Platform
            </span>
            <button type="button" onClick={onLogin} className="nav-link" style={{ marginLeft: 8 }}>Sign in</button>
            <button
              type="button" onClick={onSignup}
              style={{
                background: T.text, color: T.white, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 99,
                letterSpacing: ".02em", transition: "background .18s", whiteSpace: "nowrap", fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2D2924")}
              onMouseLeave={(e) => (e.currentTarget.style.background = T.text)}
            >List Property</button>
          </div>

          <button
            type="button" className="nav-burger"
            onClick={() => setMobileNavOpen((o) => !o)}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            style={{
              width: 38, height: 38, alignItems: "center", justifyContent: "center",
              background: "none", border: `1px solid ${T.border}`,
              borderRadius: 9, cursor: "pointer", flexShrink: 0,
            }}
          >
            {mobileNavOpen ? <XMarkIcon style={{ width: 18, height: 18, color: T.text }} />
              : <Bars3Icon style={{ width: 18, height: 18, color: T.text }} />}
          </button>
        </nav>

        {mobileNavOpen && (
          <div style={{
            position: "sticky", top: 68, zIndex: 29,
            background: T.white, borderBottom: `1px solid ${T.border}`,
            padding: "4px 16px 12px", display: "flex", flexDirection: "column",
            animation: "slideDown .18s ease both", boxShadow: "0 8px 24px rgba(0,0,0,.06)",
          }} className="md:hidden">
            {["Explore", "How it Works", "For Hosts"].map((l) => (
              <a key={l} href="#" className="nav-list-link" onClick={() => setMobileNavOpen(false)}>{l}</a>
            ))}
            <button type="button" className="nav-list-link" onClick={() => { setMobileNavOpen(false); onLogin?.(); }}>Sign in</button>
            <button type="button" onClick={() => { setMobileNavOpen(false); onSignup?.(); }} style={{
              background: T.text, color: T.white, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, padding: "12px 16px",
              borderRadius: 9, letterSpacing: ".02em", fontFamily: "inherit", marginTop: 10,
            }}>List Property</button>
          </div>
        )}

        {/* ── HERO BODY ── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 16px 44px" }}>
          <div style={{ width: "100%", maxWidth: 860 }}>
            {/* Audience toggle */}
            <div style={{
              display: "inline-flex", alignItems: "center",
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 99, padding: 4, marginBottom: 28,
              animation: "fadeUp .4s ease both", maxWidth: "100%",
            }}>
              {(["guest", "host"] as const).map((a) => (
                <button key={a} className="audience-btn" onClick={() => setAudience(a)} aria-pressed={audience === a} style={{
                  background: audience === a ? T.white : "transparent",
                  color: audience === a ? T.text : T.muted,
                  border: audience === a ? `1px solid ${T.border}` : "1px solid transparent",
                  boxShadow: audience === a ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                }}>
                  {a === "guest" ? "I'm a Guest" : "I'm a Host"}
                </button>
              ))}
            </div>

            {/* Eyebrow */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, animation: "fadeUp .45s ease 40ms both" }}>
              <div style={{ width: 24, height: 1, background: T.gold, flexShrink: 0 }} />
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".28em", color: T.gold, textTransform: "uppercase" }}>
                {copy.eyebrow}
              </p>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "clamp(34px, 9vw, 72px)",
              fontWeight: 500, lineHeight: 1.08, color: T.text,
              marginBottom: 16, letterSpacing: "-.01em",
              animation: "fadeUp .5s ease 80ms both",
            }}>
              {copy.headline}
            </h1>

            <p style={{
              color: T.sub, fontSize: "clamp(13px, 2.2vw, 15px)",
              lineHeight: 1.75, maxWidth: 460, marginBottom: 32,
              animation: "fadeUp .5s ease 120ms both",
            }}>
              {copy.sub}
            </p>

            {/* ── SEARCH PANEL ── */}
            <div style={{ animation: "fadeUp .5s ease 160ms both" }}>
              <div style={{
                background: T.white, border: `1.5px solid ${T.border}`,
                borderRadius: 14,
                boxShadow: "0 4px 24px rgba(0,0,0,.07), 0 1px 3px rgba(0,0,0,.04)",
                overflow: "visible",
              }}>
                {/* Location row */}
                <div ref={sugRef} className="lux-field" style={{
                  padding: "14px 16px", borderBottom: `1px solid ${T.border}`,
                  borderRadius: "12px 12px 0 0", border: `1.5px solid transparent`,
                  transition: "border-color .18s", position: "relative",
                }}>
                  <FieldLabel>Destination</FieldLabel>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <MapPinIcon style={{ width: 15, height: 15, color: T.gold, flexShrink: 0 }} />
                    <input
                      ref={queryInputRef}
                      type="text" role="combobox"
                      aria-expanded={showSug} aria-autocomplete="list"
                      aria-controls="destination-suggestions" aria-label="Destination"
                      value={form.query}
                      onChange={(e) => setForm((f) => ({ ...f, query: e.target.value }))}
                      onKeyDown={handleQueryKeyDown}
                      onFocus={() => suggestions.length > 0 && setShowSug(true)}
                      placeholder="Lagos, Abuja, Port Harcourt…"
                      autoComplete="off"
                      style={{
                        flex: 1, minWidth: 0, background: "none", border: "none",
                        outline: "none", color: T.text, fontSize: 16,
                        fontWeight: 500, fontFamily: "inherit",
                      }}
                    />
                    {form.query && (
                      <button onClick={() => { setForm((f) => ({ ...f, query: "" })); queryInputRef.current?.focus(); }}
                        aria-label="Clear destination" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, flexShrink: 0 }}>
                        <XMarkIcon style={{ width: 14, height: 14, color: T.muted }} />
                      </button>
                    )}
                  </div>

                  {showSug && suggestions.length > 0 && (
                    <div id="destination-suggestions" role="listbox" style={{
                      position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 40,
                      background: T.white, border: `1px solid ${T.border}`,
                      borderRadius: 12, overflow: "hidden",
                      boxShadow: "0 12px 40px rgba(0,0,0,.12)", maxHeight: 260, overflowY: "auto",
                    }}>
                      {suggestions.map((s, i) => (
                        <button key={s} role="option" aria-selected={i === activeSugIndex}
                          onClick={() => handleSugSelect(s)} onMouseEnter={() => setActiveSugIndex(i)}
                          style={{
                            width: "100%", textAlign: "left", padding: "12px 16px", fontSize: 13,
                            color: i === activeSugIndex ? T.text : T.sub,
                            background: i === activeSugIndex ? T.surface : "none",
                            border: "none", borderBottom: `1px solid ${T.border}`,
                            cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                            transition: "background .14s, color .14s", fontFamily: "inherit",
                          }}>
                          <MapPinIcon style={{ width: 13, height: 13, color: T.gold, flexShrink: 0 }} />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dates + Guests */}
                <div className="search-date-guest-row" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <div className="lux-field field-checkin" style={{ padding: "13px 16px", border: `1.5px solid transparent`, transition: "border-color .18s" }}>
                    <FieldLabel>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <CalendarDaysIcon style={{ width: 9, height: 9 }} /> Check-in
                      </span>
                    </FieldLabel>
                    <input type="date" aria-label="Check-in date" min={today} value={form.checkIn}
                      onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value, checkOut: f.checkOut && f.checkOut <= e.target.value ? "" : f.checkOut }))}
                      style={{ background: "none", border: "none", outline: "none", color: form.checkIn ? T.text : T.muted, fontSize: 13, fontWeight: 500, width: "100%", colorScheme: "light", fontFamily: "inherit" }}
                    />
                  </div>
                  <div className="lux-field field-checkout" style={{ padding: "13px 16px", border: `1.5px solid transparent`, transition: "border-color .18s" }}>
                    <FieldLabel>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <CalendarDaysIcon style={{ width: 9, height: 9 }} />
                        Check-out
                        {nights > 0 && <span style={{ color: T.gold, fontWeight: 700, letterSpacing: 0, textTransform: "none" }}>&nbsp;·&nbsp;{nights}n</span>}
                      </span>
                    </FieldLabel>
                    <input type="date" aria-label="Check-out date" min={form.checkIn || today} value={form.checkOut}
                      onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))}
                      style={{ background: "none", border: "none", outline: "none", color: form.checkOut ? T.text : T.muted, fontSize: 13, fontWeight: 500, width: "100%", colorScheme: "light", fontFamily: "inherit" }}
                    />
                  </div>
                  <div className="lux-field field-guests" style={{ padding: "13px 16px", border: `1.5px solid transparent`, transition: "border-color .18s" }}>
                    <FieldLabel>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <UserGroupIcon style={{ width: 9, height: 9 }} /> Guests
                      </span>
                    </FieldLabel>
                    <input type="number" aria-label="Number of guests" min={1} max={20}
                      value={form.guests} onChange={(e) => handleGuestsChange(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && doSearch()}
                      placeholder="Any"
                      style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 16, fontWeight: 500, width: "100%", fontFamily: "inherit" }}
                    />
                  </div>
                </div>

                {/* Search button */}
                <div style={{ padding: "12px 14px" }}>
                  <button onClick={() => doSearch()} disabled={loading} className="gold-btn" style={{ width: "100%", fontSize: 14, fontWeight: 700, padding: "14px 0", borderRadius: 9, justifyContent: "center" }}>
                    {loading ? (
                      <>
                        <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
                        Searching…
                      </>
                    ) : (
                      <>
                        <MagnifyingGlassIcon style={{ width: 16, height: 16 }} />
                        Search Luxury Stays
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick chips — Nigerian cities */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: T.muted, letterSpacing: ".08em", flexShrink: 0 }}>Popular:</span>
                {["Lekki", "Victoria Island", "Ikoyi", "Abuja", "Port Harcourt"].map((chip) => (
                  <button key={chip} className="chip-btn" onClick={() => handleChipClick(chip)}>{chip}</button>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* ── TRUST STRIP ── */}
        <div className="trust-strip-grid" style={{ borderTop: `1px solid ${T.border}`, background: T.surface, padding: "0 0" }}>
          {trustBadges.map(({ label, sub, icon }) => (
            <div key={label} className="trust-item" style={{ textAlign: "center", padding: "18px 12px" }}>
              <p style={{ fontSize: "clamp(16px, 4vw, 20px)", marginBottom: 4, lineHeight: 1 }}>{icon}</p>
              <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(13px, 3vw, 15px)", fontWeight: 600, color: T.text, lineHeight: 1 }}>{label}</p>
              <p style={{ fontSize: "clamp(9px, 2vw, 11px)", color: T.muted, letterSpacing: ".1em", textTransform: "uppercase", marginTop: 3, fontWeight: 500 }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}