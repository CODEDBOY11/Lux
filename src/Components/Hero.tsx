import { useState, useRef, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
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
   Sub-components
───────────────────────────────────────────────────────── */
const HotelCard = ({
  hotel,
  nights,
  onBook,
}: {
  hotel: Hotel;
  nights: number;
  onBook?: (hotel: Hotel) => void;
}) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 flex flex-col group hover:shadow-xl transition-all duration-300">
    <div className="relative h-52 overflow-hidden">
      <img
        src={hotel.thumbnail}
        alt={hotel.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400";
        }}
      />
      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#C9A96E] text-xs font-semibold px-3 py-1 rounded-full capitalize">
        {hotel.category}
      </span>
      {hotel.featured && (
        <span className="absolute top-3 right-3 bg-[#C9A96E] text-white text-xs font-semibold px-3 py-1 rounded-full">
          Featured
        </span>
      )}
    </div>

    <div className="p-5 flex flex-col flex-1">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-gray-900 text-base leading-tight font-playfair">
          {hotel.name}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          <StarIcon className="w-3.5 h-3.5 text-[#C9A96E]" />
          <span className="text-sm font-semibold text-gray-800">
            {hotel.rating}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-gray-400 mb-3">
        <MapPinIcon className="w-3.5 h-3.5" />
        <span className="text-xs">{hotel.location}</span>
      </div>

      <p className="text-gray-500 text-xs leading-relaxed mb-4 flex-1 line-clamp-2">
        {hotel.shortDescription}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
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
          <span className="text-xl font-bold text-gray-900">
            ${hotel.pricePerNight.toLocaleString()}
          </span>
          <span className="text-gray-400 text-xs"> / night</span>
          {nights > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              ${(hotel.pricePerNight * nights).toLocaleString()} total ·{" "}
              {nights} {nights === 1 ? "night" : "nights"}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onBook?.(hotel)}
          className="bg-[#C9A96E] hover:bg-[#b8935a] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Book Now
        </button>
      </div>
    </div>
  </div>
);

const ResultsPanel = ({
  results,
  nights,
  query,
  onClose,
  onBook,
}: {
  results: Hotel[];
  nights: number;
  query: string;
  onClose: () => void;
  onBook?: (hotel: Hotel) => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    />
    <div className="relative z-10 bg-gray-50 w-full md:max-w-5xl md:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-gray-900 font-semibold text-lg font-playfair">
            {results.length > 0
              ? `${results.length} stay${results.length !== 1 ? "s" : ""} found`
              : "No results found"}
          </h2>
          {query && (
            <p className="text-gray-400 text-sm mt-0.5">
              Searching for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <XMarkIcon className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 p-6">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MagnifyingGlassIcon className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-gray-700 font-semibold text-base mb-2">
              No stays matched your search
            </h3>
            <p className="text-gray-400 text-sm max-w-xs">
              Try adjusting your location, dates, or guest count for more
              results.
            </p>
            <button
              onClick={onClose}
              className="mt-6 text-sm font-semibold text-[#C9A96E] hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                nights={nights}
                onBook={onBook}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   Hero Component
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
  const inputRef = useRef<HTMLInputElement>(null);

  /* Calculate nights between check-in and check-out */
  const nights = (() => {
    if (!form.checkIn || !form.checkOut) return 0;
    const diff =
      new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  })();

  /* Auto-suggest on query change */
  useEffect(() => {
    if (form.query.length >= 1) {
      const s = getLocationSuggestions(form.query);
      setSuggestions(s);
      setShowSuggestions(s.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [form.query]);

  /* Close suggestions on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = useCallback(() => {
    setIsSearching(true);
    setTimeout(() => {
      const params: SearchParams = {
        query: form.query.trim() || undefined,
        checkIn: form.checkIn || undefined,
        checkOut: form.checkOut || undefined,
        guests: form.guests ? parseInt(form.guests) : undefined,
      };
      const results = searchHotels(params);
      setSearchResults(results);
      setHasSearched(true);
      setIsSearching(false);
      setShowSuggestions(false);
    }, 350);
  }, [form]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      {/* ── Results overlay ── */}
      {hasSearched && searchResults !== null && (
        <ResultsPanel
          results={searchResults}
          nights={nights}
          query={form.query}
          onClose={() => {
            setSearchResults(null);
            setHasSearched(false);
          }}
          onBook={onBook}
        />
      )}

      {/* ── Hero ── */}
      <section className="relative h-screen w-full font-sans overflow-hidden">
        {/* Background */}
        <img
          src={heroBg}
          alt="Luxury Stay"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/65" />

        <div className="relative z-10 flex flex-col h-full">
          {/* ── Nav ── */}
          <nav className="flex items-center justify-between px-8 md:px-16 py-6 text-white">
            <div className="flex items-center gap-2.5 font-semibold text-lg tracking-wide select-none">
              <div className="w-5 h-5 bg-[#C9A96E] rounded-sm" />
              LuxStay
            </div>

            <div className="hidden md:flex items-center gap-10 text-sm">
              <a
                href="#"
                className="text-white/80 hover:text-[#C9A96E] transition-colors duration-200"
              >
                Explore
              </a>
              <button
                type="button"
                onClick={onLogin}
                className="text-white/80 hover:text-[#C9A96E] transition-colors duration-200"
              >
                Login
              </button>
              <button
                type="button"
                onClick={onSignup}
                className="bg-[#C9A96E] text-white px-5 py-2.5 rounded-full font-medium hover:bg-[#b8935a] hover:scale-105 transition-all duration-200 shadow-lg shadow-[#C9A96E]/30"
              >
                Sign up
              </button>
            </div>

            {/* Mobile CTA */}
            <button
              type="button"
              onClick={onSignup}
              className="md:hidden bg-[#C9A96E] text-white px-4 py-2 rounded-full text-sm font-medium"
            >
              Sign up
            </button>
          </nav>

          {/* ── Hero content ── */}
          <div className="flex flex-col items-center justify-center text-center flex-1 px-4 md:px-6 -mt-8">
            <p className="text-[#C9A96E] text-sm font-medium tracking-[0.2em] uppercase mb-4 opacity-90">
              Curated Luxury Escapes
            </p>

            <h1 className="text-white text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.1] max-w-3xl font-playfair">
              Find Your <em className="not-italic text-[#C9A96E]">Perfect</em>{" "}
              Stay
            </h1>

            <p className="mt-5 mb-12 text-white/70 text-sm md:text-base max-w-md leading-relaxed">
              Handpicked luxury properties designed for those who demand
              comfort, elegance, and the extraordinary.
            </p>

            {/* ── Search bar ── */}
            <div className="w-full max-w-4xl">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/30 border border-white/20 flex flex-col md:flex-row items-stretch md:items-center gap-0">
                {/* Location */}
                <div
                  ref={suggestionRef}
                  className="relative flex-[2] px-5 py-4 border-b md:border-b-0 md:border-r border-gray-100"
                >
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Location
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
                      onKeyDown={handleKeyDown}
                      onFocus={() =>
                        suggestions.length > 0 && setShowSuggestions(true)
                      }
                      placeholder="Where to?"
                      className="w-full text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
                      autoComplete="off"
                    />
                    {form.query && (
                      <button
                        onClick={() => setForm((f) => ({ ...f, query: "" }))}
                        className="text-gray-300 hover:text-gray-500"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setForm((f) => ({ ...f, query: s }));
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-[#C9A96E]/8 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <MapPinIcon className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Check-in */}
                <div className="flex-1 px-5 py-4 border-b md:border-b-0 md:border-r border-gray-100">
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Check-in
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={form.checkIn}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        checkIn: e.target.value,
                        // Clear check-out if it's before new check-in
                        checkOut:
                          f.checkOut && f.checkOut <= e.target.value
                            ? ""
                            : f.checkOut,
                      }));
                    }}
                    className="w-full text-sm font-medium text-gray-800 outline-none bg-transparent cursor-pointer"
                  />
                </div>

                {/* Check-out */}
                <div className="flex-1 px-5 py-4 border-b md:border-b-0 md:border-r border-gray-100">
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Check-out
                    {nights > 0 && (
                      <span className="ml-2 text-[#C9A96E] normal-case font-medium">
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
                <div className="flex-1 px-5 py-4 border-b md:border-b-0 border-gray-100">
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={form.guests}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guests: e.target.value }))
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Add guests"
                    className="w-full text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
                  />
                </div>

                {/* Search button */}
                <div className="px-3 py-3 md:pr-3">
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="w-full md:w-auto bg-[#C9A96E] disabled:opacity-70 text-white px-6 py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2.5 hover:bg-[#b8935a] hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-[#C9A96E]/40 whitespace-nowrap"
                  >
                    {isSearching ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <MagnifyingGlassIcon className="w-4 h-4" />
                    )}
                    {isSearching ? "Searching…" : "Search"}
                  </button>
                </div>
              </div>

              {/* Quick-filter chips */}
              <div className="flex items-center gap-2.5 mt-4 justify-center flex-wrap">
                {["Paris", "Bali", "Maldives", "Safari", "Overwater"].map(
                  (chip) => (
                    <button
                      key={chip}
                      onClick={() => {
                        setForm((f) => ({ ...f, query: chip }));
                        setTimeout(() => {
                          const params: SearchParams = { query: chip };
                          setSearchResults(searchHotels(params));
                          setHasSearched(true);
                        }, 100);
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs px-4 py-1.5 rounded-full border border-white/20 transition-all duration-200 backdrop-blur-sm hover:border-white/40"
                    >
                      {chip}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* ── Bottom stats strip ── */}
          <div className="flex items-center justify-center gap-8 md:gap-16 pb-8 text-white/60 text-xs">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-white font-semibold text-sm">12+</span>
              <span>Curated Properties</span>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-white font-semibold text-sm">4.9★</span>
              <span>Average Rating</span>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-white font-semibold text-sm">24/7</span>
              <span>Concierge Support</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
