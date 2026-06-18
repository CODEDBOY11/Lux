import { useState, useEffect, useCallback, useRef } from "react";
import MessagesInbox from "./Components/MessagesInbox";
import { useNavigate } from "react-router-dom";
import ReviewsSection from "./ReviewSection";
import { WalletDB } from "./index";
import PropertyVerificationForm from "./Verification/Property";
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
  ShieldCheckIcon,
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
  type VerificationStatus,
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

const VERIF_CONFIG: Record<
  VerificationStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  unverified: {
    label: "Unverified",
    color: "rgba(245,240,232,0.4)",
    bg: "rgba(245,240,232,0.05)",
    border: "rgba(245,240,232,0.1)",
  },
  pending: {
    label: "In Review",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
  },
  verified: {
    label: "✓ Verified",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.1)",
    border: "rgba(74,222,128,0.25)",
  },
  rejected: {
    label: "Rejected",
    color: "#e07070",
    bg: "rgba(220,60,60,0.1)",
    border: "rgba(220,60,60,0.25)",
  },
};

const VerifBadge = ({ status }: { status: VerificationStatus }) => {
  const cfg = VERIF_CONFIG[status];
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
};

const Sk = ({
  h = "h-8",
  rounded = "rounded-xl",
}: {
  h?: string;
  rounded?: string;
}) => <div className={`w-full ${h} ${rounded} bg-gray-100 animate-pulse`} />;

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
   NAV
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

/* ─────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────── */
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
  const nav = role === "guest" ? GUEST_NAV : HOST_NAV;
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
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "text-white shadow-md"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
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
  images: string[];
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
  images: [],
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
          images: editing.images,
          featured: editing.featured,
          available: editing.available,
        }
      : BLANK,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;
    setUploadingImages(true);
    setUploadError("");
    try {
      const { uploadToCloudinary } = await import("./cloudinary"); // adjust path

      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadToCloudinary(file, "image", (percent) => {
          // optional: you could show percent in UI
          console.log(`Uploading: ${percent}%`);
        });
        urls.push(url);
        // Show each image as it finishes
        set("images")([...form.images, ...urls]);
      }
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed. Please try again.");
    } finally {
      setUploadingImages(false);
    }
  };
  const addUrlManually = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    set("images")([...form.images, trimmed]);
    setUrlInput("");
  };

  const removeImage = (i: number) =>
    set("images")(form.images.filter((_, j) => j !== i));

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
        images: form.images,
        featured: form.featured,
        available: form.available,
      };
      if (editing) {
        const u = await ListingsDB.update(editing.id, payload);
        if (!u)
          throw new Error("Update failed — check your Supabase connection.");
        onSave(listingToHotel(u));
      } else {
        const result = await ListingsDB.add({ hostId, hostName, ...payload });
        setCreatedListingId(result.id);
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (createdListingId) {
    return (
      <PropertyVerificationForm
        listingId={createdListingId}
        onComplete={() => {
          onSave(listingToHotel({ id: createdListingId } as Listing));
          onCancel();
        }}
      />
    );
  }

  const inp =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/10 transition-all bg-white";
  const lbl =
    "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-50"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="max-w-2xl mx-auto p-6 pb-16">
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
          {/* Basic info */}
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
                  <label className={lbl}>Price Per Night (NGN) *</label>
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
                      className={`rounded border-2 flex items-center justify-center transition-all ${form[k] ? "bg-[#C9A96E] border-[#C9A96E]" : "border-gray-300 group-hover:border-[#C9A96E]"}`}
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

          {/* Location */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-[#C9A96E]" /> Location
            </h3>
            <div className="space-y-4">
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

          {/* Capacity */}
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

          {/* Amenities */}
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

          {/* Tags & Photos */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
              <PhotoIcon className="w-4 h-4 text-[#C9A96E]" /> Tags & Photos
            </h3>
            <div className="space-y-5">
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
                <label className={lbl}>Upload Photos from Device</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    e.target.files && handleFileUpload(e.target.files)
                  }
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 transition-all ${uploadingImages ? "border-[#C9A96E]/40 bg-[#C9A96E]/5 cursor-wait" : "border-gray-200 hover:border-[#C9A96E]/50 hover:bg-amber-50/30 cursor-pointer"}`}
                >
                  {uploadingImages ? (
                    <>
                      <span className="w-7 h-7 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
                      <span className="text-sm text-[#C9A96E] font-semibold">
                        Uploading to Supabase…
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center">
                        <PhotoIcon className="w-6 h-6 text-[#C9A96E]" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-700">
                          Click to upload photos
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          JPG, PNG, WEBP — multiple files allowed
                        </p>
                      </div>
                    </>
                  )}
                </button>
                {uploadError && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <XMarkIcon className="w-3 h-3 shrink-0" /> {uploadError}
                  </p>
                )}
              </div>
              <div>
                <label className={lbl}>Or Paste an Image URL</label>
                <div className="flex gap-2">
                  <input
                    className={inp}
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addUrlManually();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addUrlManually}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 transition-colors whitespace-nowrap"
                  >
                    Add URL
                  </button>
                </div>
              </div>
              {form.images.length > 0 && (
                <div>
                  <label className={lbl}>
                    Photos ({form.images.length}) — hover to remove
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {form.images.map((url, i) => (
                      <div
                        key={i}
                        className="relative w-24 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group shadow-sm"
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (
                              e.target as HTMLImageElement
                            ).parentElement!.style.opacity = "0.35";
                          }}
                        />
                        {i === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 font-bold">
                            MAIN
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    First image is the main thumbnail. Hover a photo to remove
                    it.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Save */}
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 bg-[#C9A96E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl text-sm hover:bg-[#b8935a] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#C9A96E]/20 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
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
  const [verifyId, setVerifyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setHotels((await ListingsDB.byHost(user.id)).map(listingToHotel));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (verifyId) {
    return (
      <PropertyVerificationForm
        listingId={verifyId}
        onComplete={() => {
          setVerifyId(null);
          load();
        }}
      />
    );
  }

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
          {hotels.map((hotel, i) => {
            const verifStatus: VerificationStatus =
              hotel.verificationStatus ?? "unverified";
            const needsVerif =
              verifStatus === "unverified" || verifStatus === "rejected";
            return (
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
                  <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
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
                  <div className="flex items-center gap-1 mb-2">
                    <MapPinIcon className="w-3 h-3 text-[#C9A96E] shrink-0" />
                    <p className="text-xs text-gray-400 truncate">
                      {hotel.city}, {hotel.country}
                    </p>
                  </div>
                  <div className="mb-3">
                    <VerifBadge status={verifStatus} />
                    {verifStatus === "rejected" && hotel.verificationNote && (
                      <p className="text-[11px] text-red-500 mt-1.5 leading-snug">
                        Reason: {hotel.verificationNote}
                      </p>
                    )}
                    {needsVerif && (
                      <button
                        onClick={() => setVerifyId(hotel.id)}
                        className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#C9A96E] hover:underline"
                      >
                        <ShieldCheckIcon className="w-3 h-3" />
                        {verifStatus === "rejected"
                          ? "Resubmit Verification →"
                          : "Submit for Verification →"}
                      </button>
                    )}
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
                        if (!confirm("Delete this listing permanently?"))
                          return;
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
                    <button
                      onClick={() => {
                        const url = `https://lux-d1ok.vercel.app/api/og-listings?id=${hotel.id}`;
                        navigator.clipboard.writeText(url);
                        alert("Link copied! Share this on WhatsApp.");
                      }}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 py-2 rounded-xl transition-colors"
                    >
                      📋 Share
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
   HOST: EARNINGS + WALLET + WITHDRAWALS
═══════════════════════════════════════════════════════════ */
const EarningsSection = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<import("./index").Wallet | null>(null);
  const [transactions, setTransactions] = useState<
    import("./index").WalletTransaction[]
  >([]);
  const [withdrawals, setWithdrawals] = useState<
    import("./index").WithdrawalRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [w, tx, wr] = await Promise.all([
      WalletDB.get(user.id),
      WalletDB.transactions(user.id),
      WalletDB.withdrawalsByHost(user.id),
    ]);
    setWallet(w);
    setTransactions(tx);
    setWithdrawals(wr);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleWithdraw = async () => {
    setWithdrawError("");
    const amount = Number(form.amount);
    if (!amount || amount <= 0)
      return setWithdrawError("Enter a valid amount.");
    if (!form.bankName.trim()) return setWithdrawError("Enter your bank name.");
    if (!form.accountNumber.trim())
      return setWithdrawError("Enter your account number.");
    if (!form.accountName.trim())
      return setWithdrawError("Enter your account name.");
    if (wallet && amount > wallet.balance)
      return setWithdrawError(
        `Insufficient balance. Available: ₦${wallet.balance.toLocaleString()}`,
      );

    setWithdrawing(true);
    try {
      await WalletDB.requestWithdrawal({
        hostId: user!.id,
        amount,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        accountName: form.accountName,
      });
      setWithdrawSuccess(true);
      setShowWithdrawForm(false);
      setForm({ amount: "", bankName: "", accountNumber: "", accountName: "" });
      await load();
    } catch (e: any) {
      setWithdrawError(e.message ?? "Withdrawal failed.");
    } finally {
      setWithdrawing(false);
    }
  };

  const inp =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/10 transition-all bg-white";
  const lbl =
    "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5";
  const pendingWithdrawals = withdrawals.filter(
    (w) => w.status === "pending",
  ).length;

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Earnings & Wallet
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Your 90% share of every confirmed booking
          </p>
        </div>
        <button
          onClick={() => {
            setShowWithdrawForm(true);
            setWithdrawSuccess(false);
            setWithdrawError("");
          }}
          className="flex items-center gap-2 bg-[#C9A96E] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#b8935a] transition-all hover:scale-105 shadow-md shadow-[#C9A96E]/20"
        >
          <BanknotesIcon className="w-4 h-4" /> Withdraw Funds
        </button>
      </div>

      {loading ? (
        <Sk h="h-28" rounded="rounded-2xl" />
      ) : (
        <div className="bg-gradient-to-br from-[#1a1208] to-[#2d1f0a] rounded-2xl p-6 border border-[#C9A96E]/20 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#C9A96E]/5 -translate-y-1/2 translate-x-1/2" />
          <p className="text-[#C9A96E] text-xs font-bold uppercase tracking-widest mb-1">
            Available Balance
          </p>
          <p className="font-['Cormorant_Garamond'] text-5xl font-bold text-white mb-4">
            ₦{(wallet?.balance ?? 0).toLocaleString()}
          </p>
          <div className="flex gap-6 flex-wrap">
            <div>
              <p className="text-white/40 text-xs">Total Earned</p>
              <p className="text-white font-bold">
                ₦{(wallet?.totalEarned ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Total Withdrawn</p>
              <p className="text-white font-bold">
                ₦{(wallet?.totalWithdrawn ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Pending Withdrawals</p>
              <p className="text-amber-400 font-bold">{pendingWithdrawals}</p>
            </div>
          </div>
        </div>
      )}

      {withdrawSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-700 text-sm font-semibold">
          <CheckCircleIcon className="w-5 h-5 shrink-0" />
          Withdrawal request submitted! Admin will process it within 24–48
          hours.
        </div>
      )}

      {showWithdrawForm && (
        <div
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          style={{ animation: "fadeUp 0.2s ease both" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">
              Withdraw to Bank Account
            </h3>
            <button
              onClick={() => setShowWithdrawForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className={lbl}>Amount (₦)</label>
              <input
                className={inp}
                type="number"
                min="1"
                placeholder={`Max: ₦${(wallet?.balance ?? 0).toLocaleString()}`}
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={lbl}>Bank Name</label>
              <input
                className={inp}
                placeholder="e.g. Guaranty Trust Bank"
                value={form.bankName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bankName: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Account Number</label>
                <input
                  className={inp}
                  placeholder="0123456789"
                  value={form.accountNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, accountNumber: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className={lbl}>Account Name</label>
                <input
                  className={inp}
                  placeholder="As on bank record"
                  value={form.accountName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, accountName: e.target.value }))
                  }
                />
              </div>
            </div>
            {withdrawError && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <XMarkIcon className="w-4 h-4 shrink-0" />
                {withdrawError}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="flex-1 bg-[#C9A96E] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm hover:bg-[#b8935a] transition-all flex items-center justify-center gap-2"
              >
                {withdrawing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    Processing…
                  </>
                ) : (
                  "Submit Withdrawal"
                )}
              </button>
              <button
                onClick={() => setShowWithdrawForm(false)}
                className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Transaction History</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <Sk key={i} h="h-10" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <BanknotesIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx, i) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 transition-colors"
                style={{ animation: `fadeUp 0.3s ease ${i * 25}ms both` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${tx.type === "credit" ? "bg-emerald-500" : "bg-red-400"}`}
                  >
                    {tx.type === "credit" ? "+" : "−"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {tx.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fmtDate(tx.createdAt)}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-bold text-sm ${tx.type === "credit" ? "text-emerald-600" : "text-red-500"}`}
                >
                  {tx.type === "credit" ? "+" : "−"}₦
                  {tx.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {withdrawals.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Withdrawal Requests</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {withdrawals.map((wr, i) => (
              <div
                key={wr.id}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60"
                style={{ animation: `fadeUp 0.3s ease ${i * 25}ms both` }}
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {wr.bankName} · {wr.accountNumber}
                  </p>
                  <p className="text-xs text-gray-400">
                    {wr.accountName} · {fmtDate(wr.createdAt)}
                  </p>
                  {wr.adminNote && (
                    <p className="text-xs text-red-500 mt-0.5">
                      {wr.adminNote}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">
                    ₦{wr.amount.toLocaleString()}
                  </p>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      wr.status === "approved"
                        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                        : wr.status === "rejected"
                          ? "text-red-500 bg-red-50 border-red-200"
                          : "text-amber-600 bg-amber-50 border-amber-200"
                    }`}
                  >
                    {wr.status.charAt(0).toUpperCase() + wr.status.slice(1)}
                  </span>
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
   SETTINGS
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
  const accent = isGuest ? "#6EADC9" : "#C9A96E";

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
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
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
                  <PlusIcon className="w-3 h-3" /> Add listing
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
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-[#C9A96E] font-bold">
                        {fmt$(h.pricePerNight)}
                        <span className="text-gray-400 font-normal">/n</span>
                      </p>
                      <VerifBadge
                        status={h.verificationStatus ?? "unverified"}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
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
                  <div className="absolute top-2 right-2">
                    <VerifBadge status={h.verificationStatus ?? "unverified"} />
                  </div>
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
   MAIN EXPORT
═══════════════════════════════════════════════════════════ */
interface DashboardProps {
  onBook?: (hotel: Hotel) => void;
  onLogout?: () => void;
}

const Dashboard = ({ onBook, onLogout }: DashboardProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = (user?.role ?? "guest") as "host" | "guest" | "admin";

  const handleLogout = useCallback(async () => {
    await logout();
    if (onLogout) onLogout();
    else navigate("/login");
  }, [logout, navigate, onLogout]);

  if (!user)
    return (
      <div className="min-h-screen bg-[#0e0d0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (role === "guest")
    return <GuestDashboard onBook={onBook} onLogout={onLogout} />;

  // Admins have their own dashboard — redirect them there via your router
  // If an admin lands here, just show the host shell as a fallback
  return <HostDashboardShell onBook={onBook} onLogout={handleLogout} />;
};

export default Dashboard;

/* ═══════════════════════════════════════════════════════════
   HOST DASHBOARD SHELL
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
        return <MessagesInbox />;
      case "settings":
        return <SettingsSection />;
      default:
        return <HostHome onNavigate={setActive} onBook={onBook} />;
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50">
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }`}</style>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
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
      <div className="hidden lg:flex shrink-0">
        <Sidebar
          role="host"
          active={active}
          onNav={setActive}
          pending={pending}
          onLogout={onLogout}
        />
      </div>
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
