import { useState, useEffect, useRef } from "react";
import { ListingsDB, type Listing } from "../../index";
import { ArrowRightIcon, XMarkIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

type CategoryKey = Listing["category"];

/* ─── Tokens ──────────────────────────────────────────── */
const css = `
  .cat-section {
    --c-bg: #F3F1ED;
    --c-white: #FFFFFF;
    --c-border: #E8E4DD;
    --c-text: #1A1714;
    --c-sub: #6A6359;
    --c-muted: #8A8278;
    --c-gold: #C9A96E;
    --c-gold-dim: rgba(201,169,110,0.10);
    --c-gold-border: rgba(201,169,110,0.25);
    --c-gold-hover: #B8935A;
    color-scheme: light;
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    background: var(--c-bg);
  }
  @media (prefers-color-scheme: dark) {
    .cat-section:not([data-theme="light"]) {
      --c-bg: #111009;
      --c-white: #1A1714;
      --c-border: rgba(255,255,255,0.07);
      --c-text: #F0EDE8;
      --c-sub: #A8A09A;
      --c-muted: #706860;
      color-scheme: dark;
    }
  }
  [data-theme="dark"] .cat-section {
    --c-bg: #111009;
    --c-white: #1A1714;
    --c-border: rgba(255,255,255,0.07);
    --c-text: #F0EDE8;
    --c-sub: #A8A09A;
    --c-muted: #706860;
    color-scheme: dark;
  }
  .cat-mosaic {
    display: grid;
    gap: 14px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 640px) {
    .cat-mosaic {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: 1024px) {
    .cat-mosaic {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(2, 220px);
    }
    .cat-card-featured {
      grid-column: 1 / 2;
      grid-row: 1 / 3;
    }
    .cat-card-wide {
      grid-column: 2 / 4;
      grid-row: 1 / 2;
    }
  }
  .cat-card {
    position: relative; overflow: hidden;
    border-radius: 14px; cursor: pointer;
    min-height: 190px;
    border: 1px solid var(--c-border);
    transition: transform .28s, box-shadow .28s;
  }
  .cat-card:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(0,0,0,.13); }
  .cat-card:hover .cat-card-img { transform: scale(1.06); }
  .cat-card-img {
    position: absolute; inset: 0;
    width: 100%; height: 100%; object-fit: cover;
    transition: transform .65s;
  }
  .cat-card-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(10,8,6,.82) 0%, rgba(10,8,6,.18) 55%, transparent 80%);
    transition: opacity .25s;
  }
  .cat-card:hover .cat-card-overlay { opacity: .88; }
  .cat-card-body {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 20px 20px 18px;
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 10;
  }
  .cat-pill-tag {
    font-size: 9px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; padding: 3px 10px; border-radius: 99px;
    background: var(--c-gold); color: #1A1714;
    margin-bottom: 6px; display: inline-block;
  }
  .cat-arrow-btn {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    background: rgba(255,255,255,.15); backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,.28);
    display: flex; align-items: center; justify-content: center;
    transition: background .18s, border-color .18s;
  }
  .cat-card:hover .cat-arrow-btn {
    background: var(--c-gold); border-color: var(--c-gold);
  }
  .cat-detail-overlay {
    position: fixed; inset: 0; z-index: 50;
    display: flex; align-items: flex-end; justify-content: center;
  }
  .cat-detail-panel {
    position: relative; z-index: 10;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: 18px 18px 0 0;
    width: 100%; max-height: 90dvh;
    overflow: hidden; display: flex; flex-direction: column;
  }
  @media (min-width: 640px) {
    .cat-detail-panel {
      max-width: 620px;
      margin-bottom: 16px;
      border-radius: 18px;
    }
  }
  .cat-listing-item {
    display: flex; gap: 12px; padding: 14px 0;
    border-bottom: 1px solid var(--c-border);
    cursor: pointer;
    transition: background .15s;
  }
  .cat-listing-item:hover { background: var(--c-bg); border-radius: 8px; padding: 14px 8px; margin: 0 -8px; }
  .cat-listing-item:last-child { border-bottom: none; }
  .cat-stats-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0;
    border-top: 1px solid var(--c-border);
    margin-top: 32px;
  }
  @media (min-width: 480px) {
    .cat-stats-row { grid-template-columns: repeat(4, 1fr); }
  }
  .cat-stat-item {
    text-align: center; padding: 22px 12px;
  }
  .cat-stat-item:not(:last-child) { border-right: 1px solid var(--c-border); }
  @keyframes cat-fadeUp { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
`;

const CATEGORY_META: Record<CategoryKey, {
  label: string; tagline: string; tag: string; fallbackImage: string;
}> = {
  villa: {
    label: "Luxury Villas", tagline: "Private gated estates with full staff",
    tag: "Most Popular",
    fallbackImage: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=900&q=80",
  },
  apartment: {
    label: "City Apartments", tagline: "Prime addresses in Lagos & Abuja",
    tag: "City Escapes",
    fallbackImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
  },
  resort: {
    label: "Resorts", tagline: "Full-service retreat experiences",
    tag: "Top Rated",
    fallbackImage: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80",
  },
  boutique: {
    label: "Boutique Hotels", tagline: "Curated stays with real character",
    tag: "Hidden Gems",
    fallbackImage: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
  },
  penthouse: {
    label: "Penthouses", tagline: "Above the city, above everything",
    tag: "Ultra Luxury",
    fallbackImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  },
};

const CARD_ORDER: CategoryKey[] = ["villa", "resort", "penthouse", "apartment", "boutique"];

interface CategoryCardProps {
  category: CategoryKey;
  image?: string;
  count: number;
  variant?: "featured" | "wide" | "normal";
  index: number;
  onClick: () => void;
}

const CategoryCard = ({ category, image, count, variant = "normal", index, onClick }: CategoryCardProps) => {
  const meta = CATEGORY_META[category];
  return (
    <div
      className={`cat-card${variant === "featured" ? " cat-card-featured" : ""}${variant === "wide" ? " cat-card-wide" : ""}`}
      style={{ animation: `cat-fadeUp .42s ease ${index * 60}ms both` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Browse ${meta.label}`}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
    >
      <img
        className="cat-card-img"
        src={image || meta.fallbackImage}
        alt={meta.label}
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).src = meta.fallbackImage; }}
      />
      <div className="cat-card-overlay" />
      <div className="cat-card-body">
        <div style={{ minWidth: 0 }}>
          <div className="cat-pill-tag">{meta.tag}</div>
          <h3 style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: variant === "featured" ? "clamp(22px,4vw,28px)" : "clamp(18px,3vw,22px)",
            fontWeight: 600, color: "#fff", lineHeight: 1.15, marginBottom: 4,
          }}>{meta.label}</h3>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,.65)", fontWeight: 300 }}>
            {count > 0 ? `${count} propert${count !== 1 ? "ies" : "y"}` : meta.tagline}
          </p>
        </div>
        <div className="cat-arrow-btn">
          <ArrowRightIcon style={{ width: 14, height: 14, color: "#fff" }} />
        </div>
      </div>
    </div>
  );
};

export default function CategorySection({
  onCategorySelect,
  onListingSelect,
}: {
  onCategorySelect?: (category: CategoryKey) => void;
  onListingSelect?: (listing: Listing) => void;
}) {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    ListingsDB.all()
      .then((data) => { if (!cancelled) setAllListings(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeCategory) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActiveCategory(null); };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [activeCategory]);

  const countFor = (cat: CategoryKey) => allListings.filter((l) => l.category === cat).length;
  const listingsFor = (cat: CategoryKey) =>
    allListings.filter((l) => l.category === cat).slice(0, 10);

  const handleCardClick = (cat: CategoryKey) => {
    setActiveCategory(cat);
    onCategorySelect?.(cat);
  };

  const getVariant = (i: number): "featured" | "wide" | "normal" => {
    if (i === 0) return "featured";
    if (i === 1) return "wide";
    return "normal";
  };

  const activeMeta = activeCategory ? CATEGORY_META[activeCategory] : null;
  const activeListings = activeCategory ? listingsFor(activeCategory) : [];

  return (
    <section className="cat-section">
      <style>{css}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(48px,7vw,72px) max(16px,env(safe-area-inset-left,0px))" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 20, height: 1, background: "var(--c-gold)" }} />
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: ".26em",
              color: "var(--c-gold)", textTransform: "uppercase",
            }}>Browse by Type</p>
          </div>
          <h2 style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "clamp(26px,5vw,38px)",
            fontWeight: 500, color: "var(--c-text)",
            lineHeight: 1.1, letterSpacing: "-.01em", marginBottom: 8,
          }}>
            Find Your Kind of Stay
          </h2>
          <p style={{ color: "var(--c-sub)", fontSize: 13, lineHeight: 1.65, maxWidth: 400 }}>
            From private villas in Lekki to boutique hotels in Abuja — curated collections for every occasion.
          </p>
        </div>

        {/* Mosaic grid */}
        <div className="cat-mosaic">
          {CARD_ORDER.map((cat, i) => (
            <CategoryCard
              key={cat}
              category={cat}
              count={countFor(cat)}
              variant={getVariant(i)}
              index={i}
              onClick={() => handleCardClick(cat)}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="cat-stats-row">
          {[
            { value: "500+", label: "Verified Stays" },
            { value: "5", label: "Property Types" },
            { value: "₦0", label: "Hidden Fees" },
            { value: "24/7", label: "Nigerian Support" },
          ].map((s) => (
            <div key={s.label} className="cat-stat-item">
              <p style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "clamp(24px,4.5vw,32px)", fontWeight: 600,
                color: "var(--c-gold)", lineHeight: 1, marginBottom: 5,
              }}>{s.value}</p>
              <p style={{
                fontSize: 9, fontWeight: 600, letterSpacing: ".18em",
                textTransform: "uppercase", color: "var(--c-muted)",
              }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {activeCategory && activeMeta && (
        <div className="cat-detail-overlay" onClick={() => setActiveCategory(null)}>
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(26,23,20,.55)", backdropFilter: "blur(6px)",
          }} />
          <div
            ref={panelRef}
            tabIndex={-1}
            className="cat-detail-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ outline: "none" }}
          >
            {/* Panel header image */}
            <div style={{ position: "relative", height: 180, flexShrink: 0, overflow: "hidden" }}>
              <img
                src={activeMeta.fallbackImage}
                alt={activeMeta.label}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(10,8,6,.75), transparent 60%)",
              }} />
              <div style={{ position: "absolute", bottom: 18, left: 20, right: 50 }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: ".2em",
                  textTransform: "uppercase", color: "var(--c-gold)",
                  display: "block", marginBottom: 4,
                }}>{activeMeta.tag}</span>
                <h3 style={{
                  fontFamily: "Cormorant Garamond, serif", fontSize: 24,
                  fontWeight: 600, color: "#fff", lineHeight: 1.1,
                }}>{activeMeta.label}</h3>
              </div>
              <button
                onClick={() => setActiveCategory(null)}
                aria-label="Close"
                style={{
                  position: "absolute", top: 14, right: 14,
                  width: 34, height: 34, borderRadius: "50%",
                  background: "rgba(255,255,255,.9)", backdropFilter: "blur(6px)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <XMarkIcon style={{ width: 15, height: 15, color: "#1A1714" }} />
              </button>
            </div>

            {/* Listings */}
            <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px 24px" }}>
              {activeListings.length === 0 ? (
                <p style={{ color: "var(--c-sub)", fontSize: 13, textAlign: "center", padding: "32px 0" }}>
                  No properties in this category yet. Check back soon.
                </p>
              ) : (
                activeListings.map((l) => (
                  <div
                    key={l.id}
                    className="cat-listing-item"
                    onClick={() => { setActiveCategory(null); onListingSelect?.(l); }}
                  >
                    <img
                      src={(l as any).thumbnail || activeMeta.fallbackImage}
                      alt={l.name}
                      loading="lazy"
                      style={{
                        width: 72, height: 60, borderRadius: 9, objectFit: "cover", flexShrink: 0,
                        border: "1px solid var(--c-border)",
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).src = activeMeta.fallbackImage; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <h4 style={{
                          fontFamily: "Cormorant Garamond, serif", fontSize: 15, fontWeight: 600,
                          color: "var(--c-text)", lineHeight: 1.2, marginBottom: 3,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          flex: 1, minWidth: 0,
                        }}>{l.name}</h4>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          background: "rgba(34,120,70,0.08)", border: "1px solid rgba(34,120,70,0.18)",
                          color: "#1a7040", borderRadius: 99, padding: "2px 7px",
                          fontSize: 8, fontWeight: 700, flexShrink: 0,
                        }}>
                          ✓ Verified
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                        <MapPinIcon style={{ width: 10, height: 10, color: "var(--c-gold)", flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "var(--c-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.location}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{
                          fontFamily: "Cormorant Garamond, serif",
                          fontSize: 15, fontWeight: 700, color: "var(--c-text)",
                        }}>₦{l.pricePerNight.toLocaleString()}<span style={{ fontSize: 10, fontWeight: 400, color: "var(--c-muted)" }}>/night</span></span>
                        {l.rating > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <StarSolid style={{ width: 10, height: 10, color: "var(--c-gold)" }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text)" }}>{l.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}