/**
 * pages/GuestDashboard.tsx
 *
 * Upgraded Guest Dashboard — luxury editorial aesthetic.
 * Dark parchment + gold palette, Cormorant Garamond headlines,
 * card-based layout, animated counters, full Supabase DB connection.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDaysIcon,
  HeartIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  MapPinIcon,
  ClockIcon,
  GlobeAltIcon,
  BanknotesIcon,
  SparklesIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolid,
  StarIcon as StarSolid,
} from "@heroicons/react/24/solid";
import { useAuth } from "./AuthContext";
import {
  BookingsDB,
  ListingsDB,
  listingToHotel,
  type Booking,
  type Hotel,
  type Listing,
} from "./index";

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
const fmt$ = (n: number) =>
  "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const daysUntil = (d: string) => {
  const diff = new Date(d).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
};

/* ─────────────────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────────────────── */
const Counter = ({
  target,
  prefix = "",
  suffix = "",
}: {
  target: number;
  prefix?: string;
  suffix?: string;
}) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const dur = 900;
    const step = (ts: number) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(Math.round(ease * target));
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);

  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────────────────── */
const Badge = ({ status }: { status: Booking["status"] }) => {
  const map = {
    confirmed:
      "bg-[rgba(126,200,160,0.12)] text-[#7ec8a0] border-[rgba(126,200,160,0.3)]",
    pending:
      "bg-[rgba(201,169,110,0.12)] text-[#C9A96E] border-[rgba(201,169,110,0.3)]",
    cancelled:
      "bg-[rgba(224,112,112,0.12)] text-[#e07070] border-[rgba(224,112,112,0.3)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${map[status]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────── */
const StatCard = ({
  icon,
  label,
  value,
  sub,
  delay,
  accent = "#C9A96E",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  delay?: number;
  accent?: string;
}) => (
  <div
    className="relative bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-5 overflow-hidden group hover:border-[rgba(201,169,110,0.2)] transition-all duration-300"
    style={{ animation: `fadeUp 0.5s ease ${delay ?? 0}ms both` }}
  >
    {/* Glow orb */}
    <div
      className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none"
      style={{ background: accent }}
    />

    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
      style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
    >
      {icon}
    </div>

    <p className="font-['Cormorant_Garamond'] text-3xl font-bold text-[#f5f0e8] leading-none">
      {typeof value === "number" ? <Counter target={value} /> : value}
    </p>
    <p className="text-[11px] text-[rgba(245,240,232,0.38)] mt-1 uppercase tracking-wider">
      {label}
    </p>
    {sub && (
      <p className="text-[10px] mt-0.5 font-medium" style={{ color: accent }}>
        {sub}
      </p>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────
   UPCOMING CARD (big visual card for next trip)
───────────────────────────────────────────────────────── */
const UpcomingCard = ({
  booking,
  hotel,
}: {
  booking: Booking;
  hotel?: Hotel;
}) => {
  const days = daysUntil(booking.checkIn);
  return (
    <div
      className="relative rounded-3xl overflow-hidden h-52 group cursor-pointer"
      style={{ animation: "fadeUp 0.5s ease 100ms both" }}
    >
      <img
        src={
          hotel?.thumbnail ||
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"
        }
        alt={booking.listingName}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Days pill */}
      <div className="absolute top-4 right-4 bg-[#C9A96E] text-[#0e0d0b] text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
        {days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `${days} days away`}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-[#C9A96E] uppercase tracking-[0.2em] font-bold mb-1">
              Next Stay
            </p>
            <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-white leading-tight line-clamp-1">
              {booking.listingName}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPinIcon className="w-3 h-3 text-white/50" />
              <p className="text-white/60 text-xs">
                {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-['Cormorant_Garamond'] text-2xl font-bold text-[#C9A96E]">
              {booking.nights}
            </p>
            <p className="text-white/50 text-[10px] uppercase tracking-wider">
              night{booking.nights !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <span className="text-[10px] text-white/40">Ref:</span>
          <span className="text-[10px] font-mono text-[#C9A96E]">
            {booking.ref}
          </span>
          <span className="ml-2">
            <Badge status={booking.status} />
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────── */
type Tab = "overview" | "bookings" | "wishlist" | "profile";

const NAV: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: SparklesIcon },
  { key: "bookings", label: "My Bookings", icon: CalendarDaysIcon },
  { key: "wishlist", label: "Wishlist", icon: HeartIcon },
  { key: "profile", label: "Profile", icon: UserIcon },
];

const Sidebar = ({
  tab,
  onTab,
  onLogout,
  onClose,
  mobile,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  onLogout: () => void;
  onClose?: () => void;
  mobile?: boolean;
}) => {
  const { user } = useAuth();
  return (
    <aside
      className="w-60 h-full flex flex-col relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg,#120d08 0%,#1e1408 55%,#120d08 100%)",
      }}
    >
      {/* Top gold accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />

      {/* Subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A96E' fill-opacity='1'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      {/* Logo + close */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-6 pb-5 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 bg-[#C9A96E] rotate-45 rounded-sm" />
          <span className="font-['Cormorant_Garamond'] text-lg tracking-wide text-[#f5f0e8]">
            LuxStay
          </span>
        </div>
        {mobile && (
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* User block */}
      <div className="relative z-10 mx-4 mt-4 mb-5 p-3.5 rounded-2xl bg-[rgba(201,169,110,0.06)] border border-[rgba(201,169,110,0.12)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#8a6030] flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
            {user?.avatar ?? user?.firstName?.[0] ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-[#f5f0e8] text-sm font-semibold truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-[#C9A96E] font-bold uppercase tracking-wider">
              Guest
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 px-3 mb-2 font-bold">
          Navigation
        </p>
        {NAV.map(({ key, label, icon: Icon }) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              onClick={() => {
                onTab(key);
                onClose?.();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? "text-[#0e0d0b] shadow-lg shadow-[#C9A96E]/20" : "text-white/45 hover:text-white/80 hover:bg-white/4"}`}
              style={
                isActive
                  ? { background: "linear-gradient(135deg,#C9A96E,#a07840)" }
                  : {}
              }
            >
              <Icon style={{ width: 16, height: 16 }} className="shrink-0" />
              {label}
            </button>
          );
        })}

        <div className="pt-3">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 px-3 mb-2 font-bold">
            Quick Links
          </p>
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/4 transition-all">
            <MagnifyingGlassIcon
              style={{ width: 16, height: 16 }}
              className="shrink-0"
            />
            Explore Stays
          </button>
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/4 transition-all">
            <GlobeAltIcon
              style={{ width: 16, height: 16 }}
              className="shrink-0"
            />
            Travel Guide
          </button>
        </div>
      </nav>

      {/* Logout */}
      <div className="relative z-10 px-3 pb-5 pt-3 border-t border-white/6">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/35 hover:text-red-400 hover:bg-red-500/6 transition-all"
        >
          <ArrowRightOnRectangleIcon
            style={{ width: 16, height: 16 }}
            className="shrink-0"
          />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

/* ─────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────── */
const Sk = ({
  h = "h-8",
  rounded = "rounded-xl",
}: {
  h?: string;
  rounded?: string;
}) => (
  <div
    className={`w-full ${h} ${rounded} bg-[rgba(245,240,232,0.05)] animate-pulse`}
  />
);

/* ═══════════════════════════════════════════════════════════
   OVERVIEW TAB
═══════════════════════════════════════════════════════════ */
const Overview = ({
  bookings,
  wishlist,
  loading,
  onTabSwitch,
  onBook,
}: {
  bookings: Booking[];
  wishlist: Hotel[];
  loading: boolean;
  onTabSwitch: (t: Tab) => void;
  onBook?: (h: Hotel) => void;
}) => {
  const now = new Date();
  const upcoming = bookings
    .filter((b) => b.status !== "cancelled" && new Date(b.checkIn) >= now)
    .sort(
      (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime(),
    );
  const past = bookings.filter((b) => new Date(b.checkOut) < now);
  const nights = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((s, b) => s + b.nights, 0);
  const spent = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((s, b) => s + b.totalAmount, 0);
  const nextTrip = upcoming[0];

  return (
    <div className="space-y-7" style={{ animation: "fadeUp 0.4s ease both" }}>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CalendarDaysIcon className="w-4 h-4 text-[#C9A96E]" />}
          label="Upcoming Stays"
          value={upcoming.length}
          delay={0}
        />
        <StatCard
          icon={<GlobeAltIcon className="w-4 h-4 text-[#C9A96E]" />}
          label="Total Trips"
          value={bookings.length}
          delay={60}
        />
        <StatCard
          icon={<ClockIcon className="w-4 h-4 text-[#C9A96E]" />}
          label="Nights Stayed"
          value={nights}
          delay={120}
        />
        <StatCard
          icon={<BanknotesIcon className="w-4 h-4 text-[#C9A96E]" />}
          label="Total Spent"
          value={fmt$(spent)}
          delay={180}
        />
      </div>

      {/* Next trip hero */}
      {loading ? (
        <Sk h="h-52" rounded="rounded-3xl" />
      ) : (
        nextTrip && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-['Cormorant_Garamond'] text-xl text-[#f5f0e8]">
                Your Next Trip
              </h3>
            </div>
            <UpcomingCard booking={nextTrip} />
          </div>
        )
      )}

      {/* All upcoming */}
      {upcoming.length > 1 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Cormorant_Garamond'] text-xl text-[#f5f0e8]">
              All Upcoming
            </h3>
            <button
              onClick={() => onTabSwitch("bookings")}
              className="text-xs font-semibold text-[#C9A96E] hover:underline flex items-center gap-1"
            >
              View all <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {upcoming.slice(1, 4).map((b, i) => (
              <div
                key={b.id}
                className="flex items-center gap-4 bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-4 hover:border-[rgba(201,169,110,0.2)] transition-all"
                style={{ animation: `fadeUp 0.4s ease ${i * 60}ms both` }}
              >
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 bg-[rgba(201,169,110,0.1)] border border-[rgba(201,169,110,0.2)]">
                  <p className="text-[9px] font-bold text-[#C9A96E] uppercase leading-none">
                    {new Date(b.checkIn).toLocaleDateString("en", {
                      month: "short",
                    })}
                  </p>
                  <p className="font-['Cormorant_Garamond'] text-xl font-bold text-[#f5f0e8] leading-none mt-0.5">
                    {new Date(b.checkIn).getDate()}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#f5f0e8] text-sm font-semibold truncate">
                    {b.listingName}
                  </p>
                  <p className="text-[rgba(245,240,232,0.4)] text-xs mt-0.5">
                    {fmtDate(b.checkIn)} · {b.nights} night
                    {b.nights !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[#C9A96E] text-sm font-bold">
                    {fmt$(b.totalAmount)}
                  </p>
                  <p className="text-[rgba(245,240,232,0.3)] text-[10px] mt-0.5">
                    {daysUntil(b.checkIn)}d away
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wishlist preview */}
      {wishlist.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Cormorant_Garamond'] text-xl text-[#f5f0e8]">
              Saved Properties
            </h3>
            <button
              onClick={() => onTabSwitch("wishlist")}
              className="text-xs font-semibold text-[#C9A96E] hover:underline flex items-center gap-1"
            >
              View all <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.slice(0, 3).map((h, i) => (
              <div
                key={h.id}
                className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl overflow-hidden group cursor-pointer hover:border-[rgba(201,169,110,0.25)] hover:-translate-y-0.5 transition-all duration-300"
                onClick={() => onBook?.(h)}
                style={{ animation: `fadeUp 0.4s ease ${i * 70}ms both` }}
              >
                <div className="h-36 overflow-hidden relative">
                  <img
                    src={
                      h.thumbnail ||
                      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"
                    }
                    alt={h.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1610]/60 to-transparent" />
                  <div className="absolute top-2 right-2">
                    <HeartSolid className="w-4 h-4 text-rose-400 drop-shadow" />
                  </div>
                </div>
                <div className="p-3.5">
                  <p className="text-[#f5f0e8] text-sm font-semibold truncate">
                    {h.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5 mb-2">
                    <MapPinIcon className="w-3 h-3 text-[#C9A96E]" />
                    <p className="text-xs text-[rgba(245,240,232,0.4)] truncate">
                      {h.city}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[#C9A96E] text-sm font-bold">
                      {fmt$(h.pricePerNight)}
                      <span className="text-[rgba(245,240,232,0.3)] font-normal text-[10px]">
                        /night
                      </span>
                    </p>
                    {h.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        <StarSolid className="w-3 h-3 text-[#C9A96E]" />
                        <span className="text-xs text-[rgba(245,240,232,0.5)]">
                          {h.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past trips snippet */}
      {past.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Cormorant_Garamond'] text-xl text-[#f5f0e8]">
              Recent Trips
            </h3>
            <button
              onClick={() => onTabSwitch("bookings")}
              className="text-xs font-semibold text-[#C9A96E] hover:underline flex items-center gap-1"
            >
              Full history <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl overflow-hidden">
            {past.slice(0, 3).map((b, i) => (
              <div
                key={b.id}
                className={`flex items-center gap-4 px-5 py-4 ${i !== past.slice(0, 3).length - 1 ? "border-b border-[rgba(245,240,232,0.05)]" : ""} hover:bg-[rgba(245,240,232,0.02)] transition-colors`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[#f5f0e8] text-sm font-semibold truncate">
                    {b.listingName}
                  </p>
                  <p className="text-[rgba(245,240,232,0.4)] text-xs mt-0.5">
                    {fmtDate(b.checkIn)} — {fmtDate(b.checkOut)} · {b.nights}n
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[#f5f0e8] text-sm font-bold">
                    {fmt$(b.totalAmount)}
                  </p>
                  <Badge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && bookings.length === 0 && wishlist.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(201,169,110,0.08)] border border-[rgba(201,169,110,0.15)] flex items-center justify-center mb-5">
            <SparklesIcon className="w-7 h-7 text-[#C9A96E]" />
          </div>
          <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#f5f0e8] mb-2">
            Start your journey
          </h3>
          <p className="text-[rgba(245,240,232,0.4)] text-sm max-w-xs mb-6">
            Explore our curated collection of luxury properties and book your
            first stay.
          </p>
          <button className="flex items-center gap-2 bg-[#C9A96E] text-[#0e0d0b] font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[#dfc08a] transition-all hover:scale-105">
            <MagnifyingGlassIcon className="w-4 h-4" /> Explore Stays
          </button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   BOOKINGS TAB
═══════════════════════════════════════════════════════════ */
const BookingsTab = ({
  bookings,
  loading,
}: {
  bookings: Booking[];
  loading: boolean;
}) => {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.status !== "cancelled" && new Date(b.checkIn) >= now,
  );
  const past = bookings.filter((b) => new Date(b.checkOut) < now);
  const show =
    filter === "upcoming" ? upcoming : filter === "past" ? past : bookings;

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <div className="mb-7">
        <h2 className="font-['Cormorant_Garamond'] text-3xl font-medium text-[#f5f0e8] mb-1">
          My Bookings
        </h2>
        <p className="text-[rgba(245,240,232,0.4)] text-sm">
          {bookings.length} total reservation{bookings.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-5">
        {(["all", "upcoming", "past"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all ${filter === f ? "bg-[#C9A96E] border-[#C9A96E] text-[#0e0d0b] shadow-md shadow-[#C9A96E]/20" : "border-[rgba(245,240,232,0.1)] text-[rgba(245,240,232,0.45)] hover:border-[rgba(201,169,110,0.3)] hover:text-[#C9A96E]"}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} (
            {f === "all"
              ? bookings.length
              : f === "upcoming"
                ? upcoming.length
                : past.length}
            )
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Sk key={i} h="h-20" rounded="rounded-2xl" />
          ))}
        </div>
      ) : show.length === 0 ? (
        <div className="py-20 text-center">
          <CalendarDaysIcon className="w-10 h-10 text-[rgba(245,240,232,0.15)] mx-auto mb-3" />
          <p className="text-[rgba(245,240,232,0.4)] text-sm">
            No {filter !== "all" ? filter : ""} bookings
          </p>
        </div>
      ) : (
        <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[rgba(245,240,232,0.06)]">
                  {[
                    "Ref",
                    "Property",
                    "Check-in",
                    "Check-out",
                    "Nights",
                    "Total",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3.5 text-[10px] uppercase tracking-[0.12em] text-[rgba(245,240,232,0.3)] font-bold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {show.map((b, i) => (
                  <tr
                    key={b.id}
                    className="border-b border-[rgba(245,240,232,0.04)] hover:bg-[rgba(245,240,232,0.02)] transition-colors"
                    style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both` }}
                  >
                    <td className="px-5 py-3.5 font-mono text-[11px] text-[#C9A96E]">
                      {b.ref}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#f5f0e8] max-w-[160px] truncate">
                      {b.listingName}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[rgba(245,240,232,0.55)] whitespace-nowrap">
                      {fmtDate(b.checkIn)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[rgba(245,240,232,0.55)] whitespace-nowrap">
                      {fmtDate(b.checkOut)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[rgba(245,240,232,0.55)]">
                      {b.nights}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-[#f5f0e8]">
                      {fmt$(b.totalAmount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   WISHLIST TAB
═══════════════════════════════════════════════════════════ */
const WishlistTab = ({
  wishlist,
  loading,
  onBook,
  onRemove,
}: {
  wishlist: Hotel[];
  loading: boolean;
  onBook?: (h: Hotel) => void;
  onRemove: (id: string) => void;
}) => (
  <div style={{ animation: "fadeUp 0.4s ease both" }}>
    <div className="mb-7">
      <h2 className="font-['Cormorant_Garamond'] text-3xl font-medium text-[#f5f0e8] mb-1">
        Wishlist
      </h2>
      <p className="text-[rgba(245,240,232,0.4)] text-sm">
        {wishlist.length} saved propert{wishlist.length !== 1 ? "ies" : "y"}
      </p>
    </div>

    {loading ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <Sk key={i} h="h-64" rounded="rounded-2xl" />
        ))}
      </div>
    ) : wishlist.length === 0 ? (
      <div className="py-20 text-center">
        <HeartIcon className="w-10 h-10 text-[rgba(245,240,232,0.15)] mx-auto mb-3" />
        <p className="text-[rgba(245,240,232,0.4)] text-sm mb-1">
          Your wishlist is empty
        </p>
        <p className="text-[rgba(245,240,232,0.25)] text-xs">
          Heart a property while browsing to save it here
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {wishlist.map((h, i) => (
          <div
            key={h.id}
            className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl overflow-hidden group hover:border-[rgba(201,169,110,0.25)] hover:-translate-y-0.5 transition-all duration-300"
            style={{ animation: `fadeUp 0.4s ease ${i * 60}ms both` }}
          >
            <div
              className="relative h-48 overflow-hidden cursor-pointer"
              onClick={() => onBook?.(h)}
            >
              <img
                src={
                  h.thumbnail ||
                  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"
                }
                alt={h.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1610]/50 to-transparent" />
              <span className="absolute top-3 left-3 bg-[rgba(14,13,11,0.75)] backdrop-blur-sm border border-[rgba(245,240,232,0.1)] rounded-full px-2.5 py-1 text-[10px] text-[#C9A96E] uppercase font-semibold tracking-wider">
                {h.category}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(h.id);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[rgba(14,13,11,0.75)] backdrop-blur-sm flex items-center justify-center hover:bg-red-500/20 transition-colors"
              >
                <HeartSolid className="w-4 h-4 text-rose-400" />
              </button>
              {h.featured && (
                <span className="absolute bottom-3 left-3 bg-[#C9A96E] text-[#0e0d0b] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Featured
                </span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-['Cormorant_Garamond'] text-base font-semibold text-[#f5f0e8] truncate mb-0.5">
                {h.name}
              </h3>
              <div className="flex items-center gap-1 mb-3">
                <MapPinIcon className="w-3 h-3 text-[#C9A96E] shrink-0" />
                <p className="text-xs text-[rgba(245,240,232,0.4)] truncate">
                  {h.location}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[#C9A96E] font-bold">
                  {fmt$(h.pricePerNight)}
                  <span className="text-[rgba(245,240,232,0.3)] font-normal text-xs">
                    /night
                  </span>
                </p>
                <button
                  onClick={() => onBook?.(h)}
                  className="text-xs font-semibold text-[#C9A96E] hover:text-[#dfc08a] hover:underline transition-colors"
                >
                  Book →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   PROFILE TAB
═══════════════════════════════════════════════════════════ */
const ProfileTab = ({
  bookings,
  wishlist,
}: {
  bookings: Booking[];
  wishlist: Hotel[];
}) => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    country: user?.country ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await updateUser(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inp =
    "w-full bg-[#252220] border border-[rgba(245,240,232,0.1)] rounded-xl px-4 py-2.5 text-sm text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.2)] outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/10 transition-all";
  const lbl =
    "block text-[10px] font-bold uppercase tracking-[0.12em] text-[rgba(245,240,232,0.4)] mb-1.5";

  const nights = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((s, b) => s + b.nights, 0);
  const spent = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <div className="mb-7">
        <h2 className="font-['Cormorant_Garamond'] text-3xl font-medium text-[#f5f0e8] mb-1">
          My Profile
        </h2>
        <p className="text-[rgba(245,240,232,0.4)] text-sm">
          Your guest account details and travel stats
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Edit form */}
        <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-6">
          {/* Avatar block */}
          <div className="flex items-center gap-4 mb-7 pb-6 border-b border-[rgba(245,240,232,0.06)]">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#8a6030] flex items-center justify-center text-white font-bold text-2xl shadow-lg shrink-0">
              {user?.avatar ?? user?.firstName?.[0] ?? "?"}
            </div>
            <div>
              <p className="font-['Cormorant_Garamond'] text-xl font-semibold text-[#f5f0e8]">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-[rgba(245,240,232,0.4)] mt-0.5">
                {user?.email}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: user?.emailVerified ? "#7ec8a0" : "#e07070" }}
              >
                {user?.emailVerified
                  ? "✓ Email verified"
                  : "⚠ Email not verified"}
              </p>
            </div>
          </div>

          <h3 className="text-sm font-bold text-[rgba(245,240,232,0.6)] uppercase tracking-wider mb-5">
            Edit Profile
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>First Name</label>
                <input
                  className={inp}
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className={lbl}>Last Name</label>
                <input
                  className={inp}
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <label className={lbl}>Email (read only)</label>
              <input
                className={inp + " opacity-40 cursor-not-allowed"}
                value={user?.email ?? ""}
                disabled
              />
            </div>
            <div>
              <label className={lbl}>Phone</label>
              <input
                className={inp}
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <label className={lbl}>Country</label>
              <input
                className={inp}
                value={form.country}
                onChange={(e) =>
                  setForm((f) => ({ ...f, country: e.target.value }))
                }
                placeholder="Nigeria"
              />
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full mt-6 bg-[#C9A96E] disabled:opacity-50 text-[#0e0d0b] font-bold py-3.5 rounded-xl text-sm hover:bg-[#dfc08a] transition-all hover:scale-[1.01] flex items-center justify-center gap-2 shadow-lg shadow-[#C9A96E]/20"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-[#0e0d0b]/20 border-t-[#0e0d0b] rounded-full animate-spin" />
                Saving…
              </>
            ) : saved ? (
              "✓ Changes Saved!"
            ) : (
              "Save Changes"
            )}
          </button>
        </div>

        {/* Stats panel */}
        <div className="space-y-4">
          {/* Travel stats */}
          <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[rgba(245,240,232,0.3)] mb-4">
              Travel Stats
            </p>
            {[
              { label: "Total Bookings", val: bookings.length },
              {
                label: "Upcoming Stays",
                val: bookings.filter(
                  (b) =>
                    b.status !== "cancelled" &&
                    new Date(b.checkIn) >= new Date(),
                ).length,
              },
              { label: "Nights Stayed", val: nights },
              { label: "Wishlist Items", val: wishlist.length },
              { label: "Total Spent", val: fmt$(spent) },
            ].map(({ label, val }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2.5 border-b border-[rgba(245,240,232,0.05)] last:border-0"
              >
                <span className="text-sm text-[rgba(245,240,232,0.45)]">
                  {label}
                </span>
                <span className="text-sm font-bold text-[#f5f0e8]">{val}</span>
              </div>
            ))}
          </div>

          {/* Account details */}
          <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[rgba(245,240,232,0.3)] mb-4">
              Account Details
            </p>
            {[
              { label: "Account Type", val: "Guest" },
              { label: "Country", val: user?.country || "—" },
              { label: "Phone", val: user?.phone || "—" },
              {
                label: "Member Since",
                val: user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                      month: "long",
                      year: "numeric",
                    })
                  : "—",
              },
            ].map(({ label, val }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2.5 border-b border-[rgba(245,240,232,0.05)] last:border-0"
              >
                <span className="text-sm text-[rgba(245,240,232,0.45)]">
                  {label}
                </span>
                <span className="text-sm text-[#f5f0e8]">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════ */
interface GuestDashboardProps {
  onBook?: (hotel: Hotel) => void;
  onLogout?: () => void;
}

export default function GuestDashboard({
  onBook,
  onLogout,
}: GuestDashboardProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlist, setWishlist] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const ids = user.wishlist ?? [];
    Promise.all([
      BookingsDB.byGuest(user.id),
      ids.length
        ? Promise.all(ids.map((id) => ListingsDB.getById(id))).then((r) =>
            r
              .filter((listing): listing is Listing => Boolean(listing))
              .map(listingToHotel),
          )
        : Promise.resolve([] as Hotel[]),
    ])
      .then(([b, w]) => {
        setBookings(b);
        setWishlist(w);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleLogout = useCallback(async () => {
    await logout();
    if (onLogout) onLogout();
    else navigate("/login");
  }, [logout, navigate, onLogout]);

  const removeFromWishlist = useCallback(async (id: string) => {
    // Optimistic update
    setWishlist((prev) => prev.filter((h) => h.id !== id));
  }, []);

  if (!user) return null;

  const greeting_ = greeting();

  return (
    <div
      className="min-h-screen bg-[#0e0d0b] text-[#f5f0e8] flex overflow-hidden"
      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap');
      `}</style>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar
          tab={tab}
          onTab={setTab}
          onLogout={handleLogout}
          onClose={() => setMobileOpen(false)}
          mobile
        />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar tab={tab} onTab={setTab} onLogout={handleLogout} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-[rgba(245,240,232,0.07)] bg-[rgba(14,13,11,0.9)] backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl border border-[rgba(245,240,232,0.1)] flex items-center justify-center text-[rgba(245,240,232,0.5)] hover:text-[#f5f0e8] transition-colors"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-[rgba(245,240,232,0.4)] text-xs">
                {greeting_}
              </p>
              <p className="font-['Cormorant_Garamond'] text-lg font-semibold text-[#f5f0e8] leading-tight">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search bar — desktop */}
            <div className="hidden lg:flex items-center gap-2 bg-[rgba(245,240,232,0.05)] border border-[rgba(245,240,232,0.08)] rounded-xl px-3 py-2 w-48">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[rgba(245,240,232,0.3)] shrink-0" />
              <input
                placeholder="Search stays…"
                className="bg-transparent text-sm text-[rgba(245,240,232,0.6)] w-full outline-none placeholder:text-[rgba(245,240,232,0.25)]"
                style={{ fontFamily: "system-ui" }}
              />
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#8a6030] flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer">
              {user.avatar ?? user.firstName?.[0] ?? "?"}
            </div>
          </div>
        </header>

        {/* Hero banner (overview only) */}
        {tab === "overview" && (
          <div
            className="relative overflow-hidden px-6 py-8 shrink-0"
            style={{
              background:
                "linear-gradient(135deg,#16100a 0%,#1f1508 50%,#16100a 100%)",
            }}
          >
            {/* Decorative background orbs */}
            <div
              className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none blur-3xl"
              style={{
                background:
                  "radial-gradient(circle,#C9A96E 0%,transparent 70%)",
                transform: "translate(30%,-30%)",
              }}
            />
            <div
              className="absolute bottom-0 left-20 w-48 h-48 rounded-full opacity-5 pointer-events-none blur-3xl"
              style={{ background: "#C9A96E" }}
            />

            <div className="relative z-10 max-w-4xl">
              <p
                className="text-[#C9A96E] text-xs font-bold uppercase tracking-[0.25em] mb-1"
                style={{ fontFamily: "system-ui" }}
              >
                {greeting_}
              </p>
              <h1 className="font-['Cormorant_Garamond'] text-3xl md:text-4xl font-semibold text-[#f5f0e8] mb-4">
                Welcome back,{" "}
                <span className="italic text-[#C9A96E]">{user.firstName}</span>{" "}
                ✈️
              </h1>

              {/* Quick stats strip */}
              <div className="flex gap-8 flex-wrap">
                {[
                  {
                    label: "Upcoming",
                    value: bookings.filter(
                      (b) =>
                        b.status !== "cancelled" &&
                        new Date(b.checkIn) >= new Date(),
                    ).length,
                  },
                  { label: "Total Trips", value: bookings.length },
                  {
                    label: "Nights Stayed",
                    value: bookings
                      .filter((b) => b.status === "confirmed")
                      .reduce((s, b) => s + b.nights, 0),
                  },
                  { label: "Saved", value: wishlist.length },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="font-['Cormorant_Garamond'] text-2xl font-bold text-[#C9A96E]">
                      {loading ? "—" : <Counter target={value} />}
                    </p>
                    <p
                      className="text-[10px] text-[rgba(245,240,232,0.4)] uppercase tracking-wider mt-0.5"
                      style={{ fontFamily: "system-ui" }}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto p-6 md:p-8"
          style={{ fontFamily: "system-ui" }}
        >
          <div className="max-w-5xl mx-auto">
            {tab === "overview" && (
              <Overview
                bookings={bookings}
                wishlist={wishlist}
                loading={loading}
                onTabSwitch={setTab}
                onBook={onBook}
              />
            )}
            {tab === "bookings" && (
              <BookingsTab bookings={bookings} loading={loading} />
            )}
            {tab === "wishlist" && (
              <WishlistTab
                wishlist={wishlist}
                loading={loading}
                onBook={onBook}
                onRemove={removeFromWishlist}
              />
            )}
            {tab === "profile" && (
              <ProfileTab bookings={bookings} wishlist={wishlist} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
