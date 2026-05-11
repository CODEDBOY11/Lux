// src/pages/Dashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Complete dashboard — every nav section live-connected to Supabase.
//
// HOST sections:    Dashboard · My Properties (Add/Edit/Delete) · Bookings · Reviews · Earnings · Settings
// GUEST sections:   Dashboard · My Bookings · Wishlist · Travel History · Settings
// Shared:           Messages (placeholder) · Hamburger mobile drawer · Dark wood sidebar
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
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
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  PhotoIcon,
  UserIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { useAuth } from "./AuthContext";
import {
  ListingsDB,
  BookingsDB,
  listingToHotel,
  type Hotel,
  type Booking,
  type Listing,
} from "./index";
import GuestDashboard from "./GuestDashboard";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────── */
const Sk = ({
  h = "h-8",
  rounded = "rounded-xl",
}: {
  h?: string;
  rounded?: string;
}) => <div className={`w-full ${h} ${rounded} bg-gray-100 animate-pulse`} />;

/* ─────────────────────────────────────────────────────────
   STATUS PILL
───────────────────────────────────────────────────────── */
const StatusPill = ({ status }: { status: string }) => {
  const cfg: Record<string, { label: string; cls: string }> = {
    confirmed: {
      label: "Confirmed",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    pending: {
      label: "Waiting",
      cls: "bg-amber-50  text-amber-700  border-amber-200",
    },
    cancelled: {
      label: "Declined",
      cls: "bg-red-50    text-red-600    border-red-200",
    },
  };
  const s = cfg[status] ?? {
    label: status,
    cls: "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${s.cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {s.label}
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
  delay = 0,
  sub,
  accent = "#C9A96E",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delay?: number;
  sub?: string;
  accent?: string;
}) => (
  <div
    className="bg-white rounded-2xl border border-gray-100 p-5 flex-1 min-w-[140px] shadow-sm hover:shadow-md transition-all duration-200"
    style={{ animation: `fadeUp 0.4s ease ${delay}ms both` }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
      style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
    >
      {icon}
    </div>
    <p className="text-2xl font-bold text-gray-900 font-['Cormorant_Garamond'] leading-none">
      {value}
    </p>
    <p className="text-xs text-gray-400 mt-1">{label}</p>
    {sub && (
      <p className="text-[10px] mt-0.5 font-medium" style={{ color: accent }}>
        {sub}
      </p>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────── */
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
  pending,
  onClose,
  onLogout,
  isMobile,
}: {
  role: "host" | "guest";
  active: NavKey;
  onNav: (k: NavKey) => void;
  pending: number;
  onClose?: () => void;
  onLogout: () => void;
  isMobile?: boolean;
}) => {
  const { user } = useAuth();
  const nav = role === "host" ? HOST_NAV : GUEST_NAV;
  const isGuest = role === "guest";

  return (
    <aside
      className="w-64 h-full flex flex-col relative"
      style={{
        background:
          "linear-gradient(180deg,#160e08 0%,#261508 55%,#160e08 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A96E' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent relative z-10" />

      {/* User block */}
      <div className="relative z-10 px-5 pt-6 pb-5 border-b border-white/8 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-base shadow-lg"
          style={{
            background: isGuest
              ? "linear-gradient(135deg,#6EADC9,#4a8aad)"
              : "linear-gradient(135deg,#C9A96E,#8a6030)",
          }}
        >
          {user?.avatar ?? user?.firstName?.[0] ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              background: isGuest
                ? "rgba(110,173,201,0.2)"
                : "rgba(201,169,110,0.2)",
              color: isGuest ? "#6EADC9" : "#C9A96E",
            }}
          >
            {role}
          </span>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 relative z-10 px-3 pt-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          const hasBadge = key === "bookings" && pending > 0;
          return (
            <button
              key={key}
              onClick={() => {
                onNav(key);
                onClose?.();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? "text-white shadow-md" : "text-white/50 hover:text-white/80 hover:bg-white/5"}`}
              style={
                isActive
                  ? {
                      background: isGuest
                        ? "linear-gradient(135deg,#6EADC9,#4a8aad)"
                        : "linear-gradient(135deg,#C9A96E,#9a7030)",
                    }
                  : {}
              }
            >
              <Icon style={{ width: 17, height: 17 }} className="shrink-0" />
              <span>{label}</span>
              {hasBadge && (
                <span className="ml-auto bg-white/20 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {pending > 9 ? "9+" : pending}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="relative z-10 px-3 pb-5 pt-3 border-t border-white/8">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-red-400 hover:bg-red-500/8 transition-all"
        >
          <ArrowRightOnRectangleIcon
            style={{ width: 17, height: 17 }}
            className="shrink-0"
          />
          Log Out
        </button>
      </div>
    </aside>
  );
};

/* ─────────────────────────────────────────────────────────
   TOP BAR
───────────────────────────────────────────────────────── */
const TopBar = ({
  title,
  onHamburger,
  pending,
}: {
  title: string;
  onHamburger: () => void;
  pending: number;
}) => {
  const { user } = useAuth();
  const isGuest = user?.role === "guest";
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-5 shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onHamburger}
          className="lg:hidden w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-48">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            placeholder="Search..."
            className="bg-transparent text-sm text-gray-600 w-full outline-none placeholder:text-gray-400"
          />
        </div>
        <button className="relative w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
          <BellIcon className="w-4 h-4" />
          {pending > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: isGuest ? "#6EADC9" : "#C9A96E" }}
            />
          )}
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm cursor-pointer text-white text-sm font-bold"
          style={{
            background: isGuest
              ? "linear-gradient(135deg,#6EADC9,#4a8aad)"
              : "linear-gradient(135deg,#C9A96E,#8a6030)",
          }}
        >
          {user?.avatar ?? user?.firstName?.[0] ?? "?"}
        </div>
      </div>
    </header>
  );
};

/* ═══════════════════════════════════════════════════════════
   ADD / EDIT LISTING FORM
═══════════════════════════════════════════════════════════ */
const AMENITIES_LIST = [
  "Free WiFi",
  "Private Pool",
  "Butler Service",
  "Sea View",
  "Air Conditioning",
  "Concierge",
  "Fine Dining",
  "Spa Island",
  "Airport Transfer",
  "BBQ",
  "Wine Cellar",
  "Netflix",
  "Daily Cleaning",
  "Water Sports",
  "Kids Club",
  "Gym",
  "Parking",
  "Fireplace",
  "Hot Tub",
  "Pet Friendly",
  "Mountain View",
  "Ocean Front",
  "Rooftop Terrace",
  "Helipad",
];

type LForm = {
  name: string;
  description: string;
  location: string;
  city: string;
  country: string;
  category: Listing["category"];
  pricePerNight: string;
  bedrooms: string;
  bathrooms: string;
  maxGuests: string;
  amenities: string[];
  tags: string;
  images: string;
  featured: boolean;
  available: boolean;
};

const BLANK: LForm = {
  name: "",
  description: "",
  location: "",
  city: "",
  country: "",
  category: "villa",
  pricePerNight: "",
  bedrooms: "1",
  bathrooms: "1",
  maxGuests: "2",
  amenities: [],
  tags: "",
  images: "",
  featured: false,
  available: true,
};

const ListingForm = ({
  editing,
  onSave,
  onCancel,
  hostId,
  hostName,
}: {
  editing: Hotel | null;
  onSave: (h: Hotel) => void;
  onCancel: () => void;
  hostId: string;
  hostName: string;
}) => {
  const [form, setForm] = useState<LForm>(
    editing
      ? {
          name: editing.name,
          description: editing.description,
          location: editing.location,
          city: editing.city,
          country: editing.country,
          category: editing.category,
          pricePerNight: String(editing.pricePerNight),
          bedrooms: String(editing.bedrooms),
          bathrooms: String(editing.bathrooms),
          maxGuests: String(editing.maxGuests),
          amenities: editing.amenities,
          tags: editing.tags.join(", "),
          images: editing.images.join("\n"),
          featured: editing.featured,
          available: editing.available,
        }
      : BLANK,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof LForm) => (v: string | boolean | string[]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const counter = (
    k: "bedrooms" | "bathrooms" | "maxGuests",
    delta: number,
  ) => {
    const min = k === "maxGuests" ? 1 : 0;
    set(k)(String(Math.max(min, Number(form[k]) + delta)));
  };

  const toggleAmenity = (a: string) =>
    set("amenities")(
      form.amenities.includes(a)
        ? form.amenities.filter((x) => x !== a)
        : [...form.amenities, a],
    );

  const save = async () => {
    if (!form.name.trim() || !form.city.trim() || !form.pricePerNight) {
      setError("Name, city and price per night are required.");
      return;
    }
    if (isNaN(Number(form.pricePerNight)) || Number(form.pricePerNight) <= 0) {
      setError("Price must be a positive number.");
      return;
    }
    setSaving(true);
    setError("");
    const images = form.images
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const tags = form.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        category: form.category,
        pricePerNight: Number(form.pricePerNight),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        maxGuests: Number(form.maxGuests),
        amenities: form.amenities,
        tags,
        images,
        featured: form.featured,
        available: form.available,
      };
      let result: Listing;
      if (editing) {
        const u = await ListingsDB.update(editing.id, payload);
        if (!u)
          throw new Error("Update failed — check your Supabase connection.");
        result = u;
      } else {
        result = await ListingsDB.add({ hostId, hostName, ...payload });
      }
      onSave(listingToHotel(result));
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const inp =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/10 transition-all bg-white";
  const lbl =
    "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5";
  const previewUrls = form.images
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-50"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="max-w-2xl mx-auto p-6 pb-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-7">
          <button
            onClick={onCancel}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors bg-white"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editing ? "Edit Listing" : "Add New Listing"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {editing
                ? "Update your property details"
                : "Fill in the details below to publish your property"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
            <XMarkIcon className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <div className="space-y-5">
          {/* ── Basic info ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
              <BuildingOffice2Icon className="w-4 h-4 text-[#C9A96E]" /> Basic
              Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className={lbl}>Property Name *</label>
                <input
                  className={inp}
                  value={form.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder="e.g. Villa Lumière Côte d'Azur"
                />
              </div>
              <div>
                <label className={lbl}>Description</label>
                <textarea
                  className={inp + " resize-none"}
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description")(e.target.value)}
                  placeholder="What makes this property special..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Category *</label>
                  <select
                    className={inp}
                    value={form.category}
                    onChange={(e) =>
                      set("category")(e.target.value as Listing["category"])
                    }
                  >
                    {(
                      [
                        "villa",
                        "apartment",
                        "resort",
                        "boutique",
                        "penthouse",
                      ] as const
                    ).map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Price Per Night (USD) *</label>
                  <input
                    className={inp}
                    type="number"
                    min="1"
                    value={form.pricePerNight}
                    onChange={(e) => set("pricePerNight")(e.target.value)}
                    placeholder="500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-5">
                {(["featured", "available"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set(k)(!form[k])}
                    className="flex items-center gap-2 group"
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${form[k] ? "bg-[#C9A96E] border-[#C9A96E]" : "border-gray-300 group-hover:border-[#C9A96E]"}`}
                      style={{ width: 18, height: 18 }}
                    >
                      {form[k] && (
                        <CheckCircleIcon
                          className="w-3 h-3 text-white"
                          style={{ width: 11, height: 11 }}
                        />
                      )}
                    </div>
                    <span className="text-sm text-gray-600 capitalize">
                      {k === "featured"
                        ? "Featured property"
                        : "Available / Live"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Location ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-[#C9A96E]" /> Location
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={lbl}>Full Address / Area</label>
                <input
                  className={inp}
                  value={form.location}
                  onChange={(e) => set("location")(e.target.value)}
                  placeholder="e.g. Èze-sur-Mer, Côte d'Azur"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>City *</label>
                  <input
                    className={inp}
                    value={form.city}
                    onChange={(e) => set("city")(e.target.value)}
                    placeholder="Paris"
                  />
                </div>
                <div>
                  <label className={lbl}>Country</label>
                  <input
                    className={inp}
                    value={form.country}
                    onChange={(e) => set("country")(e.target.value)}
                    placeholder="France"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Capacity ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[#C9A96E]" /> Capacity
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {(
                [
                  ["bedrooms", "Bedrooms"],
                  ["bathrooms", "Bathrooms"],
                  ["maxGuests", "Max Guests"],
                ] as const
              ).map(([k, lbl2]) => (
                <div key={k}>
                  <label className={lbl}>{lbl2}</label>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => counter(k, -1)}
                      className="px-3 py-2.5 text-gray-400 hover:bg-gray-50 font-bold transition-colors"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-sm font-bold text-gray-900">
                      {form[k]}
                    </span>
                    <button
                      type="button"
                      onClick={() => counter(k, 1)}
                      className="px-3 py-2.5 text-gray-400 hover:bg-gray-50 font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Amenities ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 text-sm mb-1 flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-[#C9A96E]" /> Amenities
              <span className="text-xs font-normal text-gray-400">
                ({form.amenities.length} selected)
              </span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Select everything available at your property
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITIES_LIST.map((a) => {
                const on = form.amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${on ? "bg-[#C9A96E]/8 border-[#C9A96E]/40 text-[#C9A96E]" : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-100"}`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${on ? "bg-[#C9A96E] border-[#C9A96E]" : "border-gray-300"}`}
                    >
                      {on && (
                        <span className="text-white text-[8px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Tags & Images ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
              <PhotoIcon className="w-4 h-4 text-[#C9A96E]" /> Tags & Photos
            </h3>
            <div className="space-y-4">
              <div>
                <label className={lbl}>Tags (comma-separated)</label>
                <input
                  className={inp}
                  value={form.tags}
                  onChange={(e) => set("tags")(e.target.value)}
                  placeholder="Romantic, Sea View, Private, Luxury"
                />
              </div>
              <div>
                <label className={lbl}>Image URLs (one per line)</label>
                <textarea
                  className={inp + " resize-none font-mono text-xs"}
                  rows={4}
                  value={form.images}
                  onChange={(e) => set("images")(e.target.value)}
                  placeholder={
                    "https://images.unsplash.com/photo-…?w=800\nhttps://…"
                  }
                />
                <p className="text-xs text-gray-400 mt-1">
                  First URL becomes the main thumbnail. Use direct image links.
                </p>
              </div>
              {previewUrls.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {previewUrls.slice(0, 6).map((url, i) => (
                    <div
                      key={i}
                      className="relative w-20 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (
                            e.target as HTMLImageElement
                          ).parentElement!.style.opacity = "0.3";
                        }}
                      />
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 font-bold">
                          MAIN
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Save ── */}
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 bg-[#C9A96E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl text-sm hover:bg-[#b8935a] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#C9A96E]/20 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : editing ? (
                "Update Listing"
              ) : (
                "Publish Listing"
              )}
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 bg-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   HOST: PROPERTIES SECTION
═══════════════════════════════════════════════════════════ */
const PropertiesSection = ({ onBook }: { onBook?: (h: Hotel) => void }) => {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Hotel | null | "new">(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setHotels((await ListingsDB.byHost(user.id)).map(listingToHotel));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (editing !== null) {
    return (
      <ListingForm
        editing={editing === "new" ? null : editing}
        hostId={user!.id}
        hostName={`${user!.firstName} ${user!.lastName}`}
        onSave={(saved) => {
          setHotels((prev) =>
            editing === "new"
              ? [saved, ...prev]
              : prev.map((h) => (h.id === saved.id ? saved : h)),
          );
          setEditing(null);
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-50 p-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Properties</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {loading
              ? "Loading…"
              : `${hotels.length} listing${hotels.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 bg-[#C9A96E] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#b8935a] transition-all hover:scale-105 shadow-md shadow-[#C9A96E]/20"
        >
          <PlusIcon className="w-4 h-4" /> Add Listing
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <Sk key={i} h="h-72" rounded="rounded-2xl" />
          ))}
        </div>
      ) : hotels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center mb-4">
            <BuildingOffice2Icon className="w-7 h-7 text-[#C9A96E]" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-1">
            No listings yet
          </h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs">
            Add your first property to start receiving bookings from guests.
          </p>
          <button
            onClick={() => setEditing("new")}
            className="flex items-center gap-2 bg-[#C9A96E] text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[#b8935a] transition-all"
          >
            <PlusIcon className="w-4 h-4" /> Add Your First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {hotels.map((hotel, i) => (
            <div
              key={hotel.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
              style={{ animation: `fadeUp 0.4s ease ${i * 55}ms both` }}
            >
              <div
                className="relative h-44 overflow-hidden cursor-pointer"
                onClick={() => onBook?.(hotel)}
              >
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
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {hotel.featured && (
                    <span className="bg-[#C9A96E] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${hotel.available ? "bg-emerald-500 text-white" : "bg-gray-400 text-white"}`}
                  >
                    {hotel.available ? "Live" : "Hidden"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="font-bold text-gray-800 text-sm truncate mb-0.5">
                  {hotel.name}
                </p>
                <div className="flex items-center gap-1 mb-3">
                  <MapPinIcon className="w-3 h-3 text-[#C9A96E] shrink-0" />
                  <p className="text-xs text-gray-400 truncate">
                    {hotel.city}, {hotel.country}
                  </p>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-gray-900">
                    {fmt$(hotel.pricePerNight)}
                    <span className="text-xs text-gray-400 font-normal">
                      /night
                    </span>
                  </p>
                  {hotel.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <StarSolid className="w-3 h-3 text-[#C9A96E]" />
                      <span className="text-xs font-semibold text-gray-600">
                        {hotel.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(hotel)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 py-2 rounded-xl transition-colors"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={async () => {
                      const u = await ListingsDB.update(hotel.id, {
                        available: !hotel.available,
                      });
                      if (u)
                        setHotels((prev) =>
                          prev.map((h) =>
                            h.id === hotel.id ? listingToHotel(u) : h,
                          ),
                        );
                    }}
                    className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-colors ${hotel.available ? "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100" : "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"}`}
                  >
                    {hotel.available ? "Hide" : "Publish"}
                  </button>
                  <button
                    disabled={deleting === hotel.id}
                    onClick={async () => {
                      if (!confirm("Delete this listing permanently?")) return;
                      setDeleting(hotel.id);
                      await ListingsDB.delete(hotel.id);
                      setHotels((prev) =>
                        prev.filter((h) => h.id !== hotel.id),
                      );
                      setDeleting(null);
                    }}
                    className="w-9 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl transition-colors disabled:opacity-40"
                  >
                    {deleting === hotel.id ? (
                      <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <TrashIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   HOST: BOOKINGS SECTION
═══════════════════════════════════════════════════════════ */
const HostBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Booking["status"]>("all");
  const [actions, setActions] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    BookingsDB.byHost(user.id)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [user]);

  const changeStatus = async (id: string, s: Booking["status"]) => {
    await BookingsDB.updateStatus(id, s);
    setBookings((p) => p.map((b) => (b.id === id ? { ...b, status: s } : b)));
    setActions(null);
  };

  const counts = {
    all: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };
  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-50 p-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          {bookings.length} total reservation{bookings.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap mb-5">
        {(["all", "confirmed", "pending", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all ${filter === f ? "bg-[#C9A96E] border-[#C9A96E] text-white shadow-sm" : "border-gray-200 text-gray-500 bg-white hover:border-[#C9A96E]"}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Sk key={i} h="h-11" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-14 text-center">
            <CalendarDaysIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No bookings</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    "Guest",
                    "Property",
                    "Check-in",
                    "Check-out",
                    "Nights",
                    "Total",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => (
                  <tr
                    key={b.id}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                    style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both` }}
                  >
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-800">
                        {b.guestName}
                      </p>
                      <p className="text-xs text-gray-400">{b.guestEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 max-w-[120px] truncate">
                      {b.listingName}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {fmtDate(b.checkIn)}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {fmtDate(b.checkOut)}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {b.nights}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-gray-800">
                      {fmt$(b.totalAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="px-5 py-3 relative">
                      <button
                        onClick={() =>
                          setActions(actions === b.id ? null : b.id)
                        }
                        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                      >
                        <EllipsisHorizontalIcon className="w-4 h-4" />
                      </button>
                      {actions === b.id && (
                        <div
                          className="absolute right-3 top-10 bg-white border border-gray-100 rounded-xl shadow-xl z-30 overflow-hidden min-w-[148px]"
                          onMouseLeave={() => setActions(null)}
                        >
                          {b.status !== "confirmed" && (
                            <button
                              onClick={() => changeStatus(b.id, "confirmed")}
                              className="w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 font-medium"
                            >
                              ✓ Confirm
                            </button>
                          )}
                          {b.status !== "cancelled" && (
                            <button
                              onClick={() => changeStatus(b.id, "cancelled")}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-medium"
                            >
                              ✕ Decline
                            </button>
                          )}
                          {b.status !== "pending" && (
                            <button
                              onClick={() => changeStatus(b.id, "pending")}
                              className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 font-medium"
                            >
                              ⏳ Set Pending
                            </button>
                          )}
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
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   HOST: REVIEWS
═══════════════════════════════════════════════════════════ */
const ReviewsSection = () => {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    ListingsDB.byHost(user.id)
      .then((l) => setHotels(l.map(listingToHotel)))
      .finally(() => setLoading(false));
  }, [user]);

  const avg = hotels.length
    ? (hotels.reduce((s, h) => s + h.rating, 0) / hotels.length).toFixed(1)
    : "—";
  const totalReviews = hotels.reduce((s, h) => s + h.reviewCount, 0);

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-50 p-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          Ratings across your properties
        </p>
      </div>
      <div className="flex gap-4 flex-wrap mb-6">
        <StatCard
          icon={<StarSolid className="w-5 h-5 text-[#C9A96E]" />}
          label="Avg Rating"
          value={avg}
          delay={0}
        />
        <StatCard
          icon={<ChatBubbleLeftRightIcon className="w-5 h-5 text-[#C9A96E]" />}
          label="Total Reviews"
          value={totalReviews}
          delay={60}
        />
        <StatCard
          icon={<BuildingOffice2Icon className="w-5 h-5 text-[#C9A96E]" />}
          label="Properties Rated"
          value={hotels.filter((h) => h.reviewCount > 0).length}
          delay={120}
        />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Property Ratings</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <Sk key={i} h="h-16" />
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="p-12 text-center">
            <StarIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No properties yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {hotels.map((h, i) => (
              <div
                key={h.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                style={{ animation: `fadeUp 0.35s ease ${i * 50}ms both` }}
              >
                <div className="w-14 h-12 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={
                      h.thumbnail ||
                      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200"
                    }
                    alt={h.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate text-sm">
                    {h.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {h.city}, {h.country}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-0.5 justify-end mb-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <StarSolid
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= Math.round(h.rating) ? "text-[#C9A96E]" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    {h.rating > 0 ? h.rating.toFixed(1) : "No rating"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {h.reviewCount} review{h.reviewCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   HOST: EARNINGS
═══════════════════════════════════════════════════════════ */
const EarningsSection = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    BookingsDB.byHost(user.id)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [user]);

  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const total = confirmed.reduce((s, b) => s + b.totalAmount, 0);
  const avgBooking = confirmed.length
    ? Math.round(total / confirmed.length)
    : 0;
  const totalNights = confirmed.reduce((s, b) => s + b.nights, 0);

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-50 p-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Earnings</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          Revenue from confirmed bookings
        </p>
      </div>
      <div className="flex gap-4 flex-wrap mb-6">
        <StatCard
          icon={<BanknotesIcon className="w-5 h-5 text-[#C9A96E]" />}
          label="Total Earnings"
          value={fmt$(total)}
          delay={0}
          sub="All confirmed bookings"
        />
        <StatCard
          icon={<CalendarDaysIcon className="w-5 h-5 text-[#C9A96E]" />}
          label="Confirmed Bookings"
          value={confirmed.length}
          delay={60}
        />
        <StatCard
          icon={<ArrowTrendingUpIcon className="w-5 h-5 text-[#C9A96E]" />}
          label="Avg Per Booking"
          value={fmt$(avgBooking)}
          delay={120}
        />
        <StatCard
          icon={<ClockIcon className="w-5 h-5 text-[#C9A96E]" />}
          label="Total Nights Booked"
          value={totalNights}
          delay={180}
        />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Earnings History</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <Sk key={i} h="h-10" />
            ))}
          </div>
        ) : confirmed.length === 0 ? (
          <div className="p-12 text-center">
            <BanknotesIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No confirmed bookings yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Guest", "Property", "Dates", "Nights", "Earned"].map(
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
                {confirmed.map((b, i) => (
                  <tr
                    key={b.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both` }}
                  >
                    <td className="px-6 py-3.5 text-sm font-medium text-gray-800">
                      {b.guestName}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-600 truncate max-w-[140px]">
                      {b.listingName}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {b.nights}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-bold text-emerald-600">
                      {fmt$(b.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   SETTINGS (shared)
═══════════════════════════════════════════════════════════ */
const SettingsSection = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    company: user?.company ?? "",
    country: user?.country ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isGuest = user?.role === "guest";

  const save = async () => {
    setSaving(true);
    await updateUser(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inp =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/10 transition-all bg-white";
  const lbl =
    "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5";
  const accent = isGuest ? "#6EADC9" : "#C9A96E";

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-50 p-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          Manage your account profile
        </p>
      </div>
      <div className="max-w-lg space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
              style={{
                background: isGuest
                  ? "linear-gradient(135deg,#6EADC9,#4a8aad)"
                  : "linear-gradient(135deg,#C9A96E,#8a6030)",
              }}
            >
              {user?.avatar ?? user?.firstName?.[0] ?? "?"}
            </div>
            <div>
              <p className="font-bold text-gray-800">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isGuest ? "Guest Traveller" : "Property Host"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: accent }}>
                {user?.emailVerified
                  ? "✓ Email verified"
                  : "⚠ Email not verified"}
              </p>
            </div>
          </div>

          <h3 className="font-bold text-gray-800 text-sm mb-4">
            Profile Information
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
              <label className={lbl}>Email (cannot change)</label>
              <input
                className={inp + " bg-gray-50 text-gray-400 cursor-not-allowed"}
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
            <div className="grid grid-cols-2 gap-4">
              {!isGuest && (
                <div>
                  <label className={lbl}>Company / Property</label>
                  <input
                    className={inp}
                    value={form.company}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, company: e.target.value }))
                    }
                  />
                </div>
              )}
              <div>
                <label className={lbl}>Country</label>
                <input
                  className={inp}
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full text-white font-bold py-3.5 rounded-2xl text-sm transition-all hover:scale-[1.01] shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: accent, boxShadow: `0 8px 24px ${accent}30` }}
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : saved ? (
            "✓ Changes Saved!"
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
};

const Messages = () => (
  <div
    className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-10 text-center"
    style={{ animation: "fadeUp 0.3s ease both" }}
  >
    <div className="w-16 h-16 rounded-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center mb-4">
      <ChatBubbleLeftRightIcon className="w-7 h-7 text-[#C9A96E]" />
    </div>
    <h2 className="text-xl font-bold text-gray-800 mb-2">Messages</h2>
    <p className="text-gray-400 text-sm max-w-xs">
      Connect this section to Supabase Realtime, Firebase, or a messaging
      service like Sendbird.
    </p>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   HOST DASHBOARD HOME
═══════════════════════════════════════════════════════════ */
const HostHome = ({
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
  const [actions, setActions] = useState<string | null>(null);

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

  const changeStatus = async (id: string, s: Booking["status"]) => {
    await BookingsDB.updateStatus(id, s);
    setBookings((p) => p.map((b) => (b.id === id ? { ...b, status: s } : b)));
    setActions(null);
  };

  const earnings = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((s, b) => s + b.totalAmount, 0);
  const active = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const recent = [...bookings]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 8);

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.firstName} {user?.lastName}
        </h2>
        <p className="text-gray-400 mt-1 text-sm">
          Here is an overview of your property performance
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-1 min-w-[140px] bg-white rounded-2xl p-5 border border-gray-100 h-24 animate-pulse"
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
              value={active}
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
              label="Pending Requests"
              value={pending}
              delay={180}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-6">
        {/* Bookings table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Recent Bookings</h3>
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
          ) : recent.length === 0 ? (
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
                          className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((b, i) => (
                    <tr
                      key={b.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      style={{ animation: `fadeUp 0.3s ease ${i * 35}ms both` }}
                    >
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-800">
                          {b.guestName}
                        </p>
                        <p className="text-xs text-gray-400">{b.guestEmail}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 max-w-[120px] truncate">
                        {b.listingName}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {fmtDate(b.checkIn)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={b.status} />
                      </td>
                      <td className="px-5 py-3 relative">
                        <button
                          onClick={() =>
                            setActions(actions === b.id ? null : b.id)
                          }
                          className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                        >
                          <EllipsisHorizontalIcon className="w-4 h-4" />
                        </button>
                        {actions === b.id && (
                          <div
                            className="absolute right-2 top-9 bg-white border border-gray-100 rounded-xl shadow-xl z-30 overflow-hidden min-w-[148px]"
                            onMouseLeave={() => setActions(null)}
                          >
                            {b.status !== "confirmed" && (
                              <button
                                onClick={() => changeStatus(b.id, "confirmed")}
                                className="w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 font-medium"
                              >
                                ✓ Confirm
                              </button>
                            )}
                            {b.status !== "cancelled" && (
                              <button
                                onClick={() => changeStatus(b.id, "cancelled")}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-medium"
                              >
                                ✕ Decline
                              </button>
                            )}
                            {b.status !== "pending" && (
                              <button
                                onClick={() => changeStatus(b.id, "pending")}
                                className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 font-medium"
                              >
                                ⏳ Set Pending
                              </button>
                            )}
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

        {/* Properties panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Your Properties</h3>
            <button
              onClick={() => onNavigate("properties")}
              className="text-xs font-semibold text-[#C9A96E] hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Sk key={i} h="h-14" />
                ))}
              </div>
            ) : hotels.length === 0 ? (
              <div className="p-8 text-center">
                <BuildingOffice2Icon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No listings yet</p>
                <button
                  onClick={() => onNavigate("properties")}
                  className="mt-2 text-xs font-semibold text-[#C9A96E] hover:underline flex items-center gap-1 mx-auto"
                >
                  <PlusIcon className="w-3 h-3" />
                  Add listing
                </button>
              </div>
            ) : (
              hotels.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => onBook?.(h)}
                >
                  <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={
                        h.thumbnail ||
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200"
                      }
                      alt={h.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {h.name}
                    </p>
                    <p className="text-xs text-[#C9A96E] font-bold">
                      {fmt$(h.pricePerNight)}
                      <span className="text-gray-400 font-normal">/n</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* All property cards */}
      {!loading && hotels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">All Properties</h3>
            <button
              onClick={() => onNavigate("properties")}
              className="text-sm font-semibold text-[#C9A96E] hover:underline"
            >
              Manage →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {hotels.map((h, i) => (
              <div
                key={h.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer"
                style={{ animation: `fadeUp 0.4s ease ${i * 55}ms both` }}
                onClick={() => onBook?.(h)}
              >
                <div className="relative h-40 overflow-hidden">
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
                  {h.featured && (
                    <span className="absolute top-2 left-2 bg-[#C9A96E] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Featured
                    </span>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="font-bold text-gray-800 text-sm truncate">
                    {h.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPinIcon className="w-3 h-3 text-[#C9A96E]" />
                    <p className="text-xs text-gray-400 truncate">{h.city}</p>
                  </div>
                  <p className="font-bold text-gray-900 mt-1 text-sm">
                    {fmt$(h.pricePerNight)}
                    <span className="text-xs text-gray-400 font-normal">
                      /night
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   GUEST DASHBOARD HOME  (upgraded UI)
═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT
   - Guests → GuestDashboard (full standalone, new UI)
   - Hosts  → existing host shell with sidebar + sections
═══════════════════════════════════════════════════════════ */
interface DashboardProps {
  onBook?: (hotel: Hotel) => void;
  onLogout?: () => void;
}

const Dashboard = ({ onBook, onLogout }: DashboardProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = (user?.role ?? "guest") as "host" | "guest";

  const handleLogout = useCallback(async () => {
    await logout();
    if (onLogout) onLogout();
    else navigate("/login");
  }, [logout, navigate, onLogout]);

  // ── Guests go straight to the new GuestDashboard — no host shell ──
  if (!user)
    return (
      <div className="min-h-screen bg-[#0e0d0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (role === "guest") {
    return <GuestDashboard onBook={onBook} onLogout={onLogout} />;
  }

  // ── Host shell ──
  return <HostDashboardShell onBook={onBook} onLogout={handleLogout} />;
};

export default Dashboard;

/* ═══════════════════════════════════════════════════════════
   HOST DASHBOARD SHELL  (extracted so Dashboard stays clean)
═══════════════════════════════════════════════════════════ */
const HostDashboardShell = ({
  onBook,
  onLogout,
}: {
  onBook?: (hotel: Hotel) => void;
  onLogout: () => void;
}) => {
  const [active, setActive] = useState<NavKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pending, setPending] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    BookingsDB.byHost(user.id).then((b) =>
      setPending(b.filter((bk) => bk.status === "pending").length),
    );
  }, [user]);

  const PAGE_TITLES: Record<NavKey, string> = {
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

  const content = () => {
    switch (active) {
      case "dashboard":
        return <HostHome onNavigate={setActive} onBook={onBook} />;
      case "properties":
        return <PropertiesSection onBook={onBook} />;
      case "bookings":
        return <HostBookings />;
      case "reviews":
        return <ReviewsSection />;
      case "earnings":
        return <EarningsSection />;
      case "messages":
        return <Messages />;
      case "settings":
        return <SettingsSection />;
      default:
        return <HostHome onNavigate={setActive} onBook={onBook} />;
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
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
          role="host"
          active={active}
          onNav={setActive}
          pending={pending}
          onClose={() => setMobileOpen(false)}
          onLogout={onLogout}
          isMobile
        />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar
          role="host"
          active={active}
          onNav={setActive}
          pending={pending}
          onLogout={onLogout}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title={PAGE_TITLES[active]}
          onHamburger={() => setMobileOpen(true)}
          pending={pending}
        />
        <main className="flex-1 overflow-hidden flex flex-col">
          {content()}
        </main>
      </div>
    </div>
  );
};
