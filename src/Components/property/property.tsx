import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPinIcon,
  HeartIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolid,
  StarIcon as StarSolid,
} from "@heroicons/react/24/solid";
import { ListingsDB, listingToHotel, type Hotel } from "../../index";
import { useAuth } from "../../AuthContext";

/* ─────────────── Types ─────────────── */

type SortKey = "featured" | "rating" | "price_asc" | "price_desc" | "newest";
type FilterCategory =
  | "all"
  | "villa"
  | "apartment"
  | "resort"
  | "boutique"
  | "penthouse";

/* ─────────────── Constants ─────────────── */

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  all: "All Stays",
  villa: "Villas",
  apartment: "Apartments",
  resort: "Resorts",
  boutique: "Boutique",
  penthouse: "Penthouses",
};

const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured",
  rating: "Top Rated",
  price_asc: "Price: Low → High",
  price_desc: "Price: High → Low",
  newest: "Newest",
};

const AMENITY_ICONS: Record<string, string> = {
  "Free WiFi": "📶",
  "Private Pool": "🏊",
  "Butler Service": "🛎",
  "Sea View": "🌊",
  "Spa Island": "💆",
  "Airport Transfer": "✈️",
  "Fine Dining": "🍽",
  "Overwater Bungalow": "🌅",
  "Water Sports": "🚤",
  "Kids Club": "🧒",
  Pool: "🏊",
  BBQ: "🍖",
  "Wine Cellar": "🍷",
  Butler: "🛎",
  "Air Conditioning": "❄️",
  Concierge: "🔔",
  Netflix: "🎬",
};

/* ─────────────── Skeleton card ─────────────── */

const SkeletonCard = () => (
  <div className="bg-white rounded-3xl overflow-hidden animate-pulse">
    <div className="h-64 bg-gray-100" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-100 rounded-full w-2/3" />
      <div className="h-3 bg-gray-100 rounded-full w-1/2" />
      <div className="h-3 bg-gray-100 rounded-full w-1/3" />
    </div>
  </div>
);

/* ─────────────── Property card ─────────────── */

const PropertyCard = ({
  hotel,
  index,
  wishlisted,
  onWishlist,
  onBook,
}: {
  hotel: Hotel;
  index: number;
  wishlisted: boolean;
  onWishlist: (id: string) => void;
  onBook: (hotel: Hotel) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const topAmenities = hotel.amenities.slice(0, 3);

  return (
    <div
      ref={cardRef}
      className="group relative bg-white rounded-3xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.12)] transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.55s ease ${index * 80}ms, transform 0.55s ease ${index * 80}ms, box-shadow 0.3s ease`,
      }}
    >
      {/* ── Image ── */}
      <div className="relative h-60 overflow-hidden">
        <img
          src={
            imgError
              ? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80"
              : hotel.thumbnail || hotel.images[0]
          }
          alt={hotel.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-md text-[#C9A96E] text-[10px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full">
            {hotel.category}
          </span>
        </div>

        {/* Featured badge */}
        {hotel.featured && (
          <div className="absolute top-3 left-[calc(100%-4.5rem)] translate-x-1">
            <span className="bg-[#C9A96E] text-white text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 rounded-full">
              Featured
            </span>
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWishlist(hotel.id);
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
        >
          {wishlisted ? (
            <HeartSolid className="w-4 h-4 text-rose-500" />
          ) : (
            <HeartIcon className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {/* Rating chip — bottom left of image */}
        {hotel.rating > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1">
            <StarSolid className="w-3 h-3 text-[#C9A96E]" />
            <span className="text-white text-xs font-semibold">
              {hotel.rating.toFixed(1)}
            </span>
            {hotel.reviewCount > 0 && (
              <span className="text-white/60 text-[10px]">
                ({hotel.reviewCount})
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="p-5">
        {/* Name + location */}
        <div className="mb-3">
          <h3 className="font-['Cormorant_Garamond'] text-lg font-semibold text-gray-900 leading-tight line-clamp-1">
            {hotel.name}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPinIcon className="w-3 h-3 text-[#C9A96E] shrink-0" />
            <p className="text-xs text-gray-400 line-clamp-1">
              {hotel.location}
            </p>
          </div>
        </div>

        {/* Tags */}
        {hotel.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {hotel.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-[#C9A96E] bg-[#C9A96E]/8 border border-[#C9A96E]/20 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Amenities */}
        <div className="flex items-center gap-3 mb-4">
          {[
            {
              icon: "🛏",
              val: `${hotel.bedrooms} bed${hotel.bedrooms !== 1 ? "s" : ""}`,
            },
            {
              icon: "🚿",
              val: `${hotel.bathrooms} bath${hotel.bathrooms !== 1 ? "s" : ""}`,
            },
            { icon: "👥", val: `${hotel.maxGuests} guests` },
          ].map(({ icon, val }) => (
            <span
              key={val}
              className="flex items-center gap-1 text-[11px] text-gray-400"
            >
              <span>{icon}</span>
              {val}
            </span>
          ))}
        </div>

        {/* Top amenity icons */}
        {topAmenities.length > 0 && (
          <div className="flex gap-2 mb-4">
            {topAmenities.map((a) => (
              <span
                key={a}
                title={a}
                className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-sm"
              >
                {AMENITY_ICONS[a] || "✦"}
              </span>
            ))}
            {hotel.amenities.length > 3 && (
              <span className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-semibold">
                +{hotel.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-gray-900">
                ${hotel.pricePerNight.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400 font-normal">/ night</span>
            </div>
          </div>
          <button
            onClick={() => onBook(hotel)}
            className="bg-[#C9A96E] hover:bg-[#b8935a] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md shadow-[#C9A96E]/25"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Main component ─────────────── */

interface FeaturedPropertiesProps {
  onBook?: (hotel: Hotel) => void;
  onViewAll?: () => void;
  initialLimit?: number;
}

const FeaturedProperties = ({
  onBook,
  onViewAll,
  initialLimit = 6,
}: FeaturedPropertiesProps) => {
  const { user, updateUser } = useAuth();

  /* State */
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [displayed, setDisplayed] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<FilterCategory>("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const [wishlist, setWishlist] = useState<Set<string>>(
    new Set(user?.wishlist ?? []),
  );
  const [limit, setLimit] = useState(initialLimit);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  /* Fetch all listings once */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    let cancelled = false;
    setLoading(true);
    setError(null);

    ListingsDB.all()
      .then((listings) => {
        if (cancelled) return;
        setAllHotels(listings.map(listingToHotel));
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load properties. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Re-sync wishlist when user changes */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWishlist(new Set(user?.wishlist ?? []));
  }, [user]);

  /* Close sort menu on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Filter + sort + slice */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const filtered =
      category === "all"
        ? [...allHotels]
        : allHotels.filter((h) => h.category === category);

    filtered.sort((a, b) => {
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
        case "featured":
        default:
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return b.rating - a.rating;
      }
    });

    setDisplayed(filtered.slice(0, limit));
  }, [allHotels, category, sort, limit]);

  /* Wishlist toggle — persists to Supabase */
  const handleWishlist = useCallback(
    async (id: string) => {
      if (!user) return;
      setWishlist((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      const current = new Set(user.wishlist ?? []);
      current.has(id) ? current.delete(id) : current.add(id);
      await updateUser({ wishlist: Array.from(current) });
    },
    [user, updateUser],
  );

  /* Categories derived from data */
  const availableCategories: FilterCategory[] = [
    "all",
    ...Array.from(new Set(allHotels.map((h) => h.category as FilterCategory))),
  ];

  const totalFiltered =
    category === "all"
      ? allHotels.length
      : allHotels.filter((h) => h.category === category).length;

  const hasMore = limit < totalFiltered;

  /* ── Render ── */
  return (
    <section className="bg-[#FAFAF8] py-20 px-5 md:px-10">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C9A96E] mb-2">
              Curated for You
            </p>
            <h2 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-semibold text-gray-900 leading-tight">
              Featured <span className="italic text-[#C9A96E]">Stays</span>
            </h2>
            <div className="w-12 h-px bg-[#C9A96E] mt-3" />
            <p className="text-gray-400 text-sm mt-2">
              {loading
                ? "Loading properties…"
                : `${totalFiltered} handpicked luxury space${totalFiltered !== 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort dropdown */}
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setShowSortMenu((s) => !s)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:border-[#C9A96E] transition-colors"
              >
                <span className="hidden sm:inline">Sort:</span>
                <span className="text-[#C9A96E]">{SORT_LABELS[sort]}</span>
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showSortMenu ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden">
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSort(key);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sort === key
                          ? "bg-[#C9A96E]/8 text-[#C9A96E] font-semibold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View all */}
            <button
              onClick={onViewAll}
              className="flex items-center gap-2 text-sm font-semibold text-[#C9A96E] hover:text-[#b8935a] transition-colors group"
            >
              View All
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* ── Category filter pills ── */}
        <div className="flex gap-2 flex-wrap mb-8">
          {availableCategories.map((cat) => {
            const count =
              cat === "all"
                ? allHotels.length
                : allHotels.filter((h) => h.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setLimit(initialLimit);
                }}
                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all duration-200 ${
                  category === cat
                    ? "bg-[#C9A96E] border-[#C9A96E] text-white shadow-md shadow-[#C9A96E]/20"
                    : "border-gray-200 text-gray-500 bg-white hover:border-[#C9A96E] hover:text-[#C9A96E]"
                }`}
              >
                {CATEGORY_LABELS[cat]}
                {!loading && count > 0 && (
                  <span
                    className={`ml-1.5 ${category === cat ? "text-white/70" : "text-gray-300"}`}
                  >
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-gray-500 text-sm font-medium mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-semibold text-[#C9A96E] hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: initialLimit }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && displayed.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🏡</p>
            <p className="font-['Cormorant_Garamond'] text-2xl text-gray-700 mb-2">
              No properties found
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Try a different category or check back soon.
            </p>
            <button
              onClick={() => setCategory("all")}
              className="text-sm font-semibold text-[#C9A96E] hover:underline"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* ── Property grid ── */}
        {!loading && !error && displayed.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayed.map((hotel, i) => (
                <PropertyCard
                  key={hotel.id}
                  hotel={hotel}
                  index={i}
                  wishlisted={wishlist.has(hotel.id)}
                  onWishlist={handleWishlist}
                  onBook={(h) => onBook?.(h)}
                />
              ))}
            </div>

            {/* ── Load more ── */}
            <div className="mt-12 flex flex-col items-center gap-3">
              {hasMore && (
                <button
                  onClick={() => setLimit((l) => l + initialLimit)}
                  className="flex items-center gap-2.5 bg-white border border-gray-200 hover:border-[#C9A96E] text-gray-700 hover:text-[#C9A96E] font-semibold text-sm px-8 py-3.5 rounded-2xl transition-all duration-200 hover:shadow-md group"
                >
                  Load more properties
                  <ArrowRightIcon className="w-4 h-4 rotate-90 group-hover:translate-y-0.5 transition-transform" />
                </button>
              )}
              <p className="text-xs text-gray-300">
                Showing {displayed.length} of {totalFiltered} properties
              </p>
            </div>
          </>
        )}

        {/* ── No auth wishlist nudge ── */}
        {!user && !loading && displayed.length > 0 && (
          <p className="text-center text-xs text-gray-300 mt-6">
            <span className="text-[#C9A96E] cursor-pointer hover:underline font-medium">
              Sign in
            </span>{" "}
            to save your favourite properties
          </p>
        )}
      </div>
    </section>
  );
};

export default FeaturedProperties;
