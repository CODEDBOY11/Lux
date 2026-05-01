import { useMemo, useState, useEffect, useRef } from "react";
import { ListingsDB, type Listing } from "../../index";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

/* ─────────────── Category config ─────────────── */

type CategoryKey = Listing["category"];

interface CategoryMeta {
  label: string;
  tagline: string;
  emoji: string;
  gradient: string;
  accentColor: string;
  fallbackImage: string;
  tag: string;
}

const CATEGORY_META: Record<CategoryKey, CategoryMeta> = {
  villa: {
    label: "Luxury Villas",
    tagline: "Private estates with sweeping views",
    emoji: "🏛",
    gradient: "from-amber-950/80 via-amber-900/50 to-transparent",
    accentColor: "#C9A96E",
    fallbackImage:
      "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80",
    tag: "Most Popular",
  },
  apartment: {
    label: "City Apartments",
    tagline: "Iconic addresses in the world's great cities",
    emoji: "🏙",
    gradient: "from-slate-950/80 via-slate-900/50 to-transparent",
    accentColor: "#8BA7C9",
    fallbackImage:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
    tag: "City Escapes",
  },
  resort: {
    label: "Island Resorts",
    tagline: "Where ocean meets absolute luxury",
    emoji: "🌊",
    gradient: "from-teal-950/80 via-teal-900/50 to-transparent",
    accentColor: "#6EC9B8",
    fallbackImage:
      "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80",
    tag: "Top Rated",
  },
  boutique: {
    label: "Boutique Hotels",
    tagline: "Handcrafted stays with singular character",
    emoji: "✦",
    gradient: "from-rose-950/80 via-rose-900/50 to-transparent",
    accentColor: "#C96E8B",
    fallbackImage:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    tag: "Hidden Gems",
  },
  penthouse: {
    label: "Penthouses",
    tagline: "Above the city, above expectation",
    emoji: "🌃",
    gradient: "from-violet-950/80 via-violet-900/50 to-transparent",
    accentColor: "#A96EC9",
    fallbackImage:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    tag: "Ultra Luxury",
  },
};

/* ─────────────── Derived per-category stats from DB ─────────────── */

interface CategoryStats {
  key: CategoryKey;
  meta: CategoryMeta;
  count: number;
  avgPrice: number;
  minPrice: number;
  topRating: number;
  coverImage: string;
  listings: Listing[];
}

function useCategoryStats(): CategoryStats[] {
  return useMemo(() => {
    const all = ListingsDB.all();

    return (Object.keys(CATEGORY_META) as CategoryKey[])
      .map((key) => {
        const listings = all.filter((l) => l.category === key);
        const meta = CATEGORY_META[key];

        const avgPrice =
          listings.length > 0
            ? Math.round(
                listings.reduce((s, l) => s + l.pricePerNight, 0) /
                  listings.length,
              )
            : 0;

        const minPrice =
          listings.length > 0
            ? Math.min(...listings.map((l) => l.pricePerNight))
            : 0;

        const topRating =
          listings.length > 0 ? Math.max(...listings.map((l) => l.rating)) : 0;

        const coverImage =
          listings.find((l) => l.images[0])?.images[0] ?? meta.fallbackImage;

        return {
          key,
          meta,
          count: listings.length,
          avgPrice,
          minPrice,
          topRating,
          coverImage,
          listings,
        };
      })
      .sort((a, b) => b.count - a.count || b.avgPrice - a.avgPrice);
  }, []);
}

/* ─────────────── Card component ─────────────── */

function CategoryCard({
  stats,
  index,
  isActive,
  onClick,
}: {
  stats: CategoryStats;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const { meta, count, minPrice, avgPrice, topRating, coverImage } = stats;
  const cardRef = useRef<HTMLButtonElement>(null);

  // Intersection Observer for scroll-in animation
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      style={{
        opacity: 0,
        transform: "translateY(32px)",
        transition: `opacity 0.6s ease ${index * 100}ms, transform 0.6s ease ${index * 100}ms`,
      }}
      className={`group relative rounded-3xl overflow-hidden cursor-pointer text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E] ${
        isActive ? "ring-2 ring-white/40 scale-[1.02]" : "hover:scale-[1.015]"
      } transition-transform duration-300`}
    >
      {/* Image */}
      <div className="relative h-72 md:h-80 overflow-hidden">
        <img
          src={coverImage}
          alt={meta.label}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = meta.fallbackImage;
          }}
        />

        {/* Gradient overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t ${meta.gradient} opacity-90`}
        />

        {/* Top badge */}
        <div className="absolute top-4 left-4">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{
              background: `${meta.accentColor}22`,
              border: `1px solid ${meta.accentColor}55`,
              color: meta.accentColor,
            }}
          >
            {meta.tag}
          </span>
        </div>

        {/* Property count badge */}
        <div className="absolute top-4 right-4">
          <span className="text-[11px] font-semibold text-white/70 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full">
            {count > 0
              ? `${count} propert${count === 1 ? "y" : "ies"}`
              : "Coming soon"}
          </span>
        </div>

        {/* Emoji */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 pointer-events-none select-none"
          aria-hidden
        >
          {meta.emoji}
        </div>

        {/* Bottom content */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-white leading-tight mb-1">
                {meta.label}
              </h3>
              <p className="text-white/60 text-xs leading-relaxed max-w-[200px]">
                {meta.tagline}
              </p>
            </div>

            {/* Arrow */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
              style={{
                background: `${meta.accentColor}22`,
                border: `1px solid ${meta.accentColor}55`,
              }}
            >
              <ArrowRightIcon
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5"
                style={{ color: meta.accentColor }}
              />
            </div>
          </div>

          {/* Stats row */}
          {count > 0 && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">
                  From
                </p>
                <p className="text-sm font-bold text-white">
                  $
                  {minPrice > 0
                    ? minPrice.toLocaleString()
                    : avgPrice.toLocaleString()}
                  <span className="text-white/50 font-normal text-[10px]">
                    {" "}
                    /night
                  </span>
                </p>
              </div>
              {topRating > 0 && (
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">
                    Rating
                  </p>
                  <p className="text-sm font-bold text-white flex items-center gap-1">
                    <span style={{ color: meta.accentColor }}>★</span>
                    {topRating.toFixed(1)}
                  </p>
                </div>
              )}
              <div className="ml-auto">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">
                  Avg/night
                </p>
                <p className="text-sm font-bold text-white">
                  ${avgPrice.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─────────────── Detail panel (shown when a category is selected) ─────────────── */

function CategoryDetail({
  stats,
  onClose,
  onBook,
}: {
  stats: CategoryStats;
  onClose: () => void;
  onBook?: (listingId: string) => void;
}) {
  const { meta, listings } = stats;

  return (
    <div
      className="mt-6 rounded-3xl overflow-hidden border border-white/8 animate-[slideDown_0.35s_cubic-bezier(0.34,1.2,0.64,1)]"
      style={{
        background: "rgba(20,18,15,0.95)",
        backdropFilter: "blur(20px)",
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="p-6 border-b border-white/6 flex items-center justify-between">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1"
            style={{ color: meta.accentColor }}
          >
            {meta.emoji} {meta.tag}
          </p>
          <h3 className="font-['Cormorant_Garamond'] text-2xl text-white font-semibold">
            {meta.label}
          </h3>
          <p className="text-white/40 text-xs mt-0.5">{meta.tagline}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-all text-sm"
        >
          ✕
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-4xl mb-3">🌙</p>
          <p className="text-white/40 text-sm">
            No {meta.label.toLowerCase()} available right now.
          </p>
          <p className="text-white/25 text-xs mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <button
              key={listing.id}
              onClick={() => onBook?.(listing.id)}
              className="group text-left rounded-2xl overflow-hidden border border-white/6 hover:border-white/15 transition-all duration-200 hover:scale-[1.02]"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={listing.images[0] ?? meta.fallbackImage}
                  alt={listing.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = meta.fallbackImage;
                  }}
                />
                {listing.featured && (
                  <span
                    className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
                    style={{
                      background: `${meta.accentColor}22`,
                      border: `1px solid ${meta.accentColor}44`,
                      color: meta.accentColor,
                    }}
                  >
                    Featured
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <p className="font-['Cormorant_Garamond'] text-base font-semibold text-white leading-tight line-clamp-1">
                  {listing.name}
                </p>
                <p className="text-white/40 text-[11px] mt-0.5 line-clamp-1">
                  {listing.location}
                </p>
                <div className="flex items-center justify-between mt-2.5">
                  <p
                    className="text-sm font-bold"
                    style={{ color: meta.accentColor }}
                  >
                    ${listing.pricePerNight.toLocaleString()}
                    <span className="text-white/30 font-normal text-[10px]">
                      {" "}
                      /night
                    </span>
                  </p>
                  {listing.rating > 0 && (
                    <p className="text-[11px] text-white/50 flex items-center gap-1">
                      <span style={{ color: meta.accentColor }}>★</span>
                      {listing.rating.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Main export ─────────────── */

interface CategorySectionProps {
  onCategorySelect?: (category: CategoryKey) => void;
  onListingSelect?: (listingId: string) => void;
}

const CategorySection = ({
  onCategorySelect,
  onListingSelect,
}: CategorySectionProps) => {
  const categories = useCategoryStats();
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(
    null,
  );
  const sectionRef = useRef<HTMLElement>(null);

  const handleCardClick = (key: CategoryKey) => {
    if (activeCategory === key) {
      setActiveCategory(null);
    } else {
      setActiveCategory(key);
      onCategorySelect?.(key);
    }
  };

  const activeCategoryStats = categories.find((c) => c.key === activeCategory);

  // Total live listing count
  const totalListings = categories.reduce((s, c) => s + c.count, 0);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-5 md:px-10 overflow-hidden"
      style={{ background: "#0a0908" }}
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201,169,110,0.12), transparent),
                            radial-gradient(ellipse 60% 40% at 80% 110%, rgba(110,173,201,0.08), transparent)`,
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Curated Collection
            </p>
            <h2 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-semibold text-white leading-[1.1]">
              Browse by
              <span className="block italic text-[#C9A96E]">Category</span>
            </h2>
            <div className="w-16 h-px bg-gradient-to-r from-[#C9A96E] to-transparent mt-4" />
            <p className="text-white/40 text-sm mt-3 max-w-sm leading-relaxed">
              Find the perfect stay based on your lifestyle. From clifftop
              villas to skyline penthouses — curated for discerning travellers.
            </p>
          </div>

          {/* Live stats pill */}
          <div className="flex items-center gap-5 bg-white/4 border border-white/8 rounded-2xl px-5 py-4 self-start md:self-auto">
            <div className="text-center">
              <p className="font-['Cormorant_Garamond'] text-2xl font-bold text-[#C9A96E]">
                {totalListings}
              </p>
              <p className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">
                Live Properties
              </p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="font-['Cormorant_Garamond'] text-2xl font-bold text-[#C9A96E]">
                {categories.filter((c) => c.count > 0).length}
              </p>
              <p className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">
                Categories
              </p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="font-['Cormorant_Garamond'] text-2xl font-bold text-[#C9A96E]">
                5★
              </p>
              <p className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">
                Quality
              </p>
            </div>
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all duration-200 ${
              activeCategory === null
                ? "bg-[#C9A96E] border-[#C9A96E] text-[#0a0908]"
                : "border-white/12 text-white/45 hover:border-white/25 hover:text-white/70"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => handleCardClick(c.key)}
              className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all duration-200 ${
                activeCategory === c.key
                  ? "text-[#0a0908] border-transparent"
                  : "border-white/12 text-white/45 hover:border-white/25 hover:text-white/70"
              }`}
              style={
                activeCategory === c.key
                  ? {
                      background: c.meta.accentColor,
                      borderColor: c.meta.accentColor,
                    }
                  : {}
              }
            >
              {c.meta.emoji} {c.meta.label}
              {c.count > 0 && (
                <span className="ml-1.5 opacity-60">({c.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Cards grid — masonry-style with first card larger */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((stats, i) => (
            <div
              key={stats.key}
              className={
                // First card spans 2 columns on large screens
                i === 0 ? "lg:col-span-2" : ""
              }
            >
              <CategoryCard
                stats={stats}
                index={i}
                isActive={activeCategory === stats.key}
                onClick={() => handleCardClick(stats.key)}
              />
            </div>
          ))}
        </div>

        {/* Expanded detail panel */}
        {activeCategoryStats && (
          <CategoryDetail
            stats={activeCategoryStats}
            onClose={() => setActiveCategory(null)}
            onBook={(listingId) => {
              onListingSelect?.(listingId);
            }}
          />
        )}

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <p className="text-white/30 text-xs uppercase tracking-[0.2em] mb-3">
            Can't find what you're looking for?
          </p>
          <button className="group inline-flex items-center gap-2.5 text-sm font-semibold text-[#C9A96E] hover:text-[#dfc08a] transition-colors">
            Browse all {totalListings} properties
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
