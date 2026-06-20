import { useState, useEffect, useRef } from "react";
import { ListingsDB, type Listing } from "../../index";
import { ArrowRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid, MapPinIcon } from "@heroicons/react/24/solid";

/* ─────────────── Category config ─────────────── */

type CategoryKey = Listing["category"];

interface CategoryMeta {
  label: string;
  tagline: string;
  tag: string;
  fallbackImage: string;
}

const CATEGORY_META: Record<CategoryKey, CategoryMeta> = {
  villa: {
    label: "Luxury Villas",
    tagline: "Private estates with sweeping views",
    tag: "Most Popular",
    fallbackImage:
      "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=900&q=80",
  },
  apartment: {
    label: "City Apartments",
    tagline: "Iconic addresses in the world's great cities",
    tag: "City Escapes",
    fallbackImage:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
  },
  resort: {
    label: "Island Resorts",
    tagline: "Where ocean meets absolute luxury",
    tag: "Top Rated",
    fallbackImage:
      "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80",
  },
  boutique: {
    label: "Boutique Hotels",
    tagline: "Handcrafted stays with singular character",
    tag: "Hidden Gems",
    fallbackImage:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
  },
  penthouse: {
    label: "Penthouses",
    tagline: "Above the city, above expectation",
    tag: "Ultra Luxury",
    fallbackImage:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  },
};

/* ─────────────── DB hook ─────────────── */

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
  const [stats, setStats] = useState<CategoryStats[]>([]);

  useEffect(() => {
    let isMounted = true;

    ListingsDB.all().then((all) => {
      if (!isMounted) return;

      const computed = (Object.keys(CATEGORY_META) as CategoryKey[]).map(
        (key) => {
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
            listings.length > 0
              ? Math.max(...listings.map((l) => l.rating))
              : 0;

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
        },
      );

      setStats(computed);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return stats;
}

/* ─────────────── Helpers ─────────────── */

const CARD_GRADIENT =
  "linear-gradient(to top, rgba(15,13,10,0.90) 0%, rgba(15,13,10,0.25) 55%, transparent 100%)";

const CARD_ORDER: CategoryKey[] = [
  "villa",
  "resort",
  "penthouse",
  "apartment",
  "boutique",
];

/* ─────────────── Card ─────────────── */

interface CardProps {
  stats: CategoryStats;
  index: number;
  isActive: boolean;
  isWide: boolean;
  onClick: () => void;
}

function CategoryCard({ stats, index, isActive, isWide, onClick }: CardProps) {
  const { meta, count, minPrice, avgPrice, topRating, coverImage } = stats;
  const cardRef = useRef<HTMLButtonElement>(null);

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
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const displayPrice = minPrice > 0 ? minPrice : avgPrice;

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      aria-pressed={isActive}
      style={{
        opacity: 0,
        transform: "translateY(20px)",
        transition: `opacity 0.5s ease ${index * 80}ms, transform 0.5s ease ${index * 80}ms`,
        // Ring when active
        outline: isActive ? "2px solid rgba(184,150,74,0.7)" : "none",
        outlineOffset: "-2px",
      }}
      className="group relative overflow-hidden cursor-pointer text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8964A]"
    >
      {/* Image wrapper — tall on mobile, proportional on desktop */}
      <div
        className="relative overflow-hidden"
        style={{
          // Mobile: fixed height so cards don't become tiny slivers in a 2-col grid.
          // Desktop (via the parent grid col-span): aspect ratio takes over.
          height: "clamp(200px, 45vw, 9999px)",
          aspectRatio: isWide ? "21 / 9" : "4 / 3",
        }}
      >
        <img
          src={coverImage}
          alt={meta.label}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          style={{ filter: "brightness(0.82) saturate(0.92)" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = meta.fallbackImage;
          }}
        />

        {/* Gradient */}
        <div
          className="absolute inset-0"
          style={{ background: CARD_GRADIENT }}
        />

        {/* Tag badge — top left */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
          <span
            className="text-[9px] font-medium uppercase tracking-[0.16em] px-2 py-1 rounded-sm"
            style={{
              background: "rgba(212,170,102,0.15)",
              border: "1px solid rgba(212,170,102,0.4)",
              color: "#D4AA66",
              backdropFilter: "blur(6px)",
            }}
          >
            {meta.tag}
          </span>
        </div>

        {/* Property count — top right */}
        {count > 0 && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            <span
              className="text-[10px] font-light text-white/50"
              style={{ backdropFilter: "blur(4px)" }}
            >
              {count} {count === 1 ? "property" : "properties"}
            </span>
          </div>
        )}

        {/* Bottom content */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <h3
            className="font-['Cormorant_Garamond'] font-light text-white leading-tight mb-0.5"
            style={{ fontSize: isWide ? "clamp(20px, 3vw, 30px)" : "20px" }}
          >
            {meta.label}
          </h3>
          <p className="text-white/50 text-[11px] font-light leading-snug">
            {meta.tagline}
          </p>

          {/* Price + rating row */}
          {displayPrice > 0 && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-[9px] text-white/35 uppercase tracking-[0.1em] mb-0.5">
                  From
                </p>
                <p className="font-['Cormorant_Garamond'] text-base font-light text-[#D4AA66]">
                  ₦{displayPrice.toLocaleString()}
                  <span className="font-sans text-[10px] text-white/30 ml-0.5">
                    /night
                  </span>
                </p>
              </div>
              {topRating > 0 && (
                <div>
                  <p className="text-[9px] text-white/35 uppercase tracking-[0.1em] mb-0.5">
                    Rating
                  </p>
                  <p className="flex items-center gap-1 font-['Cormorant_Garamond'] text-base font-light text-white">
                    <StarSolid className="w-3 h-3 text-[#D4AA66]" />
                    {topRating.toFixed(1)}
                  </p>
                </div>
              )}
              {/* Arrow — always visible on mobile (no hover), fades in on desktop */}
              <div className="ml-auto">
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/20 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center transition-all duration-300 group-hover:border-[#D4AA66]/50"
                  aria-hidden
                >
                  <ArrowRightIcon
                    className={`w-3 h-3 text-white/60 group-hover:text-[#D4AA66] transition-all duration-300 ${isActive ? "rotate-90" : ""}`}
                  />
                </div>
              </div>
            </div>
          )}

          {count === 0 && (
            <p className="mt-2 text-white/25 text-[11px] font-light">
              Coming soon
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─────────────── Detail panel ─────────────── */

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
      className="overflow-hidden border border-[#E8E4DC]"
      style={{
        background: "#FFFFFF",
        borderRadius: "2px",
        animation: "csSlideDown 0.28s cubic-bezier(0.34,1.1,0.64,1)",
      }}
    >
      <style>{`
        @keyframes csSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Panel header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#F0EDE6]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-px bg-[#B8964A]" />
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#B8964A]">
              {meta.tag}
            </span>
          </div>
          <h3 className="font-['Cormorant_Garamond'] text-lg sm:text-xl font-light text-[#1C1A17]">
            {meta.label}
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="w-8 h-8 rounded-full border border-[#E8E4DC] flex items-center justify-center text-[#A09890] hover:bg-[#FAF8F4] hover:text-[#1C1A17] transition-all duration-200 shrink-0"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Listings grid */}
      {listings.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[#A09890] text-sm font-light">
            No {meta.label.toLowerCase()} available right now.
          </p>
          <p className="text-[#C4BFB5] text-xs mt-1">Check back soon.</p>
        </div>
      ) : (
        <div
          className="grid gap-px"
          style={{
            // 1 col on mobile, 2 on sm, 3 on md+
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
            background: "#F0EDE6",
          }}
        >
          {listings.map((listing) => (
            <button
              key={listing.id}
              onClick={() => onBook?.(listing.id)}
              className="group text-left bg-white hover:bg-[#FDFCFA] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8964A]"
            >
              <div className="relative h-32 sm:h-36 overflow-hidden">
                <img
                  src={listing.images[0] ?? meta.fallbackImage}
                  alt={listing.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  style={{ filter: "saturate(0.9)" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = meta.fallbackImage;
                  }}
                />
                {listing.featured && (
                  <span
                    className="absolute top-2 right-2 text-[8px] font-medium uppercase tracking-[0.15em] px-2 py-0.5"
                    style={{
                      background: "rgba(212,170,102,0.18)",
                      border: "1px solid rgba(212,170,102,0.4)",
                      color: "#D4AA66",
                    }}
                  >
                    Featured
                  </span>
                )}
              </div>

              <div className="px-3 py-3 sm:px-4 sm:py-3.5">
                <p className="font-['Cormorant_Garamond'] text-sm sm:text-base font-normal text-[#1C1A17] leading-tight truncate">
                  {listing.name}
                </p>
                <p className="flex items-center gap-1 text-[10px] text-[#A09890] font-light mt-0.5 truncate">
                  <MapPinIcon className="w-2.5 h-2.5 shrink-0 text-[#C4BFB5]" />
                  {listing.location}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-['Cormorant_Garamond'] text-sm sm:text-base font-normal text-[#B8964A]">
                    ₦{listing.pricePerNight.toLocaleString()}
                    <span className="font-sans text-[9px] text-[#C4BFB5] ml-0.5">
                      /night
                    </span>
                  </p>
                  {listing.rating > 0 && (
                    <p className="flex items-center gap-0.5 text-[10px] text-[#8A8478]">
                      <StarSolid className="w-2.5 h-2.5 text-[#B8964A]" />
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

/* ─────────────── Main section ─────────────── */

interface CategorySectionProps {
  onCategorySelect?: (category: CategoryKey) => void;
  onListingSelect?: (listingId: string) => void;
}

const CategorySection = ({
  onCategorySelect,
  onListingSelect,
}: CategorySectionProps) => {
  const allStats = useCategoryStats();
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(
    null,
  );
  const panelRef = useRef<HTMLDivElement>(null);

  const categories = CARD_ORDER.map(
    (key) => allStats.find((s) => s.key === key)!,
  ).filter(Boolean);

  const activeCategoryStats = categories.find((c) => c.key === activeCategory);
  const totalListings = categories.reduce((s, c) => s + c.count, 0);

  const ratedCategories = categories.filter((c) => c.topRating > 0);
  const avgRating =
    ratedCategories.length > 0
      ? (
          ratedCategories.reduce((s, c) => s + c.topRating, 0) /
          ratedCategories.length
        ).toFixed(1)
      : "—";

  const handleCardClick = (key: CategoryKey) => {
    if (activeCategory === key) {
      setActiveCategory(null);
    } else {
      setActiveCategory(key);
      onCategorySelect?.(key);
      setTimeout(() => {
        panelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 60);
    }
  };

  return (
    <section
      className="relative py-14 sm:py-20 md:py-24 px-4 sm:px-8 md:px-12"
      style={{ background: "#FAF8F4" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* ── Eyebrow ── */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-7 h-px bg-[#B8964A]" />
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#B8964A]">
            Curated Collection
          </span>
        </div>

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14">
          <div>
            <h2
              className="font-['Cormorant_Garamond'] font-light leading-[1.05] text-[#1C1A17]"
              style={{ fontSize: "clamp(34px, 6vw, 54px)" }}
            >
              Browse by{" "}
              <em style={{ fontStyle: "italic", color: "#B8964A" }}>
                Category
              </em>
            </h2>
            <p className="text-[#8A8478] text-sm font-light leading-relaxed mt-3 max-w-sm">
              From clifftop estates to skyline penthouses — each property
              handpicked for the discerning traveller.
            </p>
          </div>

          {/* Stats — scrolls horizontally on very small screens */}
          <div className="flex items-center gap-5 sm:gap-8 shrink-0 overflow-x-auto pb-1">
            <div className="text-left sm:text-right shrink-0">
              <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl font-light text-[#1C1A17] leading-none">
                {totalListings}
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#A09890] mt-1 whitespace-nowrap">
                Live properties
              </p>
            </div>
            <div className="w-px h-8 bg-[#DDD8CE] shrink-0" />
            <div className="text-left sm:text-right shrink-0">
              <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl font-light text-[#1C1A17] leading-none">
                {categories.filter((c) => c.count > 0).length}
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#A09890] mt-1 whitespace-nowrap">
                Categories
              </p>
            </div>
            <div className="w-px h-8 bg-[#DDD8CE] shrink-0" />
            <div className="text-left sm:text-right shrink-0">
              <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl font-light text-[#1C1A17] leading-none flex items-center gap-1">
                {avgRating}
                <StarSolid className="w-3.5 h-3.5 text-[#B8964A]" />
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#A09890] mt-1 whitespace-nowrap">
                Avg rating
              </p>
            </div>
          </div>
        </div>

        {/* ── Card grid ──
              Mobile  : 1 column, all cards full width
              sm (640): 2 columns, villa spans both
              lg (1024): 3 columns, villa spans 2
        ── */}
        <style>{`
          .cs-grid {
            display: grid;
            gap: 2px;
            grid-template-columns: 1fr;
            background: #E8E4DC;
            border: 1px solid #E8E4DC;
            border-radius: 2px;
          }
          @media (min-width: 640px) {
            .cs-grid { grid-template-columns: repeat(2, 1fr); }
            .cs-grid .cs-card-wide { grid-column: 1 / -1; }
          }
          @media (min-width: 1024px) {
            .cs-grid { grid-template-columns: repeat(3, 1fr); }
            .cs-grid .cs-card-wide { grid-column: span 2; }
          }
        `}</style>

        <div className="cs-grid">
          {categories.map((stats, i) => {
            const isWide = stats.key === "villa";
            return (
              <div key={stats.key} className={isWide ? "cs-card-wide" : ""}>
                <CategoryCard
                  stats={stats}
                  index={i}
                  isActive={activeCategory === stats.key}
                  isWide={isWide}
                  onClick={() => handleCardClick(stats.key)}
                />
              </div>
            );
          })}
        </div>

        {/* ── Expanded detail panel ── */}
        <div ref={panelRef} className={activeCategoryStats ? "mt-0.5" : ""}>
          {activeCategoryStats && (
            <CategoryDetail
              stats={activeCategoryStats}
              onClose={() => setActiveCategory(null)}
              onBook={(listingId) => onListingSelect?.(listingId)}
            />
          )}
        </div>

        {/* ── Footer ── */}
        <div className="mt-12 sm:mt-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <p className="text-[11px] text-[#C4BFB5] uppercase tracking-[0.1em] font-light leading-relaxed">
            All properties verified &amp; insured · Concierge available 24/7
          </p>
          <button className="group flex items-center gap-2.5 border border-[#B8964A] text-[#B8964A] text-[11px] font-medium uppercase tracking-[0.15em] px-5 py-2.5 sm:px-6 sm:py-3 hover:bg-[#B8964A] hover:text-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8964A] shrink-0">
            Browse all {totalListings} properties
            <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
