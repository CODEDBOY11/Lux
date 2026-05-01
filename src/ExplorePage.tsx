import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  HeartIcon,
  MapPinIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useAuth } from "./AuthContext";
import { ListingsDB, type Listing } from "./index";

const CATEGORIES = [
  "All",
  "Villa",
  "Apartment",
  "Resort",
  "Boutique",
  "Penthouse",
] as const;

export default function ExplorePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [guests, setGuests] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<Listing[]>([]);

  const runSearch = useCallback(() => {
    const cat = category || undefined;
    const g = guests ? parseInt(guests) : undefined;
    setResults(ListingsDB.search(query, g, cat));
  }, [query, guests, category]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  const toggleWishlist = (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role === "host") return;
    const wl = user.wishlist || [];
    const next = wl.includes(listingId)
      ? wl.filter((id) => id !== listingId)
      : [...wl, listingId];
    updateUser({ wishlist: next });
  };

  const isWishlisted = (id: string) => (user?.wishlist || []).includes(id);

  return (
    <div className="min-h-screen bg-[#0e0d0b] font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-[rgba(14,13,11,0.95)] backdrop-blur-md border-b border-[rgba(245,240,232,0.08)] h-16 flex items-center justify-between px-6 md:px-10">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => navigate("/explore")}
        >
          <div className="w-4.5 h-4.5 bg-[#C9A96E] rotate-45 rounded-sm w-[18px] h-[18px]" />
          <span className="font-['Cormorant Garamond'] text-xl text-[#f5f0e8] tracking-wide">
            Zola Bekker
          </span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() =>
                  navigate(user.role === "host" ? "/dashboard" : "/account")
                }
                className="text-sm text-[rgba(245,240,232,0.6)] hover:text-[#f5f0e8] transition-colors"
              >
                {user.role === "host" ? "Dashboard" : "My Account"}
              </button>
              <div
                onClick={() =>
                  navigate(user.role === "host" ? "/dashboard" : "/account")
                }
                className="w-8 h-8 rounded-full bg-[rgba(201,169,110,0.12)] border border-[rgba(201,169,110,0.3)] flex items-center justify-center text-[#C9A96E] font-semibold text-sm cursor-pointer"
              >
                {user.avatar}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-[rgba(245,240,232,0.6)] hover:text-[#f5f0e8] transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="bg-[#C9A96E] text-[#0e0d0b] text-sm font-medium px-4 py-2 rounded-full hover:bg-[#dfc08a] transition-all"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="relative min-h-[420px] flex flex-col justify-end px-6 md:px-10 pb-10 pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540202404-a2f29d618464?w=1400&q=80')] bg-cover bg-center opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0b] via-[rgba(14,13,11,0.5)] to-transparent" />
        <div className="relative z-10 max-w-4xl">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A96E] mb-3">
            Curated Luxury Escapes
          </p>
          <h1 className="font-['Cormorant Garamond'] text-[clamp(32px,5vw,56px)] text-[#f5f0e8] leading-[1.08] mb-4">
            Find Your <em className="not-italic text-[#C9A96E]">Perfect</em>{" "}
            Stay
          </h1>
          <p className="text-[rgba(245,240,232,0.65)] text-sm md:text-base max-w-md mb-8 leading-relaxed">
            Handpicked luxury properties, listed by verified hosts worldwide.
          </p>

          {/* Search bar */}
          <div className="flex bg-[rgba(14,13,11,0.75)] backdrop-blur-xl border border-[rgba(245,240,232,0.1)] rounded-2xl overflow-hidden max-w-2xl">
            <div className="flex-1 px-5 py-4 border-r border-[rgba(245,240,232,0.08)]">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[rgba(245,240,232,0.45)] mb-1.5">
                Where to?
              </p>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="City, country, or style…"
                className="w-full bg-transparent text-sm font-medium text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.3)] outline-none"
              />
            </div>
            <div className="px-5 py-4 border-r border-[rgba(245,240,232,0.08)] w-32">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[rgba(245,240,232,0.45)] mb-1.5">
                Guests
              </p>
              <input
                type="number"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                min="1"
                placeholder="Any"
                className="w-full bg-transparent text-sm font-medium text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.3)] outline-none"
              />
            </div>
            <button
              onClick={runSearch}
              className="px-6 bg-[#C9A96E] text-[#0e0d0b] hover:bg-[#dfc08a] transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="px-6 md:px-10 py-10">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setCategory(cat === "All" ? "" : cat.toLowerCase())
              }
              className={`px-4 py-2 rounded-full border text-sm transition-all ${
                (cat === "All" && !category) || category === cat.toLowerCase()
                  ? "bg-[rgba(201,169,110,0.14)] border-[rgba(201,169,110,0.3)] text-[#C9A96E]"
                  : "bg-transparent border-[rgba(245,240,232,0.08)] text-[rgba(245,240,232,0.5)] hover:border-[rgba(245,240,232,0.18)]"
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto text-sm text-[rgba(245,240,232,0.4)]">
            {results.length} {results.length === 1 ? "stay" : "stays"} found
          </span>
        </div>

        {/* Grid */}
        {results.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-[rgba(245,240,232,0.5)] text-sm">
              No stays matched your search. Try adjusting filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {results.map((listing) => (
              <div
                key={listing.id}
                onClick={() => navigate(`/listing/${listing.id}`)}
                className="bg-[#252220] border border-[rgba(245,240,232,0.06)] rounded-2xl overflow-hidden cursor-pointer group hover:border-[rgba(201,169,110,0.25)] hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-black/30"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={
                      listing.images[0] ||
                      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"
                    }
                    alt={listing.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400";
                    }}
                  />
                  <span className="absolute top-3 left-3 bg-[rgba(14,13,11,0.75)] backdrop-blur-sm border border-[rgba(245,240,232,0.1)] rounded-full px-2.5 py-1 text-[11px] text-[#C9A96E] font-medium capitalize">
                    {listing.category}
                  </span>
                  <button
                    onClick={(e) => toggleWishlist(listing.id, e)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[rgba(14,13,11,0.65)] backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    {isWishlisted(listing.id) ? (
                      <HeartSolid className="w-4 h-4 text-[#C9A96E]" />
                    ) : (
                      <HeartIcon className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>

                {/* Body */}
                <div className="p-4">
                  <h3 className="font-['Cormorant Garamond'] text-base text-[#f5f0e8] mb-1 truncate">
                    {listing.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[rgba(245,240,232,0.45)] text-xs mb-3">
                    <MapPinIcon className="w-3.5 h-3.5 text-[#C9A96E]" />
                    {listing.location}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {listing.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-[#C9A96E] bg-[rgba(201,169,110,0.1)] border border-[rgba(201,169,110,0.2)] px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[#C9A96E] font-semibold text-sm">
                        ${listing.pricePerNight.toLocaleString()}
                      </span>
                      <span className="text-[rgba(245,240,232,0.35)] text-xs">
                        {" "}
                        / night
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[rgba(245,240,232,0.6)]">
                      {listing.rating > 0 ? (
                        <>
                          <StarIcon className="w-3.5 h-3.5 text-[#C9A96E] fill-[#C9A96E]" />
                          {listing.rating}
                        </>
                      ) : (
                        <span className="text-[rgba(245,240,232,0.3)]">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-[rgba(245,240,232,0.3)] mt-2">
                    🛏 {listing.bedrooms}bd · 👥 {listing.maxGuests} guests · by{" "}
                    {listing.hostName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
