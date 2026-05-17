import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  HeartIcon,
  MapPinIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolid,
  StarIcon as StarSolid,
} from "@heroicons/react/24/solid";
import { useAuth } from "./AuthContext";
import { ListingsDB, type Listing } from "./index";

/* ─────────────────────────────────────────────────────────
   TYPES & CONSTANTS
───────────────────────────────────────────────────────── */
type SortKey = "featured" | "rating" | "price_asc" | "price_desc" | "newest";
type ViewMode = "grid" | "list";

const CATEGORIES = [
  "All",
  "Villa",
  "Apartment",
  "Resort",
  "Boutique",
  "Penthouse",
] as const;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured First" },
  { key: "rating", label: "Top Rated" },
  { key: "price_asc", label: "Price: Low → High" },
  { key: "price_desc", label: "Price: High → Low" },
  { key: "newest", label: "Newest" },
];

const AMENITY_ICONS: Record<string, string> = {
  "Free WiFi": "📶",
  "Private Pool": "🏊",
  "Butler Service": "🛎",
  "Sea View": "🌊",
  "Air Conditioning": "❄️",
  "Fine Dining": "🍽",
  "Spa Island": "💆",
  "Airport Transfer": "✈️",
  BBQ: "🍖",
  "Wine Cellar": "🍷",
  Netflix: "🎬",
  "Daily Cleaning": "🧹",
  "Water Sports": "🚤",
  Gym: "🏋️",
  Parking: "🚗",
  Pool: "🏊",
  Concierge: "🔔",
  "Hot Tub": "♨️",
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function sortListings(listings: Listing[], sort: SortKey): Listing[] {
  return [...listings].sort((a, b) => {
    switch (sort) {
      case "rating":
        return b.rating - a.rating;
      case "price_asc":
        return a.pricePerNight - b.pricePerNight;
      case "price_desc":
        return b.pricePerNight - a.pricePerNight;
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      default:
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.rating - a.rating;
    }
  });
}

/* ─────────────────────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────────────────────── */
const SkeletonCard = ({ index }: { index: number }) => (
  <div
    className="bg-[#1a1612] border border-[rgba(245,240,232,0.05)] rounded-2xl overflow-hidden animate-pulse"
    style={{ animationDelay: `${index * 80}ms` }}
  >
    <div className="h-52 bg-[rgba(245,240,232,0.06)]" />
    <div className="p-4 space-y-2.5">
      <div className="h-4 bg-[rgba(245,240,232,0.06)] rounded-full w-3/4" />
      <div className="h-3 bg-[rgba(245,240,232,0.04)] rounded-full w-1/2" />
      <div className="flex gap-2 mt-3">
        <div className="h-5 w-16 bg-[rgba(245,240,232,0.04)] rounded-full" />
        <div className="h-5 w-12 bg-[rgba(245,240,232,0.04)] rounded-full" />
      </div>
      <div className="flex justify-between pt-1">
        <div className="h-5 w-24 bg-[rgba(245,240,232,0.06)] rounded-full" />
        <div className="h-5 w-10 bg-[rgba(245,240,232,0.04)] rounded-full" />
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   LISTING CARD (grid)
───────────────────────────────────────────────────────── */
const ListingCard = ({
  listing,
  wishlisted,
  onWishlist,
  onClick,
  index,
}: {
  listing: Listing;
  wishlisted: boolean;
  onWishlist: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
  index: number;
}) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      onClick={onClick}
      className="group relative bg-[#1a1612] border border-[rgba(245,240,232,0.06)] rounded-2xl overflow-hidden cursor-pointer hover:border-[rgba(201,169,110,0.3)] hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:shadow-black/40"
      style={{ animation: `fadeUp 0.5s ease ${index * 55}ms both` }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={
            imgErr
              ? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500"
              : listing.images[0] ||
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500"
          }
          alt={listing.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={() => setImgErr(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Category badge */}
        <span className="absolute top-3 left-3 bg-[rgba(14,13,11,0.8)] backdrop-blur-md border border-[rgba(245,240,232,0.1)] rounded-full px-2.5 py-1 text-[10px] text-[#C9A96E] font-bold uppercase tracking-wider">
          {listing.category}
        </span>

        {/* Featured badge */}
        {listing.featured && (
          <span className="absolute top-3 left-[calc(100%-5.5rem)] bg-[#C9A96E] text-[#0e0d0b] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
            Featured
          </span>
        )}

        {/* Wishlist button */}
        <button
          onClick={(e) => onWishlist(listing.id, e)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[rgba(14,13,11,0.7)] backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform shadow-md"
        >
          {wishlisted ? (
            <HeartSolid className="w-4 h-4 text-rose-400" />
          ) : (
            <HeartIcon className="w-4 h-4 text-white/80" />
          )}
        </button>

        {/* Rating */}
        {listing.rating > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-[rgba(14,13,11,0.75)] backdrop-blur-md rounded-full px-2.5 py-1">
            <StarSolid className="w-3 h-3 text-[#C9A96E]" />
            <span className="text-white text-xs font-semibold">
              {listing.rating.toFixed(1)}
            </span>
            {listing.reviewCount > 0 && (
              <span className="text-white/45 text-[10px]">
                ({listing.reviewCount})
              </span>
            )}
          </div>
        )}
        {listing.rating === 0 && (
          <div className="absolute bottom-3 left-3 bg-[rgba(14,13,11,0.75)] backdrop-blur-md rounded-full px-2.5 py-1">
            <span className="text-[#C9A96E] text-[10px] font-bold">New</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-['Cormorant_Garamond'] text-[15px] font-semibold text-[#f5f0e8] truncate mb-1">
          {listing.name}
        </h3>
        <div className="flex items-center gap-1.5 mb-3">
          <MapPinIcon className="w-3 h-3 text-[#C9A96E] shrink-0" />
          <span className="text-[rgba(245,240,232,0.45)] text-xs truncate">
            {listing.location}
          </span>
        </div>

        {/* Top amenity icons */}
        {listing.amenities.length > 0 && (
          <div className="flex gap-1.5 mb-3">
            {listing.amenities.slice(0, 4).map((a) => (
              <span key={a} title={a} className="text-sm">
                {AMENITY_ICONS[a] || "✦"}
              </span>
            ))}
            {listing.amenities.length > 4 && (
              <span className="text-[10px] text-[rgba(245,240,232,0.3)] self-center">
                +{listing.amenities.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {listing.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-[#C9A96E] bg-[rgba(201,169,110,0.08)] border border-[rgba(201,169,110,0.18)] px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price + meta */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[rgba(245,240,232,0.06)]">
          <div>
            <span className="font-['Cormorant_Garamond'] text-lg font-bold text-[#f5f0e8]">
              ${listing.pricePerNight.toLocaleString()}
            </span>
            <span className="text-[rgba(245,240,232,0.3)] text-xs">
              {" "}
              /night
            </span>
          </div>
          <div className="text-[10px] text-[rgba(245,240,232,0.3)]">
            🛏 {listing.bedrooms} · 👥 {listing.maxGuests}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   LISTING ROW (list view)
───────────────────────────────────────────────────────── */
const ListingRow = ({
  listing,
  wishlisted,
  onWishlist,
  onClick,
  index,
}: {
  listing: Listing;
  wishlisted: boolean;
  onWishlist: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
  index: number;
}) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      onClick={onClick}
      className="group flex gap-5 bg-[#1a1612] border border-[rgba(245,240,232,0.06)] rounded-2xl overflow-hidden cursor-pointer hover:border-[rgba(201,169,110,0.25)] transition-all duration-300 hover:shadow-xl hover:shadow-black/30"
      style={{ animation: `fadeUp 0.4s ease ${index * 40}ms both` }}
    >
      <div className="relative w-48 shrink-0 overflow-hidden">
        <img
          src={
            imgErr
              ? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300"
              : listing.images[0] ||
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300"
          }
          alt={listing.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImgErr(true)}
        />
        <span className="absolute top-2 left-2 bg-[rgba(14,13,11,0.8)] backdrop-blur-md border border-[rgba(245,240,232,0.1)] rounded-full px-2 py-0.5 text-[9px] text-[#C9A96E] font-bold uppercase tracking-wider">
          {listing.category}
        </span>
      </div>
      <div className="flex-1 py-4 pr-4 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h3 className="font-['Cormorant_Garamond'] text-lg font-semibold text-[#f5f0e8] truncate">
            {listing.name}
          </h3>
          <button
            onClick={(e) => onWishlist(listing.id, e)}
            className="shrink-0 p-1.5 hover:scale-110 transition-transform"
          >
            {wishlisted ? (
              <HeartSolid className="w-4 h-4 text-rose-400" />
            ) : (
              <HeartIcon className="w-4 h-4 text-white/50" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-1.5 mb-2">
          <MapPinIcon className="w-3 h-3 text-[#C9A96E] shrink-0" />
          <span className="text-[rgba(245,240,232,0.45)] text-xs">
            {listing.location}
          </span>
        </div>
        <p className="text-[rgba(245,240,232,0.35)] text-xs line-clamp-2 mb-3">
          {listing.description?.slice(0, 100)}…
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          {listing.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[10px] text-[#C9A96E] bg-[rgba(201,169,110,0.08)] border border-[rgba(201,169,110,0.15)] px-2 py-0.5 rounded-full"
            >
              {t}
            </span>
          ))}
          <span className="text-[10px] text-[rgba(245,240,232,0.25)] ml-auto">
            🛏 {listing.bedrooms} · 🚿 {listing.bathrooms} · 👥{" "}
            {listing.maxGuests}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between py-4 pr-5 shrink-0">
        <div className="text-right">
          <p className="font-['Cormorant_Garamond'] text-xl font-bold text-[#f5f0e8]">
            ${listing.pricePerNight.toLocaleString()}
          </p>
          <p className="text-[rgba(245,240,232,0.3)] text-xs">/night</p>
        </div>
        {listing.rating > 0 && (
          <div className="flex items-center gap-1">
            <StarSolid className="w-3 h-3 text-[#C9A96E]" />
            <span className="text-white/60 text-xs font-semibold">
              {listing.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function ExplorePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  /* ── State ── */
  const [query, setQuery] = useState("");
  const [guests, setGuests] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBeds, setMinBeds] = useState("");

  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);

  /* ── Load all listings on mount ── */
  useEffect(() => {
    ListingsDB.all()
      .then((l) => {
        setAllListings(l);
        setSearched(true);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Close sort dropdown on outside click ── */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setShowSort(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Search ── */
  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const cat = category || undefined;
      const g = guests ? parseInt(guests) : undefined;
      const res = await ListingsDB.search(query, g, cat);
      setAllListings(res);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, [query, guests, category]);

  /* ── Filter + sort ── */
  const displayed = sortListings(
    allListings.filter((l) => {
      if (minPrice && l.pricePerNight < Number(minPrice)) return false;
      if (maxPrice && l.pricePerNight > Number(maxPrice)) return false;
      if (minBeds && l.bedrooms < Number(minBeds)) return false;
      return true;
    }),
    sort,
  );

  /* ── Wishlist ── */
  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role === "host") return;
    const wl = user.wishlist || [];
    const next = wl.includes(id) ? wl.filter((x) => x !== id) : [...wl, id];
    updateUser({ wishlist: next });
  };
  const isWishlisted = (id: string) => (user?.wishlist || []).includes(id);

  /* ── Clear all filters ── */
  const clearAll = () => {
    setQuery("");
    setGuests("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setMinBeds("");
    setSort("featured");
    ListingsDB.all().then(setAllListings);
  };

  const hasFilters =
    query || guests || category || minPrice || maxPrice || minBeds;

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0e0d0b] font-sans text-[#f5f0e8]">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-40 bg-[rgba(14,13,11,0.95)] backdrop-blur-md border-b border-[rgba(245,240,232,0.07)] h-16 flex items-center justify-between px-6 md:px-10">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => navigate("/explore")}
        >
          <div className="w-[18px] h-[18px] bg-[#C9A96E] rotate-45 rounded-sm shrink-0" />
          <span className="font-['Cormorant_Garamond'] text-xl text-[#f5f0e8] tracking-wide">
            LuxStay
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() =>
                  navigate(user.role === "host" ? "/dashboard" : "/account")
                }
                className="hidden sm:block text-sm text-[rgba(245,240,232,0.55)] hover:text-[#f5f0e8] transition-colors"
              >
                {user.role === "host" ? "Host Dashboard" : "My Account"}
              </button>
              <div
                onClick={() =>
                  navigate(user.role === "host" ? "/dashboard" : "/account")
                }
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#8a6030] flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-md"
              >
                {user.avatar ?? user.firstName?.[0] ?? "?"}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-[rgba(245,240,232,0.55)] hover:text-[#f5f0e8] transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="bg-[#C9A96E] text-[#0e0d0b] text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#dfc08a] transition-all hover:scale-105 shadow-md shadow-[#C9A96E]/20"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1540202404-a2f29d618464?w=1400&q=80"
            alt=""
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0e0d0b]/40 via-[#0e0d0b]/20 to-[#0e0d0b]" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 60% at 60% 40%, rgba(201,169,110,0.08) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative z-10 px-6 md:px-10 pt-16 pb-12 max-w-5xl">
          <div style={{ animation: "fadeUp 0.5s ease both" }}>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#C9A96E] mb-4 font-medium">
              Curated Luxury Escapes
            </p>
            <h1 className="font-['Cormorant_Garamond'] text-[clamp(36px,5vw,60px)] text-[#f5f0e8] leading-[1.06] mb-4">
              Find Your <em className="not-italic text-[#C9A96E]">Perfect</em>{" "}
              Stay
            </h1>
            <p className="text-[rgba(245,240,232,0.55)] text-sm md:text-base max-w-md mb-8 leading-relaxed">
              Handpicked luxury properties, listed by verified hosts worldwide.
            </p>
          </div>

          {/* ── SEARCH BAR ── */}
          <div
            className="flex bg-[rgba(14,13,11,0.8)] backdrop-blur-xl border border-[rgba(245,240,232,0.1)] rounded-2xl overflow-hidden max-w-2xl shadow-2xl shadow-black/40"
            style={{ animation: "fadeUp 0.5s ease 100ms both" }}
          >
            {/* Location */}
            <div className="flex-1 px-5 py-4 border-r border-[rgba(245,240,232,0.07)]">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[rgba(245,240,232,0.4)] mb-1.5 font-bold">
                Where to?
              </p>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="City, country, or style…"
                className="w-full bg-transparent text-sm font-medium text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.28)] outline-none"
              />
            </div>
            {/* Guests */}
            <div className="px-5 py-4 border-r border-[rgba(245,240,232,0.07)] w-32">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[rgba(245,240,232,0.4)] mb-1.5 font-bold">
                Guests
              </p>
              <input
                type="number"
                value={guests}
                min="1"
                onChange={(e) => setGuests(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Any"
                className="w-full bg-transparent text-sm font-medium text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.28)] outline-none"
              />
            </div>
            {/* Search button */}
            <button
              onClick={runSearch}
              className="px-7 bg-[#C9A96E] text-[#0e0d0b] hover:bg-[#dfc08a] transition-colors flex items-center gap-2 text-sm font-semibold"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              <span className="hidden sm:block">Search</span>
            </button>
          </div>

          {/* Quick chips */}
          <div
            className="flex gap-2 flex-wrap mt-4"
            style={{ animation: "fadeUp 0.5s ease 200ms both" }}
          >
            {["Maldives", "Paris", "Bali", "Safari", "Overwater Villa"].map(
              (chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setQuery(chip);
                    setTimeout(runSearch, 50);
                  }}
                  className="text-xs text-[rgba(245,240,232,0.5)] border border-[rgba(245,240,232,0.1)] hover:border-[rgba(201,169,110,0.35)] hover:text-[#C9A96E] px-3.5 py-1.5 rounded-full transition-all backdrop-blur-sm"
                >
                  {chip}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="sticky top-16 z-30 bg-[rgba(14,13,11,0.95)] backdrop-blur-md border-b border-[rgba(245,240,232,0.07)] px-6 md:px-10 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category pills */}
          <div className="flex gap-2 flex-wrap flex-1">
            {CATEGORIES.map((cat) => {
              const active =
                (cat === "All" && !category) || category === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat === "All" ? "" : cat.toLowerCase());
                  }}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${active ? "bg-[#C9A96E] border-[#C9A96E] text-[#0e0d0b] shadow-md shadow-[#C9A96E]/20" : "border-[rgba(245,240,232,0.1)] text-[rgba(245,240,232,0.5)] hover:border-[rgba(201,169,110,0.3)] hover:text-[#C9A96E]"}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${showFilters ? "border-[#C9A96E] text-[#C9A96E] bg-[rgba(201,169,110,0.08)]" : "border-[rgba(245,240,232,0.1)] text-[rgba(245,240,232,0.5)] hover:border-[rgba(201,169,110,0.3)]"}`}
            >
              <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
              Filters
              {(minPrice || maxPrice || minBeds) && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
              )}
            </button>

            {/* Sort */}
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setShowSort((s) => !s)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[rgba(245,240,232,0.1)] text-[rgba(245,240,232,0.5)] hover:border-[rgba(201,169,110,0.3)] hover:text-[#C9A96E] transition-all"
              >
                {SORT_OPTIONS.find((s) => s.key === sort)?.label}
                <ChevronDownIcon
                  className={`w-3 h-3 transition-transform ${showSort ? "rotate-180" : ""}`}
                />
              </button>
              {showSort && (
                <div
                  className="absolute right-0 top-full mt-2 bg-[#1a1612] border border-[rgba(245,240,232,0.1)] rounded-2xl shadow-2xl z-50 overflow-hidden min-w-[180px]"
                  style={{ animation: "fadeIn 0.15s ease both" }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSort(opt.key);
                        setShowSort(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sort === opt.key ? "text-[#C9A96E] bg-[rgba(201,169,110,0.08)] font-semibold" : "text-[rgba(245,240,232,0.6)] hover:bg-[rgba(245,240,232,0.04)]"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View mode */}
            <div className="flex border border-[rgba(245,240,232,0.1)] rounded-full overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-[#C9A96E] text-[#0e0d0b]" : "text-[rgba(245,240,232,0.4)] hover:text-white"}`}
              >
                <Squares2X2Icon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-[#C9A96E] text-[#0e0d0b]" : "text-[rgba(245,240,232,0.4)] hover:text-white"}`}
              >
                <ListBulletIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div
            className="flex gap-4 flex-wrap mt-3 pt-3 border-t border-[rgba(245,240,232,0.06)]"
            style={{ animation: "fadeUp 0.2s ease both" }}
          >
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[rgba(245,240,232,0.35)] block mb-1">
                Min Price / night
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="$0"
                className="w-28 bg-[rgba(245,240,232,0.05)] border border-[rgba(245,240,232,0.1)] rounded-xl px-3 py-1.5 text-xs text-[#f5f0e8] outline-none focus:border-[#C9A96E] transition-colors placeholder:text-[rgba(245,240,232,0.2)]"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[rgba(245,240,232,0.35)] block mb-1">
                Max Price / night
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="No limit"
                className="w-28 bg-[rgba(245,240,232,0.05)] border border-[rgba(245,240,232,0.1)] rounded-xl px-3 py-1.5 text-xs text-[#f5f0e8] outline-none focus:border-[#C9A96E] transition-colors placeholder:text-[rgba(245,240,232,0.2)]"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[rgba(245,240,232,0.35)] block mb-1">
                Min Bedrooms
              </label>
              <input
                type="number"
                value={minBeds}
                onChange={(e) => setMinBeds(e.target.value)}
                placeholder="Any"
                min="1"
                className="w-24 bg-[rgba(245,240,232,0.05)] border border-[rgba(245,240,232,0.1)] rounded-xl px-3 py-1.5 text-xs text-[#f5f0e8] outline-none focus:border-[#C9A96E] transition-colors placeholder:text-[rgba(245,240,232,0.2)]"
              />
            </div>
            {(minPrice || maxPrice || minBeds) && (
              <button
                onClick={() => {
                  setMinPrice("");
                  setMaxPrice("");
                  setMinBeds("");
                }}
                className="self-end flex items-center gap-1 text-xs text-[rgba(245,240,232,0.4)] hover:text-[#e07070] transition-colors pb-1.5"
              >
                <XMarkIcon className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── RESULTS ── */}
      <div className="px-6 md:px-10 py-8">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[rgba(245,240,232,0.5)] text-sm">
              {loading ? (
                "Searching…"
              ) : (
                <>
                  <span className="text-[#f5f0e8] font-semibold">
                    {displayed.length}
                  </span>{" "}
                  {displayed.length === 1 ? "stay" : "stays"} found
                  {hasFilters && (
                    <span className="text-[rgba(245,240,232,0.35)]">
                      {" "}
                      · filtered
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-[rgba(245,240,232,0.4)] hover:text-[#e07070] transition-colors"
            >
              <XMarkIcon className="w-3.5 h-3.5" /> Clear all filters
            </button>
          )}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                : "space-y-4"
            }
          >
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && searched && displayed.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-28 text-center"
            style={{ animation: "fadeUp 0.4s ease both" }}
          >
            <div className="w-16 h-16 rounded-2xl bg-[rgba(201,169,110,0.08)] border border-[rgba(201,169,110,0.15)] flex items-center justify-center mb-5 text-3xl">
              🔍
            </div>
            <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#f5f0e8] mb-2">
              No stays found
            </h3>
            <p className="text-[rgba(245,240,232,0.4)] text-sm max-w-xs mb-6">
              Try adjusting your filters, or explore all available properties.
            </p>
            <button
              onClick={clearAll}
              className="bg-[#C9A96E] text-[#0e0d0b] font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[#dfc08a] transition-all hover:scale-105"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && displayed.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayed.map((listing, i) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                index={i}
                wishlisted={isWishlisted(listing.id)}
                onWishlist={toggleWishlist}
                onClick={() => navigate(`/listing/${listing.id}`)}
              />
            ))}
          </div>
        )}

        {/* List */}
        {!loading && displayed.length > 0 && viewMode === "list" && (
          <div className="space-y-4">
            {displayed.map((listing, i) => (
              <ListingRow
                key={listing.id}
                listing={listing}
                index={i}
                wishlisted={isWishlisted(listing.id)}
                onWishlist={toggleWishlist}
                onClick={() => navigate(`/listing/${listing.id}`)}
              />
            ))}
          </div>
        )}

        {/* Footer nudge */}
        {!loading && displayed.length > 0 && (
          <p className="text-center text-[rgba(245,240,232,0.2)] text-xs mt-12">
            Showing all {displayed.length} available{" "}
            {displayed.length === 1 ? "property" : "properties"} · Powered by
            LuxStay
          </p>
        )}
      </div>
    </div>
  );
}
