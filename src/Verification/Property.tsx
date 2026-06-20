import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPinIcon,
  HeartIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  HomeModernIcon,
  WifiIcon,
  SunIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  CakeIcon,
  UsersIcon,
  ShieldCheckIcon,
  BellIcon,
  PlayCircleIcon,
  FireIcon as FlameOutline,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolid,
  StarIcon as StarSolid,
} from "@heroicons/react/24/solid";
import { ListingsDB, listingToHotel, type Hotel } from "../index";
import { useAuth } from "../AuthContext";

/* ─────────────── Types ─────────────── */

type SortKey = "featured" | "rating" | "price_asc" | "price_desc" | "newest";
type FilterCategory =
  | "all"
  | "villa"
  | "apartment"
  | "resort"
  | "boutique"
  | "penthouse";

/* ─────────────── Design tokens — matched to Hero ─────────────── */

const T = {
  white: "#FFFFFF",
  surface: "#F7F6F3",
  border: "#E8E5E0",
  text: "#1A1814",
  sub: "#6B6560",
  muted: "#6F6862",
  gold: "#C9A96E",
  goldDim: "rgba(201,169,110,0.12)",
  goldBorder: "rgba(201,169,110,0.28)",
  goldHover: "#B8935A",
  danger: "#B3463F",
  dangerDim: "rgba(179,70,63,0.08)",
};

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

/* Icon-based amenity map — replaces emoji */
const AMENITY_ICONS: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  "Free WiFi": WifiIcon,
  "Private Pool": SunIcon,
  "Butler Service": BellIcon,
  "Sea View": SunIcon,
  "Spa Island": SparklesIcon,
  "Airport Transfer": PaperAirplaneIcon,
  "Fine Dining": CakeIcon,
  "Overwater Bungalow": SunIcon,
  "Water Sports": SunIcon,
  "Kids Club": UsersIcon,
  Pool: SunIcon,
  BBQ: FlameOutline,
  "Wine Cellar": BeakerIcon,
  Butler: BellIcon,
  "Air Conditioning": SparklesIcon,
  Concierge: ShieldCheckIcon,
  Netflix: PlayCircleIcon,
};
const DEFAULT_AMENITY_ICON = SparklesIcon;

/* ─────────────── Skeleton card ─────────────── */

const SkeletonCard = () => (
  <div
    className="animate-pulse"
    style={{
      background: T.white,
      borderRadius: 16,
      overflow: "hidden",
      border: `1px solid ${T.border}`,
    }}
  >
    <div style={{ aspectRatio: "4 / 3", background: T.surface }} />
    <div
      style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}
    >
      <div
        style={{
          height: 12,
          background: T.surface,
          borderRadius: 99,
          width: "70%",
        }}
      />
      <div
        style={{
          height: 10,
          background: T.surface,
          borderRadius: 99,
          width: "45%",
        }}
      />
      <div
        style={{
          height: 10,
          background: T.surface,
          borderRadius: 99,
          width: "90%",
        }}
      />
    </div>
  </div>
);

/* ─────────────── Auth required prompt ─────────────── */

const AuthPromptModal = ({
  onClose,
  onLogin,
  onSignup,
}: {
  onClose: () => void;
  onLogin?: () => void;
  onSignup?: () => void;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in required"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(26,24,20,.55)",
          backdropFilter: "blur(6px)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 10,
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          width: "100%",
          maxWidth: 360,
          padding: "32px 28px 28px",
          textAlign: "center",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: T.goldDim,
            border: `1px solid ${T.goldBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <ShieldCheckIcon style={{ width: 24, height: 24, color: T.gold }} />
        </div>
        <h3
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontWeight: 600,
            fontSize: 22,
            color: T.text,
            marginBottom: 8,
          }}
        >
          Sign in to book
        </h3>
        <p
          style={{
            color: T.muted,
            fontSize: 13,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          You'll need an account to reserve a stay. Log in if you already have
          one, or sign up — it only takes a minute.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => {
              onClose();
              onLogin?.();
            }}
            style={{
              background: T.gold,
              color: T.white,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              padding: "12px 0",
              borderRadius: 11,
              fontFamily: "inherit",
              boxShadow: "0 4px 14px rgba(201,169,110,.3)",
            }}
          >
            Log In
          </button>
          <button
            onClick={() => {
              onClose();
              onSignup?.();
            }}
            style={{
              background: T.white,
              color: T.text,
              border: `1px solid ${T.border}`,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              padding: "12px 0",
              borderRadius: 11,
              fontFamily: "inherit",
            }}
          >
            Sign Up
          </button>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            background: "none",
            border: "none",
            color: T.muted,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
            textDecoration: "underline",
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};

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
  const [hov, setHov] = useState(false);

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
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        background: T.white,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${hov ? T.goldBorder : T.border}`,
        boxShadow: hov
          ? "0 12px 36px rgba(0,0,0,0.10)"
          : "0 2px 10px rgba(0,0,0,0.05)",
        opacity: visible ? 1 : 0,
        transform: visible
          ? hov
            ? "translateY(-3px)"
            : "translateY(0)"
          : "translateY(24px)",
        transition: `opacity 0.5s ease ${index * 60}ms, transform 0.3s ease, border-color 0.2s ease, box-shadow 0.3s ease`,
      }}
    >
      {/* ── Image ── */}
      <div
        style={{
          position: "relative",
          aspectRatio: "4 / 3",
          overflow: "hidden",
        }}
      >
        <img
          src={
            imgError
              ? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80"
              : hotel.thumbnail || hotel.images[0]
          }
          alt={hotel.name}
          loading="lazy"
          onError={() => setImgError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform .6s",
            transform: hov ? "scale(1.05)" : "scale(1)",
          }}
        />

        {/* Gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(26,24,20,.45) 0%, transparent 50%)",
          }}
        />

        {/* Category badge */}
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: "rgba(255,255,255,.92)",
            backdropFilter: "blur(8px)",
            color: T.gold,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            padding: "3px 8px",
            borderRadius: 99,
            maxWidth: "calc(100% - 56px)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {hotel.category}
        </span>

        {/* Featured badge */}
        {hotel.featured && (
          <span
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              marginTop: 22,
              background: T.gold,
              color: T.white,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              padding: "3px 8px",
              borderRadius: 99,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <FlameOutline style={{ width: 9, height: 9 }} />
            Featured
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWishlist(hotel.id);
          }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "rgba(255,255,255,.92)",
            backdropFilter: "blur(8px)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,.08)",
            transition: "transform .15s",
            transform: hov ? "scale(1.08)" : "scale(1)",
          }}
        >
          {wishlisted ? (
            <HeartSolid style={{ width: 15, height: 15, color: "#E1574C" }} />
          ) : (
            <HeartIcon style={{ width: 15, height: 15, color: T.sub }} />
          )}
        </button>

        {/* Rating chip */}
        {hotel.rating > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              display: "flex",
              alignItems: "center",
              gap: 3,
              background: "rgba(26,24,20,.55)",
              backdropFilter: "blur(8px)",
              borderRadius: 99,
              padding: "3px 8px",
            }}
          >
            <StarSolid style={{ width: 10, height: 10, color: T.gold }} />
            <span style={{ color: T.white, fontSize: 11, fontWeight: 700 }}>
              {hotel.rating.toFixed(1)}
            </span>
            {hotel.reviewCount > 0 && (
              <span style={{ color: "rgba(255,255,255,.65)", fontSize: 9 }}>
                ({hotel.reviewCount})
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "12px 12px 14px" }}>
        {/* Name + location */}
        <h3
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontWeight: 600,
            color: T.text,
            fontSize: 15,
            lineHeight: 1.25,
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {hotel.name}
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 8,
          }}
        >
          <MapPinIcon
            style={{ width: 11, height: 11, color: T.gold, flexShrink: 0 }}
          />
          <p
            style={{
              fontSize: 11,
              color: T.muted,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              margin: 0,
            }}
          >
            {hotel.location}
          </p>
        </div>

        {/* Tags — hidden on the smallest cards to reduce clutter, shown sm+ */}
        {hotel.tags.length > 0 && (
          <div
            className="card-tags"
            style={{ gap: 4, marginBottom: 8, flexWrap: "wrap" }}
          >
            {hotel.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: T.gold,
                  background: T.goldDim,
                  border: `1px solid ${T.goldBorder}`,
                  padding: "2px 7px",
                  borderRadius: 99,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Beds / baths / guests — icon row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              color: T.muted,
            }}
          >
            <HomeModernIcon style={{ width: 11, height: 11 }} />
            {hotel.bedrooms}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              color: T.muted,
            }}
          >
            <SparklesIcon style={{ width: 11, height: 11 }} />
            {hotel.bathrooms}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              color: T.muted,
            }}
          >
            <UsersIcon style={{ width: 11, height: 11 }} />
            {hotel.maxGuests}
          </span>
        </div>

        {/* Top amenity icons — hidden on the smallest cards */}
        {topAmenities.length > 0 && (
          <div className="card-amenities" style={{ gap: 5, marginBottom: 10 }}>
            {topAmenities.map((a) => {
              const Icon = AMENITY_ICONS[a] || DEFAULT_AMENITY_ICON;
              return (
                <span
                  key={a}
                  title={a}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon style={{ width: 12, height: 12, color: T.sub }} />
                </span>
              );
            })}
            {hotel.amenities.length > 3 && (
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: T.muted,
                  fontWeight: 700,
                }}
              >
                +{hotel.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 10,
            borderTop: `1px solid ${T.border}`,
            gap: 6,
          }}
        >
          <div
            style={{
              minWidth: 0,
              display: "flex",
              alignItems: "baseline",
              gap: 2,
            }}
          >
            <span
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: 16,
                fontWeight: 700,
                color: T.text,
                whiteSpace: "nowrap",
              }}
            >
              ₦{hotel.pricePerNight.toLocaleString()}
            </span>
            <span
              style={{ fontSize: 10, color: T.muted, whiteSpace: "nowrap" }}
            >
              /night
            </span>
          </div>
          <button
            onClick={() => onBook(hotel)}
            aria-label={`Book ${hotel.name}`}
            style={{
              background: T.gold,
              color: T.white,
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              padding: "8px 12px",
              borderRadius: 9,
              letterSpacing: ".02em",
              transition: "background .18s, transform .15s",
              boxShadow: "0 3px 10px rgba(201,169,110,.3)",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = T.goldHover;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = T.gold;
            }}
          >
            Book
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
  onLogin?: () => void;
  onSignup?: () => void;
  initialLimit?: number;
  loadMoreStep?: number;
}

const FeaturedProperties = ({
  onBook,
  onViewAll,
  onLogin,
  onSignup,
  initialLimit = 4,
  loadMoreStep = 6,
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
  const [authPrompt, setAuthPrompt] = useState(false);
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
      if (!user) {
        setAuthPrompt(true);
        return;
      }
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

  /* Book click — requires an account; otherwise prompt sign in / sign up */
  const handleBookClick = useCallback(
    (hotel: Hotel) => {
      if (!user) {
        setAuthPrompt(true);
        return;
      }
      onBook?.(hotel);
    },
    [user, onBook],
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
    <section style={{ background: T.surface, padding: "56px 16px" }}>
      <style>{`
        .fp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) {
          .fp-grid { grid-template-columns: repeat(2, 1fr); gap: 18px; }
        }
        @media (min-width: 900px) {
          .fp-grid { grid-template-columns: repeat(3, 1fr); gap: 22px; }
        }
        .card-tags, .card-amenities { display: none; }
        @media (min-width: 420px) {
          .card-tags, .card-amenities { display: flex; }
        }
        .fp-header {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 28px;
        }
        @media (min-width: 768px) {
          .fp-header {
            flex-direction: row;
            align-items: flex-end;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 36px;
          }
        }
        .fp-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .fp-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
        .fp-sort-menu {
          right: 0;
          left: auto;
          width: min(200px, calc(100vw - 32px));
        }
        @media (max-width: 480px) {
          .fp-sort-menu {
            right: auto;
            left: 50%;
            transform: translateX(-50%);
            width: min(220px, calc(100vw - 32px));
          }
        }
        button:focus-visible { outline: 2px solid ${T.gold}; outline-offset: 2px; }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* ── Header ── */}
        <div className="fp-header">
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".22em",
                color: T.gold,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Curated for You
            </p>
            <h2
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "clamp(30px, 6vw, 44px)",
                fontWeight: 600,
                color: T.text,
                lineHeight: 1.1,
              }}
            >
              Featured{" "}
              <em style={{ fontStyle: "italic", color: T.gold }}>Stays</em>
            </h2>
            <div
              style={{
                width: 48,
                height: 1,
                background: T.gold,
                marginTop: 12,
              }}
            />
            <p style={{ color: T.muted, fontSize: 13, marginTop: 8 }}>
              {loading
                ? "Loading properties…"
                : `${totalFiltered} handpicked luxury space${totalFiltered !== 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="fp-controls">
            {/* Sort dropdown */}
            <div ref={sortRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowSortMenu((s) => !s)}
                aria-haspopup="listbox"
                aria-expanded={showSortMenu}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: T.sub,
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  padding: "10px 14px",
                  borderRadius: 11,
                  cursor: "pointer",
                  transition: "border-color .18s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = T.goldBorder)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = T.border)
                }
              >
                <span style={{ color: T.gold, fontWeight: 600 }}>
                  {SORT_LABELS[sort]}
                </span>
                <ChevronDownIcon
                  style={{
                    width: 13,
                    height: 13,
                    color: T.muted,
                    transition: "transform .18s",
                    transform: showSortMenu ? "rotate(180deg)" : "none",
                  }}
                />
              </button>

              {showSortMenu && (
                <div
                  role="listbox"
                  className="fp-sort-menu"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    background: T.white,
                    border: `1px solid ${T.border}`,
                    borderRadius: 14,
                    boxShadow: "0 12px 36px rgba(0,0,0,.12)",
                    zIndex: 20,
                    overflow: "hidden",
                  }}
                >
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                    <button
                      key={key}
                      role="option"
                      aria-selected={sort === key}
                      onClick={() => {
                        setSort(key);
                        setShowSortMenu(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 14px",
                        fontSize: 13,
                        background: sort === key ? T.goldDim : "none",
                        color: sort === key ? T.gold : T.sub,
                        fontWeight: sort === key ? 600 : 400,
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 700,
                color: T.gold,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                padding: "10px 4px",
              }}
            >
              View All
              <ArrowRightIcon style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* ── Category filter pills ── */}
        <div className="fp-pills">
          {availableCategories.map((cat) => {
            const count =
              cat === "all"
                ? allHotels.length
                : allHotels.filter((h) => h.category === cat).length;
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setLimit(initialLimit);
                }}
                aria-pressed={active}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "8px 16px",
                  borderRadius: 99,
                  border: `1px solid ${active ? T.gold : T.border}`,
                  background: active ? T.gold : T.white,
                  color: active ? T.white : T.sub,
                  cursor: "pointer",
                  transition: "all .18s",
                  fontFamily: "inherit",
                  boxShadow: active
                    ? "0 4px 14px rgba(201,169,110,.3)"
                    : "none",
                }}
              >
                {CATEGORY_LABELS[cat]}
                {!loading && count > 0 && (
                  <span
                    style={{
                      marginLeft: 5,
                      color: active ? "rgba(255,255,255,.7)" : T.muted,
                    }}
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
          <div style={{ textAlign: "center", padding: "48px 16px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: T.dangerDim,
                border: "1px solid rgba(179,70,63,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <ExclamationTriangleIcon
                style={{ width: 24, height: 24, color: T.danger }}
              />
            </div>
            <p
              style={{
                color: T.sub,
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 16,
              }}
            >
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: T.gold,
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: "inherit",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && !error && (
          <div className="fp-grid">
            {Array.from({ length: initialLimit }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && displayed.length === 0 && (
          <div style={{ textAlign: "center", padding: "56px 16px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: T.goldDim,
                border: `1px solid ${T.goldBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <HomeModernIcon
                style={{ width: 24, height: 24, color: T.gold }}
              />
            </div>
            <p
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: 22,
                fontWeight: 600,
                color: T.text,
                marginBottom: 8,
              }}
            >
              No properties found
            </p>
            <p style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>
              Try a different category or check back soon.
            </p>
            <button
              onClick={() => setCategory("all")}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: T.gold,
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: "inherit",
              }}
            >
              Clear filter
            </button>
          </div>
        )}

        {/* ── Property grid ── */}
        {!loading && !error && displayed.length > 0 && (
          <>
            <div className="fp-grid">
              {displayed.map((hotel, i) => (
                <PropertyCard
                  key={hotel.id}
                  hotel={hotel}
                  index={i}
                  wishlisted={wishlist.has(hotel.id)}
                  onWishlist={handleWishlist}
                  onBook={handleBookClick}
                />
              ))}
            </div>

            {/* ── Load more ── */}
            <div
              style={{
                marginTop: 36,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              {hasMore && (
                <button
                  onClick={() => setLimit((l) => l + loadMoreStep)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: T.white,
                    border: `1px solid ${T.border}`,
                    color: T.sub,
                    fontWeight: 700,
                    fontSize: 13,
                    padding: "13px 28px",
                    borderRadius: 14,
                    cursor: "pointer",
                    transition:
                      "border-color .18s, color .18s, box-shadow .18s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = T.goldBorder;
                    e.currentTarget.style.color = T.gold;
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(0,0,0,.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.color = T.sub;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Load more properties
                  <ChevronDownIcon style={{ width: 14, height: 14 }} />
                </button>
              )}
              <p style={{ fontSize: 11, color: T.muted }}>
                Showing {displayed.length} of {totalFiltered} properties
              </p>
            </div>
          </>
        )}

        {/* ── No auth wishlist nudge ── */}
        {!user && !loading && displayed.length > 0 && (
          <p
            style={{
              textAlign: "center",
              fontSize: 11,
              color: T.muted,
              marginTop: 24,
            }}
          >
            <span
              onClick={() => onLogin?.()}
              style={{
                color: T.gold,
                cursor: "pointer",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              Sign in
            </span>{" "}
            to save your favourite properties
          </p>
        )}
      </div>

      {authPrompt && (
        <AuthPromptModal
          onClose={() => setAuthPrompt(false)}
          onLogin={onLogin}
          onSignup={onSignup}
        />
      )}
    </section>
  );
};

export default FeaturedProperties;
