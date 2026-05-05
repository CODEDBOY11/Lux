// src/pages/Dashboard.tsx
// Matches the design in the screenshot:
//   • Dark walnut/wood sidebar with user avatar + nav items
//   • Stat cards row: Total Listings, Active Bookings, Earnings, Pending
//   • Recent Bookings table with Confirmed / Declined / Waiting status pills + actions
//   • Your Properties panel (right column)
//   • Property cards grid at the bottom
//   • Mobile: hamburger button opens a slide-in drawer
//   • Host vs Guest: completely different content & nav

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  HomeIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  StarIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  HeartIcon,
  GlobeAltIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  ChevronRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "./AuthContext";
import {
  ListingsDB,
  BookingsDB,
  listingToHotel,
  type Hotel,
  type Booking,
  type Listing,
} from "./index";

/* ─────────────── Helpers ─────────────── */

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
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/* ─────────────── Skeleton ─────────────── */
const Sk = ({ h = "h-8", w = "w-full" }: { h?: string; w?: string }) => (
  <div className={`${h} ${w} rounded-lg bg-white/6 animate-pulse`} />
);

/* ─────────────── Status pill ─────────────── */
const StatusPill = ({ status }: { status: Booking["status"] | "waiting" }) => {
  const cfg = {
    confirmed: {
      label: "Confirmed",
      bg: "#16a34a22",
      text: "#4ade80",
      border: "#16a34a44",
    },
    pending: {
      label: "Waiting",
      bg: "#d97706222",
      text: "#fbbf24",
      border: "#d9770644",
    },
    cancelled: {
      label: "Declined",
      bg: "#dc262622",
      text: "#f87171",
      border: "#dc262644",
    },
    waiting: {
      label: "Waiting",
      bg: "#d9770622",
      text: "#fbbf24",
      border: "#d9770644",
    },
  }[status] ?? {
    label: status,
    bg: "#ffffff11",
    text: "#ffffff88",
    border: "#ffffff22",
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border"
      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: cfg.text }}
      />
      {cfg.label}
    </span>
  );
};

/* ─────────────── Stat card (matches screenshot style) ─────────────── */
const StatCard = ({
  icon,
  label,
  value,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delay?: number;
}) => (
  <div
    className="bg-white rounded-2xl border border-gray-100 p-5 flex-1 min-w-0 shadow-sm"
    style={{ animation: `fadeUp 0.45s ease ${delay}ms both` }}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 font-['Cormorant_Garamond'] leading-none">
          {value}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  </div>
);

/* ─────────────── Property mini-card (right panel) ─────────────── */
const PropMini = ({ hotel }: { hotel: Hotel }) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer group">
    <div className="w-14 h-12 rounded-xl overflow-hidden shrink-0">
      <img
        src={
          hotel.thumbnail ||
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200"
        }
        alt={hotel.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200";
        }}
      />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 truncate">
        {hotel.name}
      </p>
      <p className="text-xs text-[#C9A96E] font-bold mt-0.5">
        ₦{(hotel.pricePerNight * 1600).toLocaleString()}
        <span className="text-gray-400 font-normal text-[10px]">/night</span>
      </p>
    </div>
  </div>
);

/* ─────────────── Property bottom card ─────────────── */
const PropCard = ({
  hotel,
  onBook,
}: {
  hotel: Hotel;
  onBook?: (h: Hotel) => void;
}) => (
  <div
    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer group"
    onClick={() => onBook?.(hotel)}
  >
    <div className="relative h-44 overflow-hidden">
      <img
        src={
          hotel.thumbnail ||
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"
        }
        alt={hotel.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400";
        }}
      />
      {hotel.featured && (
        <span className="absolute top-2 left-2 bg-[#C9A96E] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
          Featured
        </span>
      )}
    </div>
    <div className="p-4">
      <p className="font-semibold text-gray-800 text-sm truncate">
        {hotel.name}
      </p>
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-1">
          <MapPinIcon className="w-3 h-3 text-[#C9A96E]" />
          <p className="text-xs text-gray-400 truncate max-w-[120px]">
            {hotel.city}
          </p>
        </div>
        <p className="text-sm font-bold text-gray-900">
          ₦{(hotel.pricePerNight * 1600).toLocaleString()}
          <span className="text-gray-400 font-normal text-[10px]">/night</span>
        </p>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════ */

type NavKey =
  | "dashboard"
  | "properties"
  | "bookings"
  | "reviews"
  | "earnings"
  | "messages"
  | "settings"
  | "wishlist"
  | "history";

const HOST_NAV = [
  { key: "dashboard" as NavKey, label: "Dashboard", icon: HomeIcon },
  {
    key: "properties" as NavKey,
    label: "My Properties",
    icon: BuildingOffice2Icon,
  },
  { key: "bookings" as NavKey, label: "Bookings", icon: CalendarDaysIcon },
  { key: "reviews" as NavKey, label: "Reviews", icon: StarIcon },
  { key: "earnings" as NavKey, label: "Earnings", icon: BanknotesIcon },
  {
    key: "messages" as NavKey,
    label: "Messages",
    icon: ChatBubbleLeftRightIcon,
  },
  { key: "settings" as NavKey, label: "Settings", icon: Cog6ToothIcon },
];

const GUEST_NAV = [
  { key: "dashboard" as NavKey, label: "Overview", icon: HomeIcon },
  { key: "bookings" as NavKey, label: "My Bookings", icon: CalendarDaysIcon },
  { key: "wishlist" as NavKey, label: "Wishlist", icon: HeartIcon },
  { key: "history" as NavKey, label: "Travel History", icon: GlobeAltIcon },
  {
    key: "messages" as NavKey,
    label: "Messages",
    icon: ChatBubbleLeftRightIcon,
  },
  { key: "settings" as NavKey, label: "Settings", icon: Cog6ToothIcon },
];

const Sidebar = ({
  role,
  active,
  onNav,
  pendingCount,
  onClose,
  onLogout,
  isMobile,
}: {
  role: "host" | "guest";
  active: NavKey;
  onNav: (k: NavKey) => void;
  pendingCount: number;
  onClose?: () => void;
  onLogout: () => void;
  isMobile?: boolean;
}) => {
  const { user } = useAuth();
  const nav = role === "host" ? HOST_NAV : GUEST_NAV;

  return (
    <aside
      className="w-64 h-full flex flex-col relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #1a0f08 0%, #2d1a0e 40%, #1a0f08 100%)",
        backgroundImage: `
          linear-gradient(180deg, #1a0f08 0%, #2d1a0e 40%, #1a0f08 100%),
          url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A96E' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
        `,
      }}
    >
      {/* Gold top accent */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />

      {/* User profile */}
      <div className="px-5 pt-6 pb-5 border-b border-white/8 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#a07840] flex items-center justify-center shrink-0 shadow-lg">
          <span className="text-white font-bold text-base">
            {user?.avatar ?? user?.firstName?.[0] ?? "?"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              background:
                role === "host"
                  ? "rgba(201,169,110,0.2)"
                  : "rgba(110,173,201,0.2)",
              color: role === "host" ? "#C9A96E" : "#6EADC9",
            }}
          >
            {role}
          </span>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const isActive = active === item.key;
          const hasBadge = item.key === "bookings" && pendingCount > 0;
          return (
            <button
              key={item.key}
              onClick={() => {
                onNav(item.key);
                onClose?.();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
              style={
                isActive
                  ? { background: "linear-gradient(135deg, #C9A96E, #a07840)" }
                  : {}
              }
            >
              <item.icon
                className="w-4 h-4 shrink-0"
                style={{ width: 17, height: 17 }}
              />
              <span>{item.label}</span>
              {hasBadge && (
                <span className="ml-auto bg-white/20 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 pt-3 border-t border-white/8">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <ArrowRightOnRectangleIcon
            className="w-4 h-4"
            style={{ width: 17, height: 17 }}
          />
          Log Out
        </button>
      </div>
    </aside>
  );
};

/* ═══════════════════════════════════════════════════════════
   TOP BAR
═══════════════════════════════════════════════════════════ */
const TopBar = ({
  title,
  onHamburger,
  pendingCount,
}: {
  title: string;
  onHamburger: () => void;
  pendingCount: number;
}) => {
  const { user } = useAuth();
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onHamburger}
          className="lg:hidden w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-52">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            placeholder="Search...."
            className="bg-transparent text-sm text-gray-600 w-full outline-none placeholder:text-gray-400"
          />
        </div>

        {/* Bell */}
        <button className="relative w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
          <BellIcon className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#C9A96E] rounded-full" />
          )}
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#a07840] flex items-center justify-center cursor-pointer shadow-md">
          <span className="text-white font-bold text-sm">
            {user?.avatar ?? user?.firstName?.[0] ?? "?"}
          </span>
        </div>
      </div>
    </header>
  );
};

/* ═══════════════════════════════════════════════════════════
   HOST DASHBOARD CONTENT
═══════════════════════════════════════════════════════════ */
const HostContent = ({
  onNavigate,
  onBook,
}: {
  onNavigate: (k: NavKey) => void;
  onBook?: (h: Hotel) => void;
}) => {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionsOpen, setActionsOpen] = useState<string | null>(null);
  const actionsRef = useRef<HTMLTableDataCellElement>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      ListingsDB.byHost(user.id).then((l) => l.map(listingToHotel)),
      BookingsDB.byHost(user.id),
    ])
      .then(([h, b]) => {
        setHotels(h);
        setBookings(b);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Close actions menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        actionsRef.current &&
        !actionsRef.current.contains(e.target as Node)
      ) {
        setActionsOpen(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const earnings = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((s, b) => s + b.totalAmount, 0);
  const activeCount = bookings.filter((b) => b.status === "confirmed").length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const recentBk = [...bookings]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 8);

  const handleStatusChange = async (
    bookingId: string,
    status: Booking["status"],
  ) => {
    await BookingsDB.updateStatus(bookingId, status);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b)),
    );
    setActionsOpen(null);
  };

  return (
    <div
      className="p-6 space-y-6 bg-gray-50 min-h-full"
      style={{ animation: "fadeUp 0.35s ease both" }}
    >
      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.firstName} {user?.lastName}
        </h2>
        <p className="text-gray-400 mt-1 text-sm">
          Here is an overview of your property performance
        </p>
      </div>

      {/* Stat cards */}
      <div className="flex gap-4 flex-wrap">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-1 min-w-[140px] bg-white rounded-2xl p-5 border border-gray-100 h-20 animate-pulse"
            />
          ))
        ) : (
          <>
            <StatCard
              icon={<BuildingOffice2Icon className="w-5 h-5 text-[#C9A96E]" />}
              label="Total Listings"
              value={hotels.length}
              delay={0}
            />
            <StatCard
              icon={<CalendarDaysIcon className="w-5 h-5 text-[#C9A96E]" />}
              label="Active Bookings"
              value={activeCount}
              delay={60}
            />
            <StatCard
              icon={<BanknotesIcon className="w-5 h-5 text-[#C9A96E]" />}
              label="Earnings"
              value={fmt$(earnings)}
              delay={120}
            />
            <StatCard
              icon={<ClockIcon className="w-5 h-5 text-[#C9A96E]" />}
              label="Pending requests"
              value={pendingCount}
              delay={180}
            />
          </>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
        {/* ── Bookings table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">
              Recent Bookings
            </h3>
            <button
              onClick={() => onNavigate("bookings")}
              className="text-xs font-semibold text-[#C9A96E] hover:underline flex items-center gap-1"
            >
              View all <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Sk key={i} h="h-10" />
              ))}
            </div>
          ) : recentBk.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDaysIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No bookings yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Guests", "Property", "Date", "Status", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {recentBk.map((b, i) => (
                    <tr
                      key={b.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      style={{
                        animation: `fadeUp 0.35s ease ${i * 40}ms both`,
                      }}
                    >
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-medium text-gray-800">
                          {b.guestName}
                        </p>
                        <p className="text-xs text-gray-400">{b.guestEmail}</p>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-600 max-w-[140px] truncate">
                        {b.listingName}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                        {fmtDate(b.checkIn)}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusPill status={b.status} />
                      </td>
                      <td
                        className="px-6 py-3.5 relative"
                        ref={actionsOpen === b.id ? actionsRef : null}
                      >
                        <button
                          onClick={() =>
                            setActionsOpen(actionsOpen === b.id ? null : b.id)
                          }
                          className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <EllipsisHorizontalIcon className="w-4 h-4" />
                        </button>
                        {actionsOpen === b.id && (
                          <div className="absolute right-4 top-10 bg-white border border-gray-100 rounded-xl shadow-xl z-30 overflow-hidden w-40">
                            {b.status !== "confirmed" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(b.id, "confirmed")
                                }
                                className="w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors font-medium"
                              >
                                ✓ Confirm
                              </button>
                            )}
                            {b.status !== "cancelled" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(b.id, "cancelled")
                                }
                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                              >
                                ✕ Decline
                              </button>
                            )}
                            {b.status !== "pending" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(b.id, "pending")
                                }
                                className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors font-medium"
                              >
                                ⏳ Set Pending
                              </button>
                            )}
                            <div className="border-t border-gray-50" />
                            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                              View Details
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Your Properties panel ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">
              Your Properties
            </h3>
            <button
              onClick={() => onNavigate("properties")}
              className="text-xs font-semibold text-[#C9A96E] hover:underline flex items-center gap-1"
            >
              View all →
            </button>
          </div>

          <div className="flex-1 px-5 overflow-y-auto">
            {loading ? (
              <div className="py-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Sk key={i} h="h-14" />
                ))}
              </div>
            ) : hotels.length === 0 ? (
              <div className="py-10 text-center">
                <BuildingOffice2Icon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No listings yet</p>
                <button
                  onClick={() => onNavigate("properties")}
                  className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#C9A96E] mx-auto hover:underline"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Add listing
                </button>
              </div>
            ) : (
              hotels.map((h) => <PropMini key={h.id} hotel={h} />)
            )}
          </div>
        </div>
      </div>

      {/* Property cards grid */}
      {!loading && hotels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">All Properties</h3>
            <button
              onClick={() => onNavigate("properties")}
              className="text-sm font-semibold text-[#C9A96E] hover:underline"
            >
              Manage all →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {hotels.map((h, i) => (
              <div
                key={h.id}
                style={{ animation: `fadeUp 0.4s ease ${i * 60}ms both` }}
              >
                <PropCard hotel={h} onBook={onBook} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   GUEST DASHBOARD CONTENT
═══════════════════════════════════════════════════════════ */
const GuestContent = ({
  onNavigate,
  onBook,
}: {
  onNavigate: (k: NavKey) => void;
  onBook?: (h: Hotel) => void;
}) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlist, setWishlist] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const wids = user.wishlist ?? [];
    Promise.all([
      BookingsDB.byGuest(user.id),
      wids.length > 0
        ? Promise.all(wids.map((id) => ListingsDB.getById(id))).then((r) =>
            r
              .filter((item): item is Listing => item !== null)
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

  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.checkIn) >= new Date(),
  );
  const past = bookings.filter((b) => new Date(b.checkOut) < new Date());
  const totalNights = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((s, b) => s + b.nights, 0);
  const totalSpent = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div
      className="p-6 space-y-6 bg-gray-50 min-h-full"
      style={{ animation: "fadeUp 0.35s ease both" }}
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          {greeting()}, {user?.firstName} ✈️
        </h2>
        <p className="text-gray-400 mt-1 text-sm">
          Your luxury travel overview — all in one place.
        </p>
      </div>

      {/* Stat cards */}
      <div className="flex gap-4 flex-wrap">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-1 min-w-[140px] bg-white rounded-2xl p-5 border border-gray-100 h-20 animate-pulse"
            />
          ))
        ) : (
          <>
            <StatCard
              icon={<CalendarDaysIcon className="w-5 h-5 text-[#6EADC9]" />}
              label="Upcoming Stays"
              value={upcoming.length}
              delay={0}
            />
            <StatCard
              icon={<GlobeAltIcon className="w-5 h-5 text-[#6EADC9]" />}
              label="Total Trips"
              value={bookings.length}
              delay={60}
            />
            <StatCard
              icon={<ClockIcon className="w-5 h-5 text-[#6EADC9]" />}
              label="Nights Travelled"
              value={totalNights}
              delay={120}
            />
            <StatCard
              icon={<BanknotesIcon className="w-5 h-5 text-[#6EADC9]" />}
              label="Total Spent"
              value={fmt$(totalSpent)}
              delay={180}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
        {/* Upcoming bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">
              Upcoming Stays
            </h3>
            <button
              onClick={() => onNavigate("bookings")}
              className="text-xs font-semibold text-[#6EADC9] hover:underline flex items-center gap-1"
            >
              All bookings <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Sk key={i} h="h-16" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="p-12 text-center">
              <GlobeAltIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No upcoming stays</p>
              <button className="mt-2 text-xs font-semibold text-[#6EADC9] hover:underline">
                Explore properties →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      "Property",
                      "Check-in",
                      "Check-out",
                      "Nights",
                      "Total",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.slice(0, 6).map((b, i) => (
                    <tr
                      key={b.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      style={{
                        animation: `fadeUp 0.35s ease ${i * 40}ms both`,
                      }}
                    >
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">
                          {b.listingName}
                        </p>
                        <p className="text-xs text-gray-400">{b.ref}</p>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                        {fmtDate(b.checkIn)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                        {fmtDate(b.checkOut)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">
                        {b.nights}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-bold text-gray-800">
                        {fmt$(b.totalAmount)}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusPill status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Wishlist panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">
              Saved Properties
            </h3>
            <button
              onClick={() => onNavigate("wishlist")}
              className="text-xs font-semibold text-[#6EADC9] hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="flex-1 px-5 overflow-y-auto">
            {loading ? (
              <div className="py-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Sk key={i} h="h-14" />
                ))}
              </div>
            ) : wishlist.length === 0 ? (
              <div className="py-10 text-center">
                <HeartIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No saved properties</p>
              </div>
            ) : (
              wishlist.map((h) => <PropMini key={h.id} hotel={h} />)
            )}
          </div>
        </div>
      </div>

      {/* Travel history */}
      {!loading && past.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">
              Travel History
            </h3>
            <button
              onClick={() => onNavigate("history")}
              className="text-xs font-semibold text-[#6EADC9] hover:underline flex items-center gap-1"
            >
              View all <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">
            {past.slice(0, 3).map((b, i) => (
              <div
                key={b.id}
                className="p-5"
                style={{ animation: `fadeUp 0.4s ease ${i * 60}ms both` }}
              >
                <div className="flex justify-between mb-1.5">
                  <p className="text-sm font-semibold text-gray-800 truncate pr-2">
                    {b.listingName}
                  </p>
                  <StatusPill status={b.status} />
                </div>
                <p className="text-xs text-gray-400">
                  {fmtDate(b.checkIn)} — {fmtDate(b.checkOut)}
                </p>
                <p className="text-base font-bold text-gray-900 mt-1">
                  {fmt$(b.totalAmount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wishlist property cards */}
      {!loading && wishlist.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-4">
            Properties You've Saved
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {wishlist.map((h, i) => (
              <div
                key={h.id}
                style={{ animation: `fadeUp 0.4s ease ${i * 60}ms both` }}
              >
                <PropCard hotel={h} onBook={onBook} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PLACEHOLDER for other nav sections
═══════════════════════════════════════════════════════════ */
const PlaceholderSection = ({
  navKey,
  onBack,
}: {
  navKey: NavKey;
  onBack: () => void;
}) => {
  const icons: Record<string, React.ElementType> = {
    properties: BuildingOffice2Icon,
    bookings: CalendarDaysIcon,
    reviews: StarIcon,
    earnings: BanknotesIcon,
    messages: ChatBubbleLeftRightIcon,
    settings: Cog6ToothIcon,
    wishlist: HeartIcon,
    history: GlobeAltIcon,
  };
  const Icon = icons[navKey] ?? HomeIcon;
  const label = navKey.charAt(0).toUpperCase() + navKey.slice(1);

  return (
    <div
      className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-10 text-center"
      style={{ animation: "fadeUp 0.35s ease both" }}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-[#C9A96E]" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-1">{label}</h2>
      <p className="text-gray-400 text-sm max-w-xs">
        This section is ready — connect your {label.toLowerCase()} components
        here.
      </p>
      <button
        onClick={onBack}
        className="mt-6 text-sm font-semibold text-[#C9A96E] hover:underline"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════ */
interface DashboardProps {
  onBook?: (hotel: Hotel) => void;
  onLogout?: () => void;
}

const Dashboard = ({ onBook, onLogout }: DashboardProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = (user?.role ?? "guest") as "host" | "guest";

  const [activeNav, setActiveNav] = useState<NavKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user || role !== "host") return;
    BookingsDB.byHost(user.id).then((b) =>
      setPendingCount(b.filter((bk) => bk.status === "pending").length),
    );
  }, [user, role]);

  const handleLogout = useCallback(async () => {
    await logout();
    if (onLogout) onLogout();
    else navigate("/login");
  }, [logout, navigate, onLogout]);

  const PAGE_TITLE: Record<NavKey, string> = {
    dashboard: "Dashboard",
    properties: "My Properties",
    bookings: "Bookings",
    reviews: "Reviews",
    earnings: "Earnings",
    messages: "Messages",
    settings: "Settings",
    wishlist: "Wishlist",
    history: "Travel History",
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar
          role={role}
          active={activeNav}
          onNav={setActiveNav}
          pendingCount={pendingCount}
          onClose={() => setMobileOpen(false)}
          onLogout={handleLogout}
          isMobile
        />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar
          role={role}
          active={activeNav}
          onNav={setActiveNav}
          pendingCount={pendingCount}
          onLogout={handleLogout}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title={PAGE_TITLE[activeNav]}
          onHamburger={() => setMobileOpen(true)}
          pendingCount={pendingCount}
        />

        <main className="flex-1 overflow-y-auto">
          {activeNav === "dashboard" && role === "host" && (
            <HostContent onNavigate={setActiveNav} onBook={onBook} />
          )}
          {activeNav === "dashboard" && role === "guest" && (
            <GuestContent onNavigate={setActiveNav} onBook={onBook} />
          )}
          {activeNav !== "dashboard" && (
            <PlaceholderSection
              navKey={activeNav}
              onBack={() => setActiveNav("dashboard")}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
