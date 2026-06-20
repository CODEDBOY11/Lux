import { useState, useEffect, useRef } from "react";
import { ListingsDB, type Listing } from "../../index";
import { ArrowRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid, MapPinIcon } from "@heroicons/react/24/solid";

/* ─────────────────────────────────────────
   Types & config
───────────────────────────────────────── */

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

const CARD_ORDER: CategoryKey[] = [
  "villa",
  "resort",
  "penthouse",
  "apartment",
  "boutique",
];

const OVERLAY =
  "linear-gradient(to top, rgba(12,10,8,0.92) 0%, rgba(12,10,8,0.3) 50%, rgba(12,10,8,0.05) 100%)";

/* ─────────────────────────────────────────
   DB hook
───────────────────────────────────────── */

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
    let alive = true;
    ListingsDB.all().then((all) => {
      if (!alive) return;
      const computed = (Object.keys(CATEGORY_META) as CategoryKey[]).map(
        (key) => {
          const listings = all.filter((l) => l.category === key);
          const meta = CATEGORY_META[key];
          const prices = listings.map((l) => l.pricePerNight);
          const avgPrice =
            prices.length > 0
              ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
              : 0;
          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
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
      alive = false;
    };
  }, []);

  return stats;
}

/* ─────────────────────────────────────────
   Mobile scroll card  (used inside horizontal strip)
───────────────────────────────────────── */

function MobileCard({
  stats,
  isActive,
  onClick,
}: {
  stats: CategoryStats;
  isActive: boolean;
  onClick: () => void;
}) {
  const { meta, minPrice, avgPrice, topRating, coverImage } = stats;
  const price = minPrice > 0 ? minPrice : avgPrice;

  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 overflow-hidden rounded-xl text-left focus:outline-none"
      style={{
        width: 220,
        height: 280,
        outline: isActive ? "2px solid #B8964A" : "none",
        outlineOffset: 2,
      }}
    >
      <img
        src={coverImage}
        alt={meta.label}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
        style={{ filter: "brightness(0.78) saturate(0.9)" }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = meta.fallbackImage;
        }}
      />
      <div className="absolute inset-0" style={{ background: OVERLAY }} />

      {/* Tag */}
      <div className="absolute top-3 left-3">
        <span
          className="text-[9px] font-medium uppercase tracking-[0.14em] px-2 py-0.5"
          style={{
            background: "rgba(212,170,102,0.18)",
            border: "1px solid rgba(212,170,102,0.45)",
            color: "#D4AA66",
            backdropFilter: "blur(4px)",
            borderRadius: 2,
          }}
        >
          {meta.tag}
        </span>
      </div>

      {/* Bottom info */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="font-['Cormorant_Garamond'] text-xl font-light text-white leading-tight mb-0.5">
          {meta.label}
        </p>
        <p className="text-white/50 text-[10px] font-light mb-3">
          {meta.tagline}
        </p>

        <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
          {price > 0 ? (
            <div>
              <p className="text-[8px] text-white/35 uppercase tracking-wider mb-0.5">
                From
              </p>
              <p className="font-['Cormorant_Garamond'] text-sm font-light text-[#D4AA66]">
                ₦{price.toLocaleString()}
                <span className="font-sans text-[9px] text-white/30 ml-0.5">
                  /night
                </span>
              </p>
            </div>
          ) : (
            <span className="text-white/25 text-[10px]">Coming soon</span>
          )}

          {topRating > 0 && (
            <div className="flex items-center gap-1">
              <StarSolid className="w-3 h-3 text-[#D4AA66]" />
              <span className="text-white text-xs font-['Cormorant_Garamond']">
                {topRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div
          className="absolute bottom-0 inset-x-0 h-0.5"
          style={{ background: "#B8964A" }}
        />
      )}
    </button>
  );
}

/* ─────────────────────────────────────────
   Desktop mosaic card
───────────────────────────────────────── */

function DesktopCard({
  stats,
  index,
  isActive,
  isWide,
  onClick,
}: {
  stats: CategoryStats;
  index: number;
  isActive: boolean;
  isWide: boolean;
  onClick: () => void;
}) {
  const { meta, count, minPrice, avgPrice, topRating, coverImage } = stats;
  const ref = useRef<HTMLButtonElement>(null);
  const price = minPrice > 0 ? minPrice : avgPrice;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          obs.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      aria-pressed={isActive}
      className="group relative overflow-hidden w-full h-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8964A]"
      style={{
        opacity: 0,
        transform: "translateY(18px)",
        transition: `opacity 0.5s ease ${index * 75}ms, transform 0.5s ease ${index * 75}ms`,
        outline: isActive ? "2px solid rgba(184,150,74,0.65)" : "none",
        outlineOffset: -2,
        minHeight: isWide ? 340 : 260,
      }}
    >
      <img
        src={coverImage}
        alt={meta.label}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        style={{ filter: "brightness(0.8) saturate(0.9)" }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = meta.fallbackImage;
        }}
      />
      <div className="absolute inset-0" style={{ background: OVERLAY }} />

      {/* Tag */}
      <div className="absolute top-4 left-4">
        <span
          className="text-[9px] font-medium uppercase tracking-[0.16em] px-2.5 py-1"
          style={{
            background: "rgba(212,170,102,0.15)",
            border: "1px solid rgba(212,170,102,0.4)",
            color: "#D4AA66",
            backdropFilter: "blur(6px)",
            borderRadius: 2,
          }}
        >
          {meta.tag}
        </span>
      </div>

      {/* Count */}
      {count > 0 && (
        <div className="absolute top-4 right-4">
          <span className="text-[10px] text-white/45 font-light">
            {count} {count === 1 ? "property" : "properties"}
          </span>
        </div>
      )}

      {/* Bottom */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3
          className="font-['Cormorant_Garamond'] font-light text-white leading-tight mb-0.5"
          style={{ fontSize: isWide ? "clamp(22px,2.4vw,30px)" : 20 }}
        >
          {meta.label}
        </h3>
        <p className="text-white/45 text-[11px] font-light">{meta.tagline}</p>

        {price > 0 && (
          <div className="flex items-center gap-5 mt-3.5 pt-3 border-t border-white/10">
            <div>
              <p className="text-[8px] text-white/30 uppercase tracking-wider mb-0.5">
                From
              </p>
              <p className="font-['Cormorant_Garamond'] text-base font-light text-[#D4AA66]">
                ₦{price.toLocaleString()}
                <span className="font-sans text-[10px] text-white/30 ml-0.5">
                  /night
                </span>
              </p>
            </div>
            {topRating > 0 && (
              <div>
                <p className="text-[8px] text-white/30 uppercase tracking-wider mb-0.5">
                  Rating
                </p>
                <p className="flex items-center gap-1 font-['Cormorant_Garamond'] text-base font-light text-white">
                  <StarSolid className="w-3 h-3 text-[#D4AA66]" />
                  {topRating.toFixed(1)}
                </p>
              </div>
            )}
            <div className="ml-auto">
              <div
                className="w-8 h-8 rounded-full border border-white/20 group-hover:border-[#D4AA66]/50 flex items-center justify-center transition-colors duration-300"
                aria-hidden
              >
                <ArrowRightIcon
                  className={`w-3.5 h-3.5 text-white/50 group-hover:text-[#D4AA66] transition-all duration-300 ${isActive ? "rotate-90" : ""}`}
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
    </button>
  );
}

/* ─────────────────────────────────────────
   Listing detail panel  (shared mobile + desktop)
───────────────────────────────────────── */

function CategoryDetail({
  stats,
  onClose,
  onBook,
}: {
  stats: CategoryStats;
  onClose: () => void;
  onBook?: (id: string) => void;
}) {
  const { meta, listings } = stats;

  return (
    <div
      className="border border-[#E8E4DC] overflow-hidden"
      style={{
        background: "#FFFFFF",
        borderRadius: 2,
        animation: "csIn 0.28s cubic-bezier(0.34,1.1,0.64,1)",
      }}
    >
      <style>{`@keyframes csIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#F0EDE6]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-px" style={{ background: "#B8964A" }} />
            <span
              className="text-[9px] font-medium uppercase tracking-[0.2em]"
              style={{ color: "#B8964A" }}
            >
              {meta.tag}
            </span>
          </div>
          <h3
            className="font-['Cormorant_Garamond'] text-lg font-light"
            style={{ color: "#1C1A17" }}
          >
            {meta.label}
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-150 shrink-0"
          style={{ borderColor: "#E8E4DC", color: "#A09890" }}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-light" style={{ color: "#A09890" }}>
            No {meta.label.toLowerCase()} available right now.
          </p>
          <p className="text-xs mt-1" style={{ color: "#C4BFB5" }}>
            Check back soon.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile + tablet: horizontal scroll */}
          <div
            className="lg:hidden flex gap-3 overflow-x-auto px-4 py-4"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {listings.map((listing) => (
              <button
                key={listing.id}
                onClick={() => onBook?.(listing.id)}
                className="flex-shrink-0 text-left rounded-lg overflow-hidden border focus:outline-none"
                style={{
                  width: 180,
                  borderColor: "#F0EDE6",
                  scrollSnapAlign: "start",
                }}
              >
                <div className="relative h-28 overflow-hidden">
                  <img
                    src={listing.images[0] ?? meta.fallbackImage}
                    alt={listing.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    style={{ filter: "saturate(0.9)" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = meta.fallbackImage;
                    }}
                  />
                  {listing.featured && (
                    <span
                      className="absolute top-1.5 right-1.5 text-[8px] font-medium uppercase tracking-wider px-1.5 py-0.5"
                      style={{
                        background: "rgba(212,170,102,0.18)",
                        border: "1px solid rgba(212,170,102,0.4)",
                        color: "#D4AA66",
                        borderRadius: 2,
                      }}
                    >
                      Featured
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p
                    className="font-['Cormorant_Garamond'] text-sm font-normal truncate"
                    style={{ color: "#1C1A17" }}
                  >
                    {listing.name}
                  </p>
                  <p
                    className="flex items-center gap-1 text-[10px] font-light mt-0.5 truncate"
                    style={{ color: "#A09890" }}
                  >
                    <MapPinIcon
                      className="w-2.5 h-2.5 shrink-0"
                      style={{ color: "#C4BFB5" }}
                    />
                    {listing.location}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p
                      className="font-['Cormorant_Garamond'] text-sm"
                      style={{ color: "#B8964A" }}
                    >
                      ₦{listing.pricePerNight.toLocaleString()}
                      <span
                        className="font-sans text-[9px] ml-0.5"
                        style={{ color: "#C4BFB5" }}
                      >
                        /night
                      </span>
                    </p>
                    {listing.rating > 0 && (
                      <span
                        className="flex items-center gap-0.5 text-[10px]"
                        style={{ color: "#8A8478" }}
                      >
                        <StarSolid
                          className="w-2.5 h-2.5"
                          style={{ color: "#B8964A" }}
                        />
                        {listing.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Desktop: grid */}
          <div
            className="hidden lg:grid gap-px"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              background: "#F0EDE6",
            }}
          >
            {listings.map((listing) => (
              <button
                key={listing.id}
                onClick={() => onBook?.(listing.id)}
                className="group text-left bg-white hover:bg-[#FDFCFA] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8964A]"
              >
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={listing.images[0] ?? meta.fallbackImage}
                    alt={listing.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    style={{ filter: "saturate(0.9)" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = meta.fallbackImage;
                    }}
                  />
                  {listing.featured && (
                    <span
                      className="absolute top-2 right-2 text-[8px] font-medium uppercase tracking-wider px-2 py-0.5"
                      style={{
                        background: "rgba(212,170,102,0.18)",
                        border: "1px solid rgba(212,170,102,0.4)",
                        color: "#D4AA66",
                        borderRadius: 2,
                      }}
                    >
                      Featured
                    </span>
                  )}
                </div>
                <div className="px-4 py-3.5">
                  <p
                    className="font-['Cormorant_Garamond'] text-base font-normal truncate"
                    style={{ color: "#1C1A17" }}
                  >
                    {listing.name}
                  </p>
                  <p
                    className="flex items-center gap-1 text-[11px] font-light mt-0.5 truncate"
                    style={{ color: "#A09890" }}
                  >
                    <MapPinIcon
                      className="w-2.5 h-2.5 shrink-0"
                      style={{ color: "#C4BFB5" }}
                    />
                    {listing.location}
                  </p>
                  <div className="flex items-center justify-between mt-2.5">
                    <p
                      className="font-['Cormorant_Garamond'] text-base"
                      style={{ color: "#B8964A" }}
                    >
                      ₦{listing.pricePerNight.toLocaleString()}
                      <span
                        className="font-sans text-[9px] ml-0.5"
                        style={{ color: "#C4BFB5" }}
                      >
                        /night
                      </span>
                    </p>
                    {listing.rating > 0 && (
                      <span
                        className="flex items-center gap-1 text-[11px]"
                        style={{ color: "#8A8478" }}
                      >
                        <StarSolid
                          className="w-2.5 h-2.5"
                          style={{ color: "#B8964A" }}
                        />
                        {listing.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main export
───────────────────────────────────────── */

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
  const ratedCats = categories.filter((c) => c.topRating > 0);
  const avgRating =
    ratedCats.length > 0
      ? (
          ratedCats.reduce((s, c) => s + c.topRating, 0) / ratedCats.length
        ).toFixed(1)
      : "—";

  const handleClick = (key: CategoryKey) => {
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
      className="relative py-12 sm:py-20 md:py-24"
      style={{ background: "#FAF8F4" }}
    >
      {/* ── Scoped styles ── */}
      <style>{`
        .cs-desktop-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: auto auto;
          gap: 2px;
          background: #E8E4DC;
          border: 1px solid #E8E4DC;
          border-radius: 2px;
        }
        .cs-desktop-grid .cs-wide {
          grid-column: span 2;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12">
        {/* ── Eyebrow ── */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-px" style={{ background: "#B8964A" }} />
          <span
            className="text-[10px] font-medium uppercase tracking-[0.22em]"
            style={{ color: "#B8964A" }}
          >
            Curated Collection
          </span>
        </div>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 sm:mb-12">
          <div>
            <h2
              className="font-['Cormorant_Garamond'] font-light leading-[1.05]"
              style={{ fontSize: "clamp(32px, 6vw, 52px)", color: "#1C1A17" }}
            >
              Browse by{" "}
              <em style={{ fontStyle: "italic", color: "#B8964A" }}>
                Category
              </em>
            </h2>
            <p
              className="text-sm font-light leading-relaxed mt-3 max-w-xs"
              style={{ color: "#8A8478" }}
            >
              From clifftop estates to skyline penthouses — each property
              handpicked for the discerning traveller.
            </p>
          </div>

          {/* Stats strip */}
          <div className="flex items-center gap-5 sm:gap-7 shrink-0">
            {[
              { value: String(totalListings), label: "Properties" },
              {
                value: String(categories.filter((c) => c.count > 0).length),
                label: "Categories",
              },
              { value: avgRating, label: "Avg rating", star: true },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-5 sm:gap-7">
                {i > 0 && (
                  <div
                    className="w-px h-7 flex-shrink-0"
                    style={{ background: "#DDD8CE" }}
                  />
                )}
                <div>
                  <p
                    className="font-['Cormorant_Garamond'] font-light leading-none flex items-center gap-1"
                    style={{ fontSize: 26, color: "#1C1A17" }}
                  >
                    {s.value}
                    {s.star && (
                      <StarSolid
                        className="w-3.5 h-3.5"
                        style={{ color: "#B8964A" }}
                      />
                    )}
                  </p>
                  <p
                    className="text-[10px] uppercase tracking-[0.12em] mt-1 whitespace-nowrap"
                    style={{ color: "#A09890" }}
                  >
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            MOBILE + TABLET  — horizontal scroll strip (below lg)
        ══════════════════════════════════════ */}
        <div className="lg:hidden">
          <div
            className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {categories.map((s) => (
              <div key={s.key} style={{ scrollSnapAlign: "start" }}>
                <MobileCard
                  stats={s}
                  isActive={activeCategory === s.key}
                  onClick={() => handleClick(s.key)}
                />
              </div>
            ))}
          </div>

          {/* Dot indicator */}
          <div className="flex justify-center gap-1.5 mt-3">
            {categories.map((s) => (
              <button
                key={s.key}
                onClick={() => handleClick(s.key)}
                aria-label={s.meta.label}
                className="transition-all duration-200"
                style={{
                  width: activeCategory === s.key ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: activeCategory === s.key ? "#B8964A" : "#DDD8CE",
                }}
              />
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            DESKTOP  ≥ 1024px  — mosaic grid
        ══════════════════════════════════════ */}
        <div className="hidden lg:block cs-desktop-grid">
          {categories.map((s, i) => (
            <div key={s.key} className={s.key === "villa" ? "cs-wide" : ""}>
              <DesktopCard
                stats={s}
                index={i}
                isActive={activeCategory === s.key}
                isWide={s.key === "villa"}
                onClick={() => handleClick(s.key)}
              />
            </div>
          ))}
        </div>

        {/* ── Detail panel (both breakpoints) ── */}
        <div ref={panelRef} className={activeCategoryStats ? "mt-0.5" : ""}>
          {activeCategoryStats && (
            <CategoryDetail
              stats={activeCategoryStats}
              onClose={() => setActiveCategory(null)}
              onBook={(id) => onListingSelect?.(id)}
            />
          )}
        </div>

        {/* ── Footer ── */}
        <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p
            className="text-[11px] uppercase tracking-[0.1em] font-light leading-relaxed"
            style={{ color: "#C4BFB5" }}
          >
            All properties verified &amp; insured · Concierge available 24/7
          </p>
          <button
            className="group flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] px-5 py-2.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8964A] shrink-0"
            style={{
              border: "1px solid #B8964A",
              color: "#B8964A",
              borderRadius: 2,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#B8964A";
              (e.currentTarget as HTMLButtonElement).style.color = "#FAF8F4";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#B8964A";
            }}
          >
            Browse all {totalListings} properties
            <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
