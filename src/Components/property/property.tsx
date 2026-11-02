import { useState, useEffect, useRef, useCallback } from "react";
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  HeartIcon,
  MapPinIcon,
  ShieldCheckIcon,
  WifiIcon,
  TvIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolid,
  StarIcon as StarSolid,
  FireIcon,
} from "@heroicons/react/24/solid";
import { ListingsDB, type Listing } from "../../index";

/* ─── Tokens ─────────────────────────────────────────── */
const css = `
  .prop-section {
    --p-bg: #F8F7F4;
    --p-white: #FFFFFF;
    --p-border: #E8E4DD;
    --p-text: #1A1714;
    --p-sub: #6A6359;
    --p-muted: #8A8278;
    --p-gold: #C9A96E;
    --p-gold-dim: rgba(201,169,110,0.10);
    --p-gold-border: rgba(201,169,110,0.25);
    --p-gold-hover: #B8935A;
    color-scheme: light;
    background: var(--p-bg);
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    .prop-section:not([data-theme="light"]) {
      --p-bg: #141210;
      --p-white: #1E1B18;
      --p-border: rgba(255,255,255,0.08);
      --p-text: #F0EDE8;
      --p-sub: #A8A09A;
      --p-muted: #706860;
      color-scheme: dark;
    }
  }
  [data-theme="dark"] .prop-section {
    --p-bg: #141210;
    --p-white: #1E1B18;
    --p-border: rgba(255,255,255,0.08);
    --p-text: #F0EDE8;
    --p-sub: #A8A09A;
    --p-muted: #706860;
    color-scheme: dark;
  }
  .prop-card {
    background: var(--p-white);
    border: 1px solid var(--p-border);
    border-radius: 14px;
    overflow: hidden;
    display: flex; flex-direction: column;
    transition: border-color .22s, box-shadow .22s, transform .22s;
    cursor: pointer;
  }
  .prop-card:hover {
    border-color: var(--p-gold-border);
    box-shadow: 0 14px 44px rgba(0,0,0,0.10);
    transform: translateY(-3px);
  }
  .prop-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 520px) { .prop-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 900px) { .prop-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 1200px) { .prop-grid { grid-template-columns: repeat(4, 1fr); } }
  .prop-pill {
    border-radius: 99px; padding: 7px 16px; font-size: 12px; font-weight: 500;
    cursor: pointer; border: 1px solid var(--p-border); background: var(--p-white);
    color: var(--p-sub); transition: all .18s; white-space: nowrap;
    font-family: inherit;
  }
  .prop-pill:hover, .prop-pill.active {
    background: var(--p-gold-dim);
    border-color: var(--p-gold-border);
    color: var(--p-gold);
  }
  .prop-pill.active { font-weight: 700; }
  .prop-wishlist-btn {
    position: absolute; top: 10px; right: 10px;
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,0.9); backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,.5);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background .18s, transform .15s;
    z-index: 2;
  }
  .prop-wishlist-btn:hover { background: #fff; transform: scale(1.1); }
  .prop-skeleton { animation: prop-pulse 1.5s ease infinite; }
  @keyframes prop-pulse { 0%,100%{opacity:1;} 50%{opacity:.55;} }
  @keyframes prop-fadeUp { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
  .prop-sort-select {
    background: var(--p-white); border: 1px solid var(--p-border);
    color: var(--p-sub); font-size: 12px; font-family: inherit;
    padding: 7px 12px; border-radius: 99px; cursor: pointer; outline: none;
    transition: border-color .18s;
  }
  .prop-sort-select:focus { border-color: var(--p-gold); }
  .prop-verified-badge {
    display: inline-flex; align-items: center; gap: 4px;
    background: rgba(34,120,70,0.09); border: 1px solid rgba(34,120,70,0.2);
    color: #1a7040; border-radius: 99px; padding: 2px 8px;
    font-size: 9px; font-weight: 700; flex-shrink: 0;
  }
  .prop-auth-overlay {
    position: fixed; inset: 0; z-index: 50;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .prop-load-more-btn {
    background: var(--p-white); color: var(--p-text);
    border: 1.5px solid var(--p-border); font-family: inherit;
    font-size: 13px; font-weight: 600; padding: 12px 32px;
    border-radius: 99px; cursor: pointer;
    transition: border-color .18s, background .18s;
  }
  .prop-load-more-btn:hover { border-color: var(--p-gold); background: var(--p-gold-dim); }
`;

type SortKey = "featured" | "price_asc" | "price_desc" | "rating";

const DEFAULT_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <WifiIcon style={{ width: 12, height: 12 }} />,
  pool: <SparklesIcon style={{ width: 12, height: 12 }} />,
  tv: <TvIcon style={{ width: 12, height: 12 }} />,
};
const AMENITY_LABELS: Record<string, string> = {
  wifi: "WiFi", pool: "Pool", tv: "Smart TV",
  gym: "Gym", kitchen: "Kitchen", parking: "Parking",
  ac: "AC", generator: "Generator",
};

const CATEGORIES = [
  { key: "all", label: "All Stays" },
  { key: "villa", label: "Villas" },
  { key: "apartment", label: "Apartments" },
  { key: "penthouse", label: "Penthouses" },
  { key: "boutique", label: "Boutique Hotels" },
  { key: "resort", label: "Resorts" },
];

export default function FeaturedProperties({
  onBook,
  onViewAll,
  onLogin,
  onSignup,
  initialLimit = 8,
  loadMoreStep = 4,
}: {
  onBook?: (l: Listing) => void;
  onViewAll?: () => void;
  onLogin?: () => void;
  onSignup?: () => void;
  initialLimit?: number;
  loadMoreStep?: number;
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const [limit, setLimit] = useState(initialLimit);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hovCard, setHovCard] = useState<string | null>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false);
    ListingsDB.all()
      .then((data) => { if (!cancelled) { setListings(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  // Scroll active pill into view
  useEffect(() => {
    const active = pillsRef.current?.querySelector(".prop-pill.active") as HTMLElement | null;
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [category]);

  const filtered = listings
    .filter((l) => category === "all" || l.category === category)
    .sort((a, b) => {
      if (sort === "price_asc") return a.pricePerNight - b.pricePerNight;
      if (sort === "price_desc") return b.pricePerNight - a.pricePerNight;
      if (sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      // featured: pinned first, then by rating
      const fa = a.featured ? 1 : 0, fb = b.featured ? 1 : 0;
      if (fb !== fa) return fb - fa;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

  const visible = filtered.slice(0, limit);
  const hasMore = filtered.length > limit;

  const toggleWishlist = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBook = useCallback((l: Listing, e: React.MouseEvent) => {
    e.stopPropagation();
    onBook?.(l);
  }, [onBook]);

  const SkeletonCard = () => (
    <div className="prop-card prop-skeleton" style={{ border: "1px solid var(--p-border)" }}>
      <div style={{ height: 200, background: "var(--p-bg)" }} />
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        {[70, 45, 90, 55].map((w) => (
          <div key={w} style={{ height: 10, background: "var(--p-bg)", borderRadius: 99, width: `${w}%` }} />
        ))}
      </div>
    </div>
  );

  return (
    <section className="prop-section">
      <style>{css}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(48px,7vw,72px) max(16px,env(safe-area-inset-left,0px))" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 20, height: 1, background: "var(--p-gold)" }} />
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".26em", color: "var(--p-gold)", textTransform: "uppercase" }}>
                Curated Stays
              </p>
            </div>
            <h2 style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "clamp(26px, 5vw, 38px)",
              fontWeight: 500, color: "var(--p-text)",
              lineHeight: 1.1, letterSpacing: "-.01em",
            }}>
              Featured Properties
            </h2>
            <p style={{ color: "var(--p-sub)", fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
              Every listing inspected and verified by our team before it goes live.
            </p>
          </div>
          <button
            onClick={onViewAll}
            style={{
              background: "none", border: "1.5px solid var(--p-border)",
              color: "var(--p-sub)", fontSize: 12, fontWeight: 600,
              padding: "9px 20px", borderRadius: 99, cursor: "pointer",
              transition: "all .18s", fontFamily: "inherit", whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--p-gold)";
              (e.currentTarget as HTMLElement).style.color = "var(--p-gold)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--p-border)";
              (e.currentTarget as HTMLElement).style.color = "var(--p-sub)";
            }}
          >
            View All →
          </button>
        </div>

        {/* Filters row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          {/* Category pills */}
          <div
            ref={pillsRef}
            style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2, flex: 1, scrollbarWidth: "none" }}
          >
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                className={`prop-pill${category === c.key ? " active" : ""}`}
                onClick={() => { setCategory(c.key); setLimit(initialLimit); }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <AdjustmentsHorizontalIcon style={{ width: 14, height: 14, color: "var(--p-muted)" }} />
            <select
              className="prop-sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort properties"
            >
              <option value="featured">Featured first</option>
              <option value="rating">Highest rated</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div style={{
            textAlign: "center", padding: "48px 24px",
            background: "var(--p-white)", borderRadius: 14,
            border: "1px solid var(--p-border)",
          }}>
            <p style={{ color: "var(--p-sub)", fontSize: 14, marginBottom: 14 }}>Couldn't load properties right now.</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "var(--p-gold)", color: "#fff", border: "none",
                fontSize: 13, fontWeight: 700, padding: "10px 24px",
                borderRadius: 9, cursor: "pointer", fontFamily: "inherit",
              }}
            >Try Again</button>
          </div>
        )}

        {/* Grid */}
        {!error && (
          <div className="prop-grid">
            {loading
              ? Array.from({ length: initialLimit }).map((_, i) => <SkeletonCard key={i} />)
              : visible.length === 0
                ? (
                  <div style={{
                    gridColumn: "1/-1", textAlign: "center", padding: "52px 24px",
                    background: "var(--p-white)", borderRadius: 14,
                    border: "1px solid var(--p-border)",
                  }}>
                    <p style={{ color: "var(--p-sub)", fontSize: 14 }}>
                      No properties in this category yet. Check back soon.
                    </p>
                  </div>
                )
                : visible.map((l, i) => {
                  const isWished = wishlist.has(l.id);
                  const isHov = hovCard === l.id;
                  return (
                    <div
                      key={l.id}
                      className="prop-card"
                      style={{ animation: `prop-fadeUp .42s ease ${i * 45}ms both` }}
                      onMouseEnter={() => setHovCard(l.id)}
                      onMouseLeave={() => setHovCard(null)}
                      onClick={() => onBook?.(l)}
                    >
                      {/* Image */}
                      <div style={{ position: "relative", height: 200, overflow: "hidden", flexShrink: 0 }}>
                        <img
                          src={l.images[0] || DEFAULT_PROPERTY_IMAGE}
                          alt={l.name}
                          loading="lazy"
                          style={{
                            width: "100%", height: "100%", objectFit: "cover",
                            transition: "transform .55s",
                            transform: isHov ? "scale(1.05)" : "scale(1)",
                          }}
                          onError={(e) => {
                            const image = e.currentTarget;
                            if (image.src !== DEFAULT_PROPERTY_IMAGE) {
                              image.src = DEFAULT_PROPERTY_IMAGE;
                            } else {
                              image.style.visibility = "hidden";
                            }
                          }}
                        />
                        <div style={{
                          position: "absolute", inset: 0,
                          background: "linear-gradient(to top, rgba(26,23,20,.45) 0%, transparent 55%)",
                        }} />

                        {/* Category badge */}
                        <span style={{
                          position: "absolute", top: 10, left: 10,
                          background: "rgba(255,255,255,.92)", backdropFilter: "blur(8px)",
                          color: "var(--p-text)", fontSize: 9, fontWeight: 700,
                          letterSpacing: ".18em", textTransform: "uppercase",
                          padding: "3px 10px", borderRadius: 99,
                          border: "1px solid rgba(255,255,255,.5)",
                        }}>{l.category}</span>

                        {/* Featured badge */}
                        {(l as any).featured && (
                          <span style={{
                            position: "absolute", bottom: 10, left: 10,
                            background: "var(--p-gold)", color: "#fff",
                            fontSize: 9, fontWeight: 800, letterSpacing: ".14em",
                            textTransform: "uppercase", padding: "3px 10px", borderRadius: 99,
                            display: "flex", alignItems: "center", gap: 4,
                          }}>
                            <FireIcon style={{ width: 9, height: 9 }} /> Featured
                          </span>
                        )}

                        {/* Wishlist */}
                        <button
                          className="prop-wishlist-btn"
                          onClick={(e) => toggleWishlist(l.id, e)}
                          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          {isWished
                            ? <HeartSolid style={{ width: 15, height: 15, color: "#E34040" }} />
                            : <HeartIcon style={{ width: 15, height: 15, color: "var(--p-sub)" }} />
                          }
                        </button>
                      </div>

                      {/* Body */}
                      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                          <h3 style={{
                            fontFamily: "Cormorant Garamond, serif",
                            fontSize: 17, fontWeight: 600, color: "var(--p-text)",
                            lineHeight: 1.2, flex: 1, minWidth: 0,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>{l.name}</h3>
                          <span className="prop-verified-badge">
                            <ShieldCheckIcon style={{ width: 9, height: 9 }} /> Verified
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
                          <MapPinIcon style={{ width: 11, height: 11, color: "var(--p-gold)", flexShrink: 0 }} />
                          <span style={{
                            fontSize: 12, color: "var(--p-muted)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>{l.location}</span>
                        </div>

                        {/* Amenities */}
                        {(l as any).amenities && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                            {((l as any).amenities as string[]).slice(0, 4).map((a) => (
                              <span key={a} style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                fontSize: 9, fontWeight: 600, color: "var(--p-gold)",
                                background: "var(--p-gold-dim)", border: "1px solid var(--p-gold-border)",
                                padding: "2px 9px", borderRadius: 99,
                              }}>
                                {AMENITY_ICONS[a]}
                                {AMENITY_LABELS[a] || a}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Price + CTA */}
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          borderTop: "1px solid var(--p-border)", paddingTop: 12,
                          marginTop: "auto", gap: 10,
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                              <span style={{
                                fontFamily: "Cormorant Garamond, serif",
                                fontSize: 20, fontWeight: 700, color: "var(--p-text)",
                              }}>₦{l.pricePerNight.toLocaleString()}</span>
                              <span style={{ fontSize: 11, color: "var(--p-muted)" }}>/ night</span>
                            </div>
                            {l.rating > 0 && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                <StarSolid style={{ width: 10, height: 10, color: "var(--p-gold)" }} />
                                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--p-text)" }}>{l.rating}</span>
                                {l.reviewCount > 0 && (
                                  <span style={{ fontSize: 10, color: "var(--p-muted)" }}>({l.reviewCount})</span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleBook(l, e)}
                            style={{
                              background: "var(--p-gold)", color: "#fff",
                              border: "none", cursor: "pointer",
                              fontSize: 11, fontWeight: 700, padding: "9px 16px",
                              borderRadius: 8, letterSpacing: ".03em",
                              transition: "background .18s", flexShrink: 0,
                              fontFamily: "inherit",
                              boxShadow: "0 4px 12px rgba(201,169,110,.28)",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--p-gold-hover)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--p-gold)")}
                          >
                            Reserve
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* Load more */}
        {!loading && !error && hasMore && (
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button
              className="prop-load-more-btn"
              onClick={() => setLimit((n) => n + loadMoreStep)}
            >
              Show more properties ({filtered.length - limit} remaining)
            </button>
          </div>
        )}

        {/* Nigerian trust note */}
        {!loading && !error && visible.length > 0 && (
          <div style={{
            marginTop: 28, textAlign: "center",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
            flexWrap: "wrap",
          }}>
            {["All prices in ₦ Naira", "No hidden fees", "Free cancellation on most stays"].map((t) => (
              <span key={t} style={{
                fontSize: 11, color: "var(--p-muted)", display: "flex",
                alignItems: "center", gap: 5,
              }}>
                <span style={{ color: "var(--p-gold)" }}>✓</span> {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Auth modal */}
      {showAuthModal && (
        <div className="prop-auth-overlay">
          <div style={{
            position: "absolute", inset: 0, background: "rgba(26,24,20,.55)",
            backdropFilter: "blur(6px)",
          }} onClick={() => setShowAuthModal(false)} />
          <div style={{
            position: "relative", zIndex: 1,
            background: "var(--p-white)", border: "1px solid var(--p-border)",
            borderRadius: 16, padding: "32px 28px",
            width: "100%", maxWidth: 360, textAlign: "center",
          }}>
            <button onClick={() => setShowAuthModal(false)} style={{
              position: "absolute", top: 14, right: 14,
              background: "none", border: "none", cursor: "pointer",
              color: "var(--p-muted)",
            }}>
              <XMarkIcon style={{ width: 18, height: 18 }} />
            </button>
            <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, fontWeight: 600, color: "var(--p-text)", marginBottom: 8 }}>
              Sign in to continue
            </h3>
            <p style={{ color: "var(--p-sub)", fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
              Create a free account to save properties, book stays, and manage your trips.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => { setShowAuthModal(false); onSignup?.(); }} style={{
                background: "var(--p-gold)", color: "#fff", border: "none",
                fontSize: 13, fontWeight: 700, padding: "12px 0", borderRadius: 9,
                cursor: "pointer", fontFamily: "inherit",
              }}>Create Free Account</button>
              <button onClick={() => { setShowAuthModal(false); onLogin?.(); }} style={{
                background: "none", border: "1.5px solid var(--p-border)",
                color: "var(--p-text)", fontSize: 13, fontWeight: 500,
                padding: "11px 0", borderRadius: 9, cursor: "pointer",
                fontFamily: "inherit",
              }}>Sign In</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}