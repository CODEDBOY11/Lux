import { useState, useRef, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { StarIcon, FireIcon } from "@heroicons/react/24/solid";
import heroBg from "../assets/hero-bg.png";
import {
  searchHotels,
  getLocationSuggestions,
  type Hotel,
  type SearchParams,
} from "../index";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */
type SearchState = {
  query: string;
  checkIn: string;
  checkOut: string;
  guests: string;
};

/* ─────────────────────────────────────────────────────────
   Hotel Card
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
    className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
    style={{ animation: `fadeUp 0.5s ease ${index * 60}ms both` }}
  >
    <div className="relative h-48 sm:h-52 overflow-hidden">
      <img
        src={hotel.thumbnail}
        alt={hotel.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-[#C9A96E] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-[#C9A96E]/30">
        {hotel.category}
      </span>
      {hotel.featured && (
        <span className="absolute top-3 right-3 bg-[#C9A96E] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
          <FireIcon className="w-2.5 h-2.5" /> Featured
        </span>
      )}
      {hotel.rating > 0 && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full">
          <StarIcon className="w-3 h-3 text-[#C9A96E]" />
          <span className="text-white text-xs font-bold">{hotel.rating}</span>
          {hotel.reviewCount > 0 && (
            <span className="text-white/50 text-[10px]">
              ({hotel.reviewCount})
            </span>
          )}
        </div>
      )}
    </div>

    <div className="p-4 sm:p-5 flex flex-col flex-1">
      <h3 className="font-['Cormorant_Garamond'] font-semibold text-gray-900 text-base sm:text-lg leading-tight mb-1 line-clamp-1">
        {hotel.name}
      </h3>
      <div className="flex items-center gap-1 text-gray-400 mb-3">
        <MapPinIcon className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
        <span className="text-xs truncate">{hotel.location}</span>
      </div>
      <p className="text-gray-500 text-xs leading-relaxed mb-3 flex-1 line-clamp-2">
        {hotel.shortDescription}
      </p>
      <div className="flex flex-wrap gap-1 mb-4">
        {hotel.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-medium text-[#C9A96E] bg-[#C9A96E]/10 px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-end justify-between border-t border-gray-100 pt-3">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-gray-900">
              ${hotel.pricePerNight.toLocaleString()}
            </span>
            <span className="text-gray-400 text-xs">/ night</span>
          </div>
          {nights > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              ${(hotel.pricePerNight * nights).toLocaleString()} · {nights}n
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onBook?.(hotel)}
          className="bg-[#C9A96E] hover:bg-[#b8935a] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-[#C9A96E]/30"
        >
          Book Now
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
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6">
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    />
    <div
      className="relative z-10 bg-[#faf9f7] w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      style={{ maxHeight: "92dvh" }}
    >
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 sm:py-5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-['Cormorant_Garamond'] text-gray-900 font-semibold text-lg sm:text-xl">
            {loading
              ? "Searching…"
              : results.length > 0
                ? `${results.length} stay${results.length !== 1 ? "s" : ""} found`
                : "No results found"}
          </h2>
          {query && (
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
        >
          <XMarkIcon className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 p-4 sm:p-5 md:p-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="h-48 bg-gray-100" />
                <div className="p-5 space-y-2.5">
                  <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                  <div className="h-3 bg-gray-100 rounded-full w-full" />
                  <div className="h-3 bg-gray-100 rounded-full w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
            <div className="w-16 h-16 bg-[#C9A96E]/10 border border-[#C9A96E]/20 rounded-2xl flex items-center justify-center mb-5">
              <MagnifyingGlassIcon className="w-7 h-7 text-[#C9A96E]" />
            </div>
            <h3 className="font-['Cormorant_Garamond'] text-gray-700 font-semibold text-xl mb-2">
              No stays matched your search
            </h3>
            <p className="text-gray-400 text-sm max-w-xs mb-6">
              Try adjusting your location, dates, or guest count for more
              results.
            </p>
            <button
              onClick={onClose}
              className="bg-[#C9A96E] text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[#b8935a] transition-all"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
  const [featuredHotels, setFeaturedHotels] = useState<Hotel[]>([]);
  const [] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const nights = (() => {
    if (!form.checkIn || !form.checkOut) return 0;
    const diff =
      new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime();
    return Math.max(0, Math.round(diff / 86400000));
  })();

  /* Load featured hotels from DB on mount */
  useEffect(() => {
    searchHotels({ query: "" })
      .then((hotels) =>
        setFeaturedHotels(hotels.filter((h) => h.featured).slice(0, 3)),
      )
      .catch(console.error);
  }, []);

  /* Auto-suggest */
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

  /* Close suggestions on outside click */
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
    setSearchResults(null); // show loading skeletons
    try {
      const params: SearchParams = {
        query: form.query.trim() || undefined,
        checkIn: form.checkIn || undefined,
        checkOut: form.checkOut || undefined,
        guests: form.guests ? parseInt(form.guests) : undefined,
      };
      const results = await searchHotels(params);
      setSearchResults(results);
    } catch (e) {
      console.error("Search failed:", e);
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
      const results = await searchHotels({ query: chip });
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes shimmer { from { background-position:-400px 0; } to { background-position:400px 0; } }
        .search-field:focus-within { border-color: rgba(201,169,110,0.6) !important; }
      `}</style>

      {/* Results overlay */}
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

      <section className="relative min-h-screen w-full font-sans overflow-hidden">
        {/* Background */}
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/70" />
        {/* Subtle gold radial glow */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(201,169,110,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* ── NAV ── */}
          <nav className="flex items-center justify-between px-5 sm:px-8 md:px-12 lg:px-16 py-5 sm:py-6">
            {/* Logo */}
            <div className="flex items-center gap-2 select-none cursor-pointer">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#C9A96E] rotate-45 rounded-sm" />
              <span className="font-['Cormorant_Garamond'] text-white text-lg sm:text-xl tracking-wide font-semibold">
                LuxStay
              </span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8 text-sm">
              <a
                href="#"
                className="text-white/70 hover:text-[#C9A96E] transition-colors font-medium"
              >
                Explore
              </a>
              <button
                type="button"
                onClick={onLogin}
                className="text-white/70 hover:text-[#C9A96E] transition-colors font-medium"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onSignup}
                className="bg-[#C9A96E] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#b8935a] hover:scale-105 transition-all shadow-lg shadow-[#C9A96E]/30 text-sm"
              >
                Get Started
              </button>
            </div>

            {/* Mobile nav */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={onLogin}
                className="text-white/70 text-sm font-medium px-3 py-1.5"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onSignup}
                className="bg-[#C9A96E] text-white px-4 py-2 rounded-full text-sm font-semibold"
              >
                Join
              </button>
            </div>
          </nav>

          {/* ── HERO CONTENT ── */}
          <div
            className="flex flex-col items-center justify-center text-center flex-1 px-4 sm:px-6 md:px-8 pb-8 pt-4 sm:pt-0"
            style={{ animation: "fadeUp 0.6s ease both" }}
          >
            {/* Eyebrow */}
            <div
              className="flex items-center gap-2 mb-4 sm:mb-5"
              style={{ animation: "fadeUp 0.5s ease 50ms both" }}
            >
              <div className="h-px w-8 bg-[#C9A96E]/60" />
              <p className="text-[#C9A96E] text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase">
                Curated Luxury Escapes
              </p>
              <div className="h-px w-8 bg-[#C9A96E]/60" />
            </div>

            {/* Headline */}
            <h1
              className="text-white font-['Cormorant_Garamond'] leading-[1.05] mb-4 sm:mb-5"
              style={{
                fontSize: "clamp(38px, 7vw, 84px)",
                animation: "fadeUp 0.6s ease 100ms both",
              }}
            >
              Find Your <em className="not-italic text-[#C9A96E]">Perfect</em>
              <br className="hidden sm:block" /> Stay
            </h1>

            <p
              className="text-white/65 text-sm sm:text-base max-w-sm sm:max-w-md leading-relaxed mb-8 sm:mb-10"
              style={{ animation: "fadeUp 0.6s ease 150ms both" }}
            >
              Handpicked luxury properties designed for those who demand
              comfort, elegance, and the extraordinary.
            </p>

            {/* ── SEARCH BAR ── */}
            <div
              className="w-full max-w-xs sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl"
              style={{ animation: "fadeUp 0.6s ease 200ms both" }}
            >
              {/* Desktop: single row */}
              <div className="hidden sm:flex bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/30 border border-white/20 overflow-visible">
                {/* Location */}
                <div
                  ref={suggestionRef}
                  className="relative flex-[2] px-5 py-4 border-r border-gray-100 search-field"
                >
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-1.5">
                    Where to?
                  </label>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-[#C9A96E] shrink-0" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={form.query}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, query: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      onFocus={() =>
                        suggestions.length > 0 && setShowSuggestions(true)
                      }
                      placeholder="City, country, or style…"
                      className="w-full text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
                      autoComplete="off"
                    />
                    {form.query && (
                      <button
                        onClick={() => setForm((f) => ({ ...f, query: "" }))}
                      >
                        <XMarkIcon className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500" />
                      </button>
                    )}
                  </div>
                  {/* Suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-30">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setForm((f) => ({ ...f, query: s }));
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-[#C9A96E]/08 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <MapPinIcon className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Check-in */}
                <div className="flex-1 px-4 py-4 border-r border-gray-100 search-field">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-1.5 items-center gap-1">
                    <CalendarDaysIcon className="w-3 h-3" /> Check-in
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
                    className="w-full text-sm font-medium text-gray-800 outline-none bg-transparent cursor-pointer"
                  />
                </div>

                {/* Check-out */}
                <div className="flex-1 px-4 py-4 border-r border-gray-100 search-field">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-1.5 items-center gap-1">
                    <CalendarDaysIcon className="w-3 h-3" />
                    Check-out
                    {nights > 0 && (
                      <span className="text-[#C9A96E] ml-1 normal-case font-semibold">
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
                    className="w-full text-sm font-medium text-gray-800 outline-none bg-transparent cursor-pointer"
                  />
                </div>

                {/* Guests */}
                <div className="w-28 px-4 py-4 border-r border-gray-100 search-field">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-1.5 items-center gap-1">
                    <UserGroupIcon className="w-3 h-3" /> Guests
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
                    className="w-full text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
                  />
                </div>

                {/* Search button */}
                <div className="px-3 py-3 flex items-center">
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-[#C9A96E] disabled:opacity-70 text-white px-5 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#b8935a] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#C9A96E]/40 whitespace-nowrap"
                  >
                    {isSearching ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <MagnifyingGlassIcon className="w-4 h-4" />
                    )}
                    {isSearching ? "Searching…" : "Search"}
                  </button>
                </div>
              </div>

              {/* Mobile: stacked card */}
              <div className="sm:hidden bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/30 border border-white/20 overflow-hidden">
                {/* Location row */}
                <div
                  ref={suggestionRef}
                  className="relative px-4 pt-4 pb-3 border-b border-gray-100"
                >
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Where to?
                  </label>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-[#C9A96E] shrink-0" />
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
                      placeholder="City, country, or style…"
                      className="flex-1 text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
                      autoComplete="off"
                    />
                    {form.query && (
                      <button
                        onClick={() => setForm((f) => ({ ...f, query: "" }))}
                      >
                        <XMarkIcon className="w-4 h-4 text-gray-300" />
                      </button>
                    )}
                  </div>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-30">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setForm((f) => ({ ...f, query: s }));
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-[#C9A96E]/08 flex items-center gap-3 border-b border-gray-50 last:border-0"
                        >
                          <MapPinIcon className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date + Guests row */}
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  <div className="px-3 py-3">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
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
                      className="w-full text-xs font-medium text-gray-800 outline-none bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="px-3 py-3">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Check-out
                      {nights > 0 && (
                        <span className="text-[#C9A96E] ml-1">·{nights}n</span>
                      )}
                    </label>
                    <input
                      type="date"
                      min={form.checkIn || today}
                      value={form.checkOut}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, checkOut: e.target.value }))
                      }
                      className="w-full text-xs font-medium text-gray-800 outline-none bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="px-3 py-3">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
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
                      placeholder="Any"
                      className="w-full text-xs font-medium text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Search button */}
                <div className="px-4 pb-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="w-full bg-[#C9A96E] disabled:opacity-70 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#b8935a] active:scale-95 transition-all shadow-lg shadow-[#C9A96E]/30"
                  >
                    {isSearching ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <MagnifyingGlassIcon className="w-4 h-4" />
                    )}
                    {isSearching ? "Searching…" : "Search Luxury Stays"}
                  </button>
                </div>
              </div>

              {/* Quick chips */}
              <div
                className="flex items-center gap-2 mt-4 justify-center flex-wrap"
                style={{ animation: "fadeUp 0.6s ease 300ms both" }}
              >
                {["Paris", "Bali", "Maldives", "Safari", "Overwater"].map(
                  (chip) => (
                    <button
                      key={chip}
                      onClick={() => quickSearch(chip)}
                      className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs px-3.5 py-1.5 rounded-full border border-white/20 transition-all backdrop-blur-sm hover:border-[#C9A96E]/50"
                    >
                      {chip}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* ── FEATURED PROPERTIES (loaded from DB) ── */}
            {featuredHotels.length > 0 && (
              <div
                className="w-full max-w-xs sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mt-10 sm:mt-12"
                style={{ animation: "fadeUp 0.6s ease 400ms both" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-[#C9A96E]" />
                    <p className="text-white/80 text-xs sm:text-sm font-semibold tracking-wide">
                      Featured Properties
                    </p>
                  </div>
                  <button
                    onClick={() => quickSearch("")}
                    className="text-[#C9A96E] text-xs font-semibold hover:underline"
                  >
                    View all →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {featuredHotels.map((hotel, i) => (
                    <button
                      key={hotel.id}
                      onClick={() => onBook?.(hotel)}
                      className="group relative rounded-xl overflow-hidden text-left bg-black/30 backdrop-blur-sm border border-white/10 hover:border-[#C9A96E]/40 transition-all"
                      style={{
                        animation: `fadeUp 0.5s ease ${500 + i * 80}ms both`,
                      }}
                    >
                      <div className="relative h-32 sm:h-36 overflow-hidden">
                        <img
                          src={hotel.thumbnail}
                          alt={hotel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="font-['Cormorant_Garamond'] text-white font-semibold text-sm sm:text-base leading-tight line-clamp-1">
                            {hotel.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3 text-[#C9A96E]" />
                              <span className="text-white/60 text-[10px] truncate max-w-[100px]">
                                {hotel.city}
                              </span>
                            </div>
                            <span className="text-[#C9A96E] text-xs font-bold">
                              ${hotel.pricePerNight.toLocaleString()}
                              <span className="text-white/40 font-normal">
                                /n
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── BOTTOM STATS ── */}
          <div
            className="flex items-center justify-center gap-6 sm:gap-10 md:gap-16 pb-6 sm:pb-8 pt-4 text-white/50 text-xs px-4"
            style={{ animation: "fadeUp 0.6s ease 500ms both" }}
          >
            {[
              { value: "500+", label: "Properties" },
              { value: "4.9★", label: "Avg Rating" },
              { value: "24/7", label: "Concierge" },
              { value: "50+", label: "Countries" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-white font-semibold text-sm sm:text-base">
                  {value}
                </span>
                <span className="text-[10px] sm:text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
