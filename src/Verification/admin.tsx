import { useState, useEffect, useCallback } from "react";
import {
  supabase,
  AuthDB,
  ListingsDB,
  BookingsDB,
  ReviewsDB,
  WalletDB,
  type User,
  type Listing,
  type Booking,
  type Review,
} from "../index";
import {
  VerificationDB,
  type AdminVerificationItem,
  type SubmissionStatus,
} from "../index";
import {
  ShieldCheckIcon,
  UsersIcon,
  BuildingOffice2Icon,
  BanknotesIcon,
  StarIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  EyeIcon,
  ArrowLeftIcon,
  ClockIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

/* ─────────── helpers ─────────── */
const fmt$ = (n: number) =>
  "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const fmtDateShort = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/* ─────────── types ─────────── */
interface HostStats {
  host: User;
  listings: Listing[];
  bookings: Booking[];
  reviews: Review[];
  totalEarnings: number;
  avgRating: number;
  confirmedBookings: number;
}

type AdminView =
  | "withdrawals"
  | "overview"
  | "hosts"
  | "host-detail"
  | "verification"
  | "bookings"
  | "reviews";

/* ─────────── stat card ─────────── */
const StatCard = ({
  icon,
  label,
  value,
  sub,
  accent = "#C9A96E",
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  delay?: number;
}) => (
  <div
    className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-5 hover:border-[rgba(201,169,110,0.2)] transition-all duration-300"
    style={{ animation: `fadeUp 0.4s ease ${delay}ms both` }}
  >
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
      style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
    >
      {icon}
    </div>
    <p className="font-['Cormorant_Garamond'] text-3xl font-bold text-[#f5f0e8] leading-none">
      {value}
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

/* ─────────── verification badge ─────────── */
const VerifBadge = ({ status }: { status: string }) => {
  const map: Record<
    string,
    { label: string; color: string; bg: string; border: string }
  > = {
    pending: {
      label: "In Review",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
      border: "rgba(245,158,11,0.25)",
    },
    approved: {
      label: "✓ Approved",
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
    needs_more_info: {
      label: "More Info",
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.1)",
      border: "rgba(96,165,250,0.25)",
    },
    unverified: {
      label: "Unverified",
      color: "rgba(245,240,232,0.4)",
      bg: "rgba(245,240,232,0.05)",
      border: "rgba(245,240,232,0.1)",
    },
    verified: {
      label: "✓ Verified",
      color: "#4ade80",
      bg: "rgba(74,222,128,0.1)",
      border: "rgba(74,222,128,0.25)",
    },
  };
  const cfg = map[status] ?? map.unverified;
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
};

const BookingBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    confirmed:
      "bg-[rgba(74,222,128,0.1)] text-[#4ade80] border-[rgba(74,222,128,0.25)]",
    pending:
      "bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border-[rgba(245,158,11,0.25)]",
    cancelled:
      "bg-[rgba(220,60,60,0.1)] text-[#e07070] border-[rgba(220,60,60,0.25)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${map[status] ?? ""}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
};

/* ─────────── skeleton ─────────── */
const Sk = ({ h = "h-8", r = "rounded-xl" }: { h?: string; r?: string }) => (
  <div
    className={`w-full ${h} ${r} bg-[rgba(245,240,232,0.05)] animate-pulse`}
  />
);

/* ═══════════════════════════════════════════════════════════
   VERIFICATION QUEUE PANEL
═══════════════════════════════════════════════════════════ */
const VerificationPanel = ({ adminId }: { adminId: string }) => {
  const [items, setItems] = useState<AdminVerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SubmissionStatus | "all">("all");
  const [selected, setSelected] = useState<AdminVerificationItem | null>(null);
  const [note, setNote] = useState("");
  const [actioning, setActioning] = useState(false);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await VerificationDB.adminQueue(
      filter === "all" ? undefined : filter,
    );
    setItems(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: "approve" | "reject" | "needs_more_info") => {
    if (!selected) return;
    if ((action === "reject" || action === "needs_more_info") && !note.trim()) {
      setActionError(
        "Please add a note before rejecting or requesting more info.",
      );
      return;
    }
    setActioning(true);
    setActionError("");
    try {
      if (action === "approve")
        await VerificationDB.approve(selected.id, adminId);
      else if (action === "reject")
        await VerificationDB.reject(selected.id, adminId, note);
      else await VerificationDB.requestMoreInfo(selected.id, adminId, note);
      setSelected(null);
      setNote("");
      await load();
    } catch (e: any) {
      setActionError(e.message ?? "Action failed");
    } finally {
      setActioning(false);
    }
  };

  const counts = {
    all: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
    needs_more_info: items.filter((i) => i.status === "needs_more_info").length,
  };

  if (selected) {
    return (
      <div
        className="flex-1 overflow-y-auto p-6"
        style={{ animation: "fadeUp 0.3s ease both" }}
      >
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-[rgba(245,240,232,0.4)] hover:text-[#C9A96E] text-sm mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to queue
        </button>
        <div className="max-w-2xl space-y-5">
          <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#C9A96E] mb-1">
                  Verification Review
                </p>
                <h2 className="font-['Cormorant_Garamond'] text-2xl text-[#f5f0e8]">
                  {selected.listingName}
                </h2>
                <p className="text-sm text-[rgba(245,240,232,0.4)] mt-1">
                  {selected.listingLocation} · {selected.listingCategory}
                </p>
              </div>
              <VerifBadge status={selected.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Host", `${selected.hostFirstName} ${selected.hostLastName}`],
                ["Email", selected.hostEmail],
                ["Submitted", fmtDate(selected.createdAt)],
                ["Status", selected.status],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="bg-[rgba(245,240,232,0.03)] rounded-xl p-3"
                >
                  <p className="text-[10px] uppercase tracking-wider text-[rgba(245,240,232,0.3)] mb-1">
                    {k}
                  </p>
                  <p className="text-[#f5f0e8] text-sm font-medium">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Listing images */}
          {selected.listingImages.length > 0 && (
            <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-[rgba(245,240,232,0.3)] mb-3 flex items-center gap-2">
                <DocumentTextIcon className="w-3.5 h-3.5" />
                Listing Photos
              </p>
              <div className="flex gap-2 flex-wrap">
                {selected.listingImages.slice(0, 6).map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-20 h-16 rounded-lg overflow-hidden border border-[rgba(245,240,232,0.08)] hover:border-[#C9A96E] transition-colors block"
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Verification video */}
          {selected.videoUrl && (
            <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-[rgba(245,240,232,0.3)] mb-3 flex items-center gap-2">
                <VideoCameraIcon className="w-3.5 h-3.5" />
                Walkthrough Video
              </p>
              <a
                href={selected.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 bg-[rgba(201,169,110,0.06)] border border-[rgba(201,169,110,0.15)] rounded-xl p-4 hover:border-[#C9A96E] transition-colors"
              >
                <VideoCameraIcon className="w-5 h-5 text-[#C9A96E]" />
                <span className="text-sm text-[#C9A96E] font-medium">
                  View verification video →
                </span>
              </a>
            </div>
          )}

          {/* Host notes */}
          {selected.hostNotes && (
            <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-[rgba(245,240,232,0.3)] mb-2 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                Host Notes
              </p>
              <p className="text-sm text-[rgba(245,240,232,0.6)] leading-relaxed">
                {selected.hostNotes}
              </p>
            </div>
          )}

          {/* Previous admin note */}
          {selected.adminNote && (
            <div className="bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.2)] rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-[#f59e0b] mb-2">
                Previous Admin Note
              </p>
              <p className="text-sm text-[rgba(245,240,232,0.6)]">
                {selected.adminNote}
              </p>
            </div>
          )}

          {/* Action panel */}
          {selected.status === "pending" ||
          selected.status === "needs_more_info" ? (
            <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-[rgba(245,240,232,0.3)] mb-4">
                Admin Decision
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add a note (required for reject / needs more info)…"
                className="w-full bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] rounded-xl p-3 text-sm text-[#f5f0e8] outline-none resize-none mb-4 focus:border-[#C9A96E] transition-colors placeholder:text-[rgba(245,240,232,0.2)]"
              />
              {actionError && (
                <p className="text-xs text-[#e07070] mb-3">{actionError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => act("approve")}
                  disabled={actioning}
                  className="flex-1 bg-[#4ade80] text-[#0e0d0b] font-bold py-3 rounded-xl text-sm hover:bg-[#22c55e] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actioning ? (
                    <span className="w-4 h-4 border-2 border-[#0e0d0b]/20 border-t-[#0e0d0b] rounded-full animate-spin" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => act("needs_more_info")}
                  disabled={actioning}
                  className="flex-1 bg-[rgba(96,165,250,0.1)] border border-[rgba(96,165,250,0.3)] text-[#60a5fa] font-bold py-3 rounded-xl text-sm hover:bg-[rgba(96,165,250,0.2)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ExclamationTriangleIcon className="w-4 h-4" /> Need More Info
                </button>
                <button
                  onClick={() => act("reject")}
                  disabled={actioning}
                  className="flex-1 bg-[rgba(220,60,60,0.1)] border border-[rgba(220,60,60,0.25)] text-[#e07070] font-bold py-3 rounded-xl text-sm hover:bg-[rgba(220,60,60,0.2)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircleIcon className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-5 text-center">
              <VerifBadge status={selected.status} />
              <p className="text-sm text-[rgba(245,240,232,0.4)] mt-3">
                This submission has already been reviewed.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="mb-6">
        <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#f5f0e8] mb-1">
          Verification Queue
        </h2>
        <p className="text-[rgba(245,240,232,0.4)] text-sm">
          {items.length} total submissions
        </p>
      </div>
      <div className="flex gap-2 flex-wrap mb-5">
        {(
          ["all", "pending", "approved", "rejected", "needs_more_info"] as const
        ).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all ${filter === f ? "bg-[#C9A96E] border-[#C9A96E] text-[#0e0d0b]" : "border-[rgba(245,240,232,0.1)] text-[rgba(245,240,232,0.45)] hover:border-[rgba(201,169,110,0.3)]"}`}
          >
            {f === "needs_more_info"
              ? "Needs Info"
              : f.charAt(0).toUpperCase() + f.slice(1)}{" "}
            ({counts[f] ?? items.length})
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Sk key={i} h="h-20" r="rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <ShieldCheckIcon className="w-10 h-10 text-[rgba(245,240,232,0.1)] mx-auto mb-3" />
          <p className="text-[rgba(245,240,232,0.4)] text-sm">
            No submissions in this category
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-4 hover:border-[rgba(201,169,110,0.25)] cursor-pointer transition-all group"
              style={{ animation: `fadeUp 0.3s ease ${i * 40}ms both` }}
            >
              <div className="flex items-center gap-4">
                {item.listingImages[0] ? (
                  <img
                    src={item.listingImages[0]}
                    alt=""
                    className="w-14 h-12 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-12 rounded-xl bg-[rgba(245,240,232,0.05)] flex items-center justify-center shrink-0">
                    <BuildingOffice2Icon className="w-5 h-5 text-[rgba(245,240,232,0.2)]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[#f5f0e8] text-sm font-semibold truncate">
                    {item.listingName}
                  </p>
                  <p className="text-[rgba(245,240,232,0.4)] text-xs mt-0.5">
                    {item.hostFirstName} {item.hostLastName} · {item.hostEmail}
                  </p>
                  <p className="text-[rgba(245,240,232,0.3)] text-xs mt-0.5">
                    {item.listingLocation} · Submitted {fmtDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <VerifBadge status={item.status} />
                  <ChevronRightIcon className="w-4 h-4 text-[rgba(245,240,232,0.2)] group-hover:text-[#C9A96E] transition-colors" />
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
   HOST DETAIL VIEW
═══════════════════════════════════════════════════════════ */
const HostDetail = ({
  stats,
  onBack,
}: {
  stats: HostStats;
  onBack: () => void;
}) => {
  const {
    host,
    listings,
    bookings,
    reviews,
    totalEarnings,
    avgRating,
    confirmedBookings,
  } = stats;
  const [activeTab, setActiveTab] = useState<
    "overview" | "listings" | "bookings" | "reviews"
  >("overview");

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[rgba(245,240,232,0.4)] hover:text-[#C9A96E] text-sm mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to hosts
      </button>

      {/* Host header */}
      <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#8a6030] flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
            {host.avatar || host.firstName?.[0] || "?"}
          </div>
          <div>
            <h2 className="font-['Cormorant_Garamond'] text-2xl text-[#f5f0e8]">
              {host.firstName} {host.lastName}
            </h2>
            <p className="text-sm text-[rgba(245,240,232,0.4)]">{host.email}</p>
            <p className="text-xs text-[rgba(245,240,232,0.3)] mt-0.5">
              Member since {fmtDate(host.createdAt)} · {host.country || "—"}
            </p>
          </div>
          <div className="ml-auto">
            <span
              className={`text-[10px] font-bold px-3 py-1.5 rounded-full border ${host.emailVerified ? "text-[#4ade80] bg-[rgba(74,222,128,0.1)] border-[rgba(74,222,128,0.25)]" : "text-[#f59e0b] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.25)]"}`}
            >
              {host.emailVerified ? "✓ Verified" : "Unverified"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total Earnings",
              value: fmt$(totalEarnings),
              accent: "#4ade80",
            },
            { label: "Confirmed Bookings", value: confirmedBookings },
            {
              label: "Avg Rating",
              value: avgRating > 0 ? avgRating.toFixed(1) + "★" : "—",
            },
            {
              label: "Active Listings",
              value: listings.filter((l) => l.available).length,
            },
          ].map(({ label, value, accent }) => (
            <div
              key={label}
              className="bg-[rgba(245,240,232,0.03)] rounded-xl p-3 text-center"
            >
              <p
                className="font-['Cormorant_Garamond'] text-2xl font-bold"
                style={{ color: accent || "#f5f0e8" }}
              >
                {value}
              </p>
              <p className="text-[10px] text-[rgba(245,240,232,0.35)] mt-0.5 uppercase tracking-wider">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[rgba(245,240,232,0.07)] mb-5">
        {(["overview", "listings", "bookings", "reviews"] as const).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${activeTab === tab ? "text-[#C9A96E] border-[#C9A96E]" : "text-[rgba(245,240,232,0.4)] border-transparent hover:text-[rgba(245,240,232,0.7)]"}`}
            >
              {tab}{" "}
              {tab === "listings"
                ? `(${listings.length})`
                : tab === "bookings"
                  ? `(${bookings.length})`
                  : tab === "reviews"
                    ? `(${reviews.length})`
                    : ""}
            </button>
          ),
        )}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Earnings breakdown */}
          <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-[rgba(245,240,232,0.3)] mb-4">
              Earnings Breakdown
            </p>
            {bookings.filter((b) => b.status === "confirmed").length === 0 ? (
              <p className="text-sm text-[rgba(245,240,232,0.3)]">
                No confirmed bookings yet
              </p>
            ) : (
              <div className="space-y-2">
                {bookings
                  .filter((b) => b.status === "confirmed")
                  .slice(0, 5)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between py-2 border-b border-[rgba(245,240,232,0.04)] last:border-0"
                    >
                      <div>
                        <p className="text-sm text-[#f5f0e8]">
                          {b.listingName}
                        </p>
                        <p className="text-xs text-[rgba(245,240,232,0.35)]">
                          {fmtDateShort(b.checkIn)} → {fmtDateShort(b.checkOut)}{" "}
                          · {b.nights}n
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[#4ade80]">
                        {fmt$(b.totalAmount)}
                      </p>
                    </div>
                  ))}
                <div className="flex justify-between pt-2 border-t border-[rgba(245,240,232,0.08)]">
                  <p className="text-sm font-bold text-[#f5f0e8]">
                    Total Earnings
                  </p>
                  <p className="text-sm font-bold text-[#4ade80]">
                    {fmt$(totalEarnings)}
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* Recent reviews */}
          {reviews.length > 0 && (
            <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-[rgba(245,240,232,0.3)] mb-4">
                Recent Reviews
              </p>
              {reviews.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="py-3 border-b border-[rgba(245,240,232,0.04)] last:border-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-[#f5f0e8]">
                      {r.guestName}
                    </p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarSolid
                          key={i}
                          className="w-3 h-3"
                          style={{
                            color:
                              i < r.rating
                                ? "#C9A96E"
                                : "rgba(245,240,232,0.1)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[rgba(245,240,232,0.45)] leading-relaxed line-clamp-2">
                    {r.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Listings */}
      {activeTab === "listings" && (
        <div className="space-y-3">
          {listings.length === 0 ? (
            <p className="text-sm text-[rgba(245,240,232,0.35)] py-10 text-center">
              No listings
            </p>
          ) : (
            listings.map((l, i) => (
              <div
                key={l.id}
                className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-4 flex gap-4 items-center"
                style={{ animation: `fadeUp 0.3s ease ${i * 40}ms both` }}
              >
                {l.images[0] ? (
                  <img
                    src={l.images[0]}
                    alt=""
                    className="w-14 h-12 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-12 rounded-xl bg-[rgba(245,240,232,0.05)] shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[#f5f0e8] text-sm font-semibold truncate">
                    {l.name}
                  </p>
                  <p className="text-xs text-[rgba(245,240,232,0.4)]">
                    {l.city}, {l.country} · {l.category}
                  </p>
                  <p className="text-xs text-[#C9A96E] mt-0.5">
                    ${l.pricePerNight}/night
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <VerifBadge status={l.verificationStatus ?? "unverified"} />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${l.available ? "text-[#4ade80] border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)]" : "text-[rgba(245,240,232,0.3)] border-[rgba(245,240,232,0.1)]"}`}
                  >
                    {l.available ? "Live" : "Hidden"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Bookings */}
      {activeTab === "bookings" && (
        <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl overflow-hidden">
          {bookings.length === 0 ? (
            <p className="text-sm text-[rgba(245,240,232,0.35)] py-10 text-center">
              No bookings
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-[rgba(245,240,232,0.06)]">
                    {["Guest", "Property", "Dates", "Amount", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-[rgba(245,240,232,0.3)] font-bold"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => (
                    <tr
                      key={b.id}
                      className="border-b border-[rgba(245,240,232,0.04)] hover:bg-[rgba(245,240,232,0.02)] transition-colors"
                      style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both` }}
                    >
                      <td className="px-5 py-3">
                        <p className="text-sm text-[#f5f0e8]">{b.guestName}</p>
                        <p className="text-xs text-[rgba(245,240,232,0.35)]">
                          {b.guestEmail}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-sm text-[rgba(245,240,232,0.6)] truncate max-w-[140px]">
                        {b.listingName}
                      </td>
                      <td className="px-5 py-3 text-xs text-[rgba(245,240,232,0.5)] whitespace-nowrap">
                        {fmtDateShort(b.checkIn)} → {fmtDateShort(b.checkOut)}
                      </td>
                      <td className="px-5 py-3 text-sm font-bold text-[#f5f0e8]">
                        {fmt$(b.totalAmount)}
                      </td>
                      <td className="px-5 py-3">
                        <BookingBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reviews */}
      {activeTab === "reviews" && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-sm text-[rgba(245,240,232,0.35)] py-10 text-center">
              No reviews
            </p>
          ) : (
            reviews.map((r, i) => (
              <div
                key={r.id}
                className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-4"
                style={{ animation: `fadeUp 0.3s ease ${i * 40}ms both` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-[#f5f0e8]">
                    {r.guestName}
                  </p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarSolid
                        key={i}
                        className="w-3 h-3"
                        style={{
                          color:
                            i < r.rating ? "#C9A96E" : "rgba(245,240,232,0.1)",
                        }}
                      />
                    ))}
                  </div>
                </div>
                {r.title && (
                  <p className="text-sm font-medium text-[rgba(245,240,232,0.7)] mb-1">
                    {r.title}
                  </p>
                )}
                <p className="text-xs text-[rgba(245,240,232,0.45)] leading-relaxed">
                  {r.body}
                </p>
                <p className="text-[10px] text-[rgba(245,240,232,0.2)] mt-2">
                  {fmtDate(r.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   HOSTS PANEL
═══════════════════════════════════════════════════════════ */
const HostsPanel = ({ adminId: _adminId }: { adminId: string }) => {
  const [hostStats, setHostStats] = useState<HostStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedHost, setSelectedHost] = useState<HostStats | null>(null);
  const [sortBy, setSortBy] = useState<
    "earnings" | "bookings" | "rating" | "listings"
  >("earnings");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const allUsers = await AuthDB.all();
        const hosts = allUsers.filter((u) => u.role === "host");
        const stats = await Promise.all(
          hosts.map(async (host) => {
            const [listings, bookings, reviews] = await Promise.all([
              ListingsDB.byHost(host.id),
              BookingsDB.byHost(host.id),
              ReviewsDB.byHost(host.id),
            ]);
            const confirmed = bookings.filter((b) => b.status === "confirmed");
            const totalEarnings = confirmed.reduce(
              (s, b) => s + b.totalAmount,
              0,
            );
            const avgRating = reviews.length
              ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
              : 0;
            return {
              host,
              listings,
              bookings,
              reviews,
              totalEarnings,
              avgRating,
              confirmedBookings: confirmed.length,
            };
          }),
        );
        setHostStats(stats);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = hostStats
    .filter(
      (s) =>
        !search ||
        `${s.host.firstName} ${s.host.lastName} ${s.host.email}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "earnings") return b.totalEarnings - a.totalEarnings;
      if (sortBy === "bookings")
        return b.confirmedBookings - a.confirmedBookings;
      if (sortBy === "rating") return b.avgRating - a.avgRating;
      return b.listings.length - a.listings.length;
    });

  if (selectedHost)
    return (
      <HostDetail stats={selectedHost} onBack={() => setSelectedHost(null)} />
    );

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#f5f0e8] mb-1">
            Host Management
          </h2>
          <p className="text-[rgba(245,240,232,0.4)] text-sm">
            {hostStats.length} registered hosts
          </p>
        </div>
      </div>

      {/* Search + sort */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] rounded-xl px-3 py-2 flex-1 min-w-48">
          <MagnifyingGlassIcon className="w-4 h-4 text-[rgba(245,240,232,0.3)] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hosts…"
            className="bg-transparent text-sm text-[rgba(245,240,232,0.7)] w-full outline-none placeholder:text-[rgba(245,240,232,0.25)]"
          />
        </div>
        <div className="flex gap-2">
          {(["earnings", "bookings", "rating", "listings"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all capitalize ${sortBy === s ? "bg-[#C9A96E] border-[#C9A96E] text-[#0e0d0b]" : "border-[rgba(245,240,232,0.1)] text-[rgba(245,240,232,0.45)] hover:border-[rgba(201,169,110,0.3)]"}`}
              >
                {s}
              </button>
            ),
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Sk key={i} h="h-24" r="rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <UsersIcon className="w-10 h-10 text-[rgba(245,240,232,0.1)] mx-auto mb-3" />
          <p className="text-[rgba(245,240,232,0.4)] text-sm">No hosts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s, i) => (
            <div
              key={s.host.id}
              onClick={() => setSelectedHost(s)}
              className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-4 hover:border-[rgba(201,169,110,0.25)] cursor-pointer transition-all group"
              style={{ animation: `fadeUp 0.3s ease ${i * 40}ms both` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#8a6030] flex items-center justify-center text-white font-bold text-base shadow-md shrink-0">
                  {s.host.avatar || s.host.firstName?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[#f5f0e8] text-sm font-semibold">
                      {s.host.firstName} {s.host.lastName}
                    </p>
                    {s.host.emailVerified && (
                      <span className="text-[9px] text-[#4ade80] border border-[rgba(74,222,128,0.3)] px-1.5 py-0.5 rounded-full">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[rgba(245,240,232,0.4)]">
                    {s.host.email} · {s.host.country || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-6 shrink-0 text-right">
                  <div>
                    <p className="text-sm font-bold text-[#4ade80]">
                      {fmt$(s.totalEarnings)}
                    </p>
                    <p className="text-[10px] text-[rgba(245,240,232,0.3)]">
                      earnings
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#f5f0e8]">
                      {s.confirmedBookings}
                    </p>
                    <p className="text-[10px] text-[rgba(245,240,232,0.3)]">
                      bookings
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#C9A96E]">
                      {s.avgRating > 0 ? s.avgRating.toFixed(1) + "★" : "—"}
                    </p>
                    <p className="text-[10px] text-[rgba(245,240,232,0.3)]">
                      rating
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#f5f0e8]">
                      {s.listings.length}
                    </p>
                    <p className="text-[10px] text-[rgba(245,240,232,0.3)]">
                      listings
                    </p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-[rgba(245,240,232,0.2)] group-hover:text-[#C9A96E] transition-colors" />
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
   OVERVIEW PANEL
═══════════════════════════════════════════════════════════ */
const OverviewPanel = ({
  onNavigate,
}: {
  onNavigate: (v: AdminView) => void;
}) => {
  const [stats, setStats] = useState({
    hosts: 0,
    guests: 0,
    listings: 0,
    bookings: 0,
    revenue: 0,
    pending: 0,
    avgRating: 0,
    reviews: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [users, allBookings, allListings] = await Promise.all([
          AuthDB.all(),
          BookingsDB.all(),
          ListingsDB.all(),
        ]);
        const hosts = users.filter((u) => u.role === "host").length;
        const guests = users.filter((u) => u.role === "guest").length;
        const revenue = allBookings
          .filter((b) => b.status === "confirmed")
          .reduce((s, b) => s + b.totalAmount, 0);

        // Get all reviews for avg rating
        const { data: reviewData } = await supabase
          .from("reviews")
          .select("rating");
        const reviews = reviewData ?? [];
        const avgRating = reviews.length
          ? reviews.reduce((s: number, r: any) => s + r.rating, 0) /
            reviews.length
          : 0;

        // Pending verifications
        const verifPending = await VerificationDB.adminQueue("pending");

        setStats({
          hosts,
          guests,
          listings: allListings.length,
          bookings: allBookings.length,
          revenue,
          pending: verifPending.length,
          avgRating,
          reviews: reviews.length,
        });
        setRecentBookings(allBookings.slice(0, 8));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="mb-7">
        <p className="text-[10px] uppercase tracking-widest text-[#C9A96E] mb-1">
          Admin Console
        </p>
        <h1 className="font-['Cormorant_Garamond'] text-4xl text-[#f5f0e8]">
          Platform Overview
        </h1>
        <p className="text-[rgba(245,240,232,0.4)] text-sm mt-1">
          Real-time metrics across all users, hosts and listings
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {loading ? (
          [...Array(8)].map((_, i) => <Sk key={i} h="h-28" r="rounded-2xl" />)
        ) : (
          <>
            <StatCard
              icon={<UsersIcon className="w-4 h-4 text-[#C9A96E]" />}
              label="Total Hosts"
              value={stats.hosts}
              delay={0}
            />
            <StatCard
              icon={<UsersIcon className="w-4 h-4 text-[#6EADC9]" />}
              label="Total Guests"
              value={stats.guests}
              delay={60}
              accent="#6EADC9"
            />
            <StatCard
              icon={<BuildingOffice2Icon className="w-4 h-4 text-[#C9A96E]" />}
              label="Live Listings"
              value={stats.listings}
              delay={120}
            />
            <StatCard
              icon={<CalendarDaysIcon className="w-4 h-4 text-[#C9A96E]" />}
              label="Total Bookings"
              value={stats.bookings}
              delay={180}
            />
            <StatCard
              icon={<BanknotesIcon className="w-4 h-4 text-[#4ade80]" />}
              label="Total Revenue"
              value={fmt$(stats.revenue)}
              delay={240}
              accent="#4ade80"
              sub="All confirmed bookings"
            />
            <StatCard
              icon={<ClockIcon className="w-4 h-4 text-[#f59e0b]" />}
              label="Pending Approvals"
              value={stats.pending}
              delay={300}
              accent="#f59e0b"
              sub="Awaiting verification review"
            />
            <StatCard
              icon={<StarIcon className="w-4 h-4 text-[#C9A96E]" />}
              label="Platform Avg Rating"
              value={
                stats.avgRating > 0 ? stats.avgRating.toFixed(1) + "★" : "—"
              }
              delay={360}
            />
            <StatCard
              icon={
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-[#C9A96E]" />
              }
              label="Total Reviews"
              value={stats.reviews}
              delay={420}
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {[
          {
            label: "Review Verifications",
            sub: `${stats.pending} pending`,
            view: "verification" as AdminView,
            accent: "#f59e0b",
            icon: ShieldCheckIcon,
          },
          {
            label: "Manage Hosts",
            sub: `${stats.hosts} hosts`,
            view: "hosts" as AdminView,
            accent: "#C9A96E",
            icon: UsersIcon,
          },
          {
            label: "All Bookings",
            sub: `${stats.bookings} total`,
            view: "bookings" as AdminView,
            accent: "#6EADC9",
            icon: CalendarDaysIcon,
          },
          {
            label: "All Reviews",
            sub: `${stats.reviews} reviews`,
            view: "reviews" as AdminView,
            accent: "#4ade80",
            icon: StarIcon,
          },
        ].map(({ label, sub, view, accent, icon: Icon }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-4 text-left hover:border-[rgba(201,169,110,0.25)] transition-all group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
              style={{
                background: `${accent}18`,
                border: `1px solid ${accent}28`,
              }}
            >
              <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
            <p className="text-sm font-semibold text-[#f5f0e8] group-hover:text-[#C9A96E] transition-colors">
              {label}
            </p>
            <p className="text-xs text-[rgba(245,240,232,0.35)] mt-0.5">
              {sub}
            </p>
          </button>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(245,240,232,0.06)]">
          <h3 className="font-['Cormorant_Garamond'] text-lg text-[#f5f0e8]">
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
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Sk key={i} h="h-10" />
            ))}
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[rgba(245,240,232,0.3)] text-sm">
              No bookings yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[rgba(245,240,232,0.05)]">
                  {[
                    "Guest",
                    "Property",
                    "Host",
                    "Amount",
                    "Status",
                    "Date",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-[rgba(245,240,232,0.25)] font-bold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b, i) => (
                  <tr
                    key={b.id}
                    className="border-b border-[rgba(245,240,232,0.04)] hover:bg-[rgba(245,240,232,0.02)] transition-colors"
                    style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both` }}
                  >
                    <td className="px-5 py-3">
                      <p className="text-sm text-[#f5f0e8]">{b.guestName}</p>
                      <p className="text-xs text-[rgba(245,240,232,0.35)]">
                        {b.guestEmail}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-sm text-[rgba(245,240,232,0.6)] max-w-[120px] truncate">
                      {b.listingName}
                    </td>
                    <td className="px-5 py-3 text-xs text-[rgba(245,240,232,0.4)] font-mono">
                      {b.hostId.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-[#f5f0e8]">
                      {fmt$(b.totalAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <BookingBadge status={b.status} />
                    </td>
                    <td className="px-5 py-3 text-xs text-[rgba(245,240,232,0.4)] whitespace-nowrap">
                      {fmtDateShort(b.createdAt)}
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
   ALL BOOKINGS PANEL
═══════════════════════════════════════════════════════════ */
const AllBookingsPanel = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "confirmed" | "pending" | "cancelled"
  >("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    BookingsDB.all()
      .then(setBookings)
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings
    .filter((b) => filter === "all" || b.status === filter)
    .filter(
      (b) =>
        !search ||
        `${b.guestName} ${b.listingName} ${b.ref}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );

  const revenue = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="mb-6">
        <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#f5f0e8] mb-1">
          All Bookings
        </h2>
        <p className="text-[rgba(245,240,232,0.4)] text-sm">
          {bookings.length} bookings · {fmt$(revenue)} total revenue
        </p>
      </div>
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] rounded-xl px-3 py-2 flex-1 min-w-48">
          <MagnifyingGlassIcon className="w-4 h-4 text-[rgba(245,240,232,0.3)] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guest, property, ref…"
            className="bg-transparent text-sm text-[rgba(245,240,232,0.7)] w-full outline-none placeholder:text-[rgba(245,240,232,0.25)]"
          />
        </div>
        {(["all", "confirmed", "pending", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all capitalize ${filter === f ? "bg-[#C9A96E] border-[#C9A96E] text-[#0e0d0b]" : "border-[rgba(245,240,232,0.1)] text-[rgba(245,240,232,0.45)] hover:border-[rgba(201,169,110,0.3)]"}`}
          >
            {f} (
            {f === "all"
              ? bookings.length
              : bookings.filter((b) => b.status === f).length}
            )
          </button>
        ))}
      </div>
      <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(8)].map((_, i) => (
              <Sk key={i} h="h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[rgba(245,240,232,0.35)] text-sm">
              No bookings found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[rgba(245,240,232,0.06)]">
                  {[
                    "Ref",
                    "Guest",
                    "Property",
                    "Check-in",
                    "Nights",
                    "Amount",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-[rgba(245,240,232,0.25)] font-bold"
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
                    className="border-b border-[rgba(245,240,232,0.04)] hover:bg-[rgba(245,240,232,0.02)] transition-colors"
                    style={{ animation: `fadeUp 0.3s ease ${i * 25}ms both` }}
                  >
                    <td className="px-5 py-3 font-mono text-[11px] text-[#C9A96E]">
                      {b.ref}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-[#f5f0e8]">{b.guestName}</p>
                      <p className="text-xs text-[rgba(245,240,232,0.35)]">
                        {b.guestEmail}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-sm text-[rgba(245,240,232,0.6)] max-w-[140px] truncate">
                      {b.listingName}
                    </td>
                    <td className="px-5 py-3 text-sm text-[rgba(245,240,232,0.5)] whitespace-nowrap">
                      {fmtDateShort(b.checkIn)}
                    </td>
                    <td className="px-5 py-3 text-sm text-[rgba(245,240,232,0.5)]">
                      {b.nights}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-[#f5f0e8]">
                      {fmt$(b.totalAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <BookingBadge status={b.status} />
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
   ALL REVIEWS PANEL
═══════════════════════════════════════════════════════════ */
const AllReviewsPanel = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const { data } = await supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false });

        setReviews(
          (data ?? []).map((r: any) => ({
            id: r.id,
            bookingId: r.booking_id,
            listingId: r.listing_id,
            guestId: r.guest_id,
            hostId: r.host_id,
            guestName: r.guest_name ?? "",
            guestAvatar: r.guest_avatar ?? "",
            rating: r.rating,
            title: r.title ?? "",
            body: r.body ?? "",
            cleanliness: r.cleanliness,
            service: r.service,
            location: r.location,
            value: r.value,
            helpful: r.helpful ?? 0,
            hostReply: r.host_reply,
            createdAt: r.created_at,
            guestPhone: r.guest_phone ?? "",
          })),
        );
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const filtered = reviews.filter(
    (r) =>
      !search ||
      `${r.guestName} ${r.title} ${r.body}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="mb-6">
        <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#f5f0e8] mb-1">
          All Reviews
        </h2>
        <p className="text-[rgba(245,240,232,0.4)] text-sm">
          {reviews.length} reviews · Platform avg {avgRating}★
        </p>
      </div>
      <div className="flex items-center gap-2 bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] rounded-xl px-3 py-2 mb-5">
        <MagnifyingGlassIcon className="w-4 h-4 text-[rgba(245,240,232,0.3)] shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reviews…"
          className="bg-transparent text-sm text-[rgba(245,240,232,0.7)] w-full outline-none placeholder:text-[rgba(245,240,232,0.25)]"
        />
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Sk key={i} h="h-32" r="rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((r, i) => (
            <div
              key={r.id}
              className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl p-4"
              style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[rgba(201,169,110,0.12)] border border-[rgba(201,169,110,0.2)] flex items-center justify-center text-[10px] font-bold text-[#C9A96E]">
                    {r.guestAvatar || r.guestName?.[0]?.toUpperCase() || "G"}
                  </div>
                  <p className="text-sm font-semibold text-[#f5f0e8]">
                    {r.guestName}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarSolid
                      key={i}
                      className="w-3 h-3"
                      style={{
                        color:
                          i < r.rating ? "#C9A96E" : "rgba(245,240,232,0.1)",
                      }}
                    />
                  ))}
                </div>
              </div>
              {r.title && (
                <p className="text-xs font-semibold text-[rgba(245,240,232,0.7)] mb-1">
                  {r.title}
                </p>
              )}
              <p className="text-xs text-[rgba(245,240,232,0.45)] leading-relaxed line-clamp-3">
                {r.body}
              </p>
              <p className="text-[10px] text-[rgba(245,240,232,0.2)] mt-2">
                {fmtDate(r.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
/* ═══════════════════════════════════════════════════════════
   ADMIN: PLATFORM EARNINGS SUMMARY
═══════════════════════════════════════════════════════════ */
const PlatformEarningsSummary = ({ adminId }: { adminId: string }) => {
  const [wallet, setWallet] = useState<import("../index").Wallet | null>(null);

  useEffect(() => {
    WalletDB.get(adminId).then(setWallet);
  }, [adminId]);

  return (
    <div className="bg-gradient-to-br from-[#1a1208] to-[#2d1f0a] rounded-2xl p-5 border border-[#C9A96E]/20 flex gap-8 flex-wrap mb-6">
      <div>
        <p className="text-[#C9A96E] text-[10px] font-bold uppercase tracking-widest mb-1">
          Platform Balance
        </p>
        <p className="font-['Cormorant_Garamond'] text-4xl font-bold text-white">
          ₦{(wallet?.balance ?? 0).toLocaleString()}
        </p>
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-white/40 text-xs mb-0.5">
          Total Platform Earned (10% fees)
        </p>
        <p className="text-white font-bold text-xl">
          ₦{(wallet?.totalEarned ?? 0).toLocaleString()}
        </p>
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-white/40 text-xs mb-0.5">Total Paid Out to Hosts</p>
        <p className="text-amber-400 font-bold text-xl">
          ₦{(wallet?.totalWithdrawn ?? 0).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ADMIN: WITHDRAWAL REQUESTS PANEL
═══════════════════════════════════════════════════════════ */
const WithdrawalsPanel = ({ adminId }: { adminId: string }) => {
  const [requests, setRequests] = useState<
    import("../index").WithdrawalRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{
    id: string;
    hostId: string;
    amount: number;
    note: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await WalletDB.adminWithdrawals(
      filter === "all" ? undefined : filter,
    );
    setRequests(all);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (wr: import("../index").WithdrawalRequest) => {
    setProcessing(wr.id);
    try {
      await WalletDB.approveWithdrawal(wr.id, adminId);
      await load();
    } finally {
      setProcessing(null);
    }
  };

  const reject = async () => {
    if (!rejectModal || !rejectModal.note.trim()) return;
    setProcessing(rejectModal.id);
    try {
      await WalletDB.rejectWithdrawal(
        rejectModal.id,
        adminId,
        rejectModal.note,
        rejectModal.hostId,
        rejectModal.amount,
      );
      setRejectModal(null);
      await load();
    } finally {
      setProcessing(null);
    }
  };

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="mb-6">
        <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#f5f0e8] mb-1">
          Withdrawal Requests
        </h2>
        <p className="text-[rgba(245,240,232,0.4)] text-sm">
          Review and process host payout requests
        </p>
      </div>

      <PlatformEarningsSummary adminId={adminId} />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
              filter === f
                ? "bg-[#C9A96E] border-[#C9A96E] text-[#0e0d0b]"
                : "border-[rgba(245,240,232,0.1)] text-[rgba(245,240,232,0.45)] hover:border-[rgba(201,169,110,0.3)]"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && ` (${counts[f] ?? 0})`}
          </button>
        ))}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="bg-[#1a1610] border border-[rgba(245,240,232,0.1)] rounded-2xl shadow-2xl p-6 w-full max-w-md"
            style={{ animation: "fadeUp 0.2s ease both" }}
          >
            <h3 className="font-['Cormorant_Garamond'] text-xl text-[#f5f0e8] mb-1">
              Reject Withdrawal
            </h3>
            <p className="text-sm text-[rgba(245,240,232,0.4)] mb-4">
              ₦{rejectModal.amount.toLocaleString()} will be refunded to the
              host's wallet automatically.
            </p>
            <textarea
              className="w-full bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] rounded-xl p-3 text-sm text-[#f5f0e8] outline-none resize-none focus:border-[#e07070] transition-colors placeholder:text-[rgba(245,240,232,0.2)] mb-4"
              rows={3}
              placeholder="Reason for rejection (shown to host)…"
              value={rejectModal.note}
              onChange={(e) =>
                setRejectModal((m) => (m ? { ...m, note: e.target.value } : m))
              }
            />
            <div className="flex gap-3">
              <button
                onClick={reject}
                disabled={!rejectModal.note.trim() || !!processing}
                className="flex-1 bg-[rgba(220,60,60,0.15)] border border-[rgba(220,60,60,0.3)] text-[#e07070] font-bold py-2.5 rounded-xl text-sm hover:bg-[rgba(220,60,60,0.25)] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <span className="w-4 h-4 border-2 border-[#e07070]/30 border-t-[#e07070] rounded-full animate-spin" />
                ) : (
                  <XCircleIcon className="w-4 h-4" />
                )}
                Reject & Refund
              </button>
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 border border-[rgba(245,240,232,0.1)] text-[rgba(245,240,232,0.5)] font-semibold py-2.5 rounded-xl text-sm hover:bg-[rgba(245,240,232,0.04)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#1a1610] border border-[rgba(245,240,232,0.07)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Sk key={i} h="h-14" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center">
            <BanknotesIcon className="w-10 h-10 text-[rgba(245,240,232,0.1)] mx-auto mb-3" />
            <p className="text-[rgba(245,240,232,0.35)] text-sm">
              No {filter !== "all" ? filter : ""} withdrawal requests
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[rgba(245,240,232,0.06)]">
                  {[
                    "Host",
                    "Bank Details",
                    "Amount",
                    "Requested",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-[rgba(245,240,232,0.25)] font-bold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((wr, i) => (
                  <tr
                    key={wr.id}
                    className="border-b border-[rgba(245,240,232,0.04)] hover:bg-[rgba(245,240,232,0.02)] transition-colors"
                    style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both` }}
                  >
                    <td className="px-5 py-3">
                      <p className="text-sm text-[#f5f0e8] font-medium">
                        {wr.hostFirstName} {wr.hostLastName}
                      </p>
                      <p className="text-xs text-[rgba(245,240,232,0.35)]">
                        {wr.hostEmail}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-[rgba(245,240,232,0.7)] font-medium">
                        {wr.bankName}
                      </p>
                      <p className="text-xs text-[rgba(245,240,232,0.35)]">
                        {wr.accountNumber} · {wr.accountName}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-bold text-[#f5f0e8]">
                        ₦{wr.amount.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-xs text-[rgba(245,240,232,0.4)] whitespace-nowrap">
                      {fmtDate(wr.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          wr.status === "approved"
                            ? "text-[#4ade80] bg-[rgba(74,222,128,0.1)] border-[rgba(74,222,128,0.25)]"
                            : wr.status === "rejected"
                              ? "text-[#e07070] bg-[rgba(220,60,60,0.1)] border-[rgba(220,60,60,0.25)]"
                              : "text-[#f59e0b] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.25)]"
                        }`}
                      >
                        {wr.status.charAt(0).toUpperCase() + wr.status.slice(1)}
                      </span>
                      {wr.status === "rejected" && wr.adminNote && (
                        <p className="text-[10px] text-[rgba(245,240,232,0.3)] mt-1 max-w-[160px] truncate">
                          {wr.adminNote}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {wr.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approve(wr)}
                            disabled={processing === wr.id}
                            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[rgba(74,222,128,0.1)] text-[#4ade80] border border-[rgba(74,222,128,0.25)] hover:bg-[rgba(74,222,128,0.2)] transition-all disabled:opacity-40"
                          >
                            {processing === wr.id ? (
                              <span className="w-3 h-3 border border-[#4ade80]/30 border-t-[#4ade80] rounded-full animate-spin" />
                            ) : (
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              setRejectModal({
                                id: wr.id,
                                hostId: wr.hostId,
                                amount: wr.amount,
                                note: "",
                              })
                            }
                            disabled={!!processing}
                            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[rgba(220,60,60,0.08)] text-[#e07070] border border-[rgba(220,60,60,0.2)] hover:bg-[rgba(220,60,60,0.15)] transition-all disabled:opacity-40"
                          >
                            <XCircleIcon className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[rgba(245,240,232,0.25)]">
                          {wr.reviewedAt ? fmtDate(wr.reviewedAt) : "—"}
                        </span>
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
   SIDEBAR
═══════════════════════════════════════════════════════════ */
const NAV = [
  {
    key: "withdrawals" as AdminView,
    label: "Withdrawals",
    icon: BanknotesIcon,
  },
  {
    key: "overview" as AdminView,
    label: "Overview",
    icon: ArrowTrendingUpIcon,
  },
  { key: "hosts" as AdminView, label: "Hosts", icon: UsersIcon },
  {
    key: "verification" as AdminView,
    label: "Verification Queue",
    icon: ShieldCheckIcon,
  },
  {
    key: "bookings" as AdminView,
    label: "All Bookings",
    icon: CalendarDaysIcon,
  },
  { key: "reviews" as AdminView, label: "All Reviews", icon: StarIcon },
];

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════ */
export default function AdminDashboard({ adminId }: { adminId: string }) {
  const [view, setView] = useState<AdminView>("overview");

  return (
    <div className="min-h-screen bg-[#0e0d0b] text-[#f5f0e8] flex overflow-hidden">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Sidebar */}
      <aside
        className="w-56 h-screen flex flex-col shrink-0 sticky top-0"
        style={{
          background:
            "linear-gradient(180deg,#130d07 0%,#1e1308 55%,#130d07 100%)",
        }}
      >
        <div className="h-px bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
        <div className="px-4 py-5 border-b border-[rgba(245,240,232,0.06)]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#C9A96E] rotate-45 rounded-sm" />
            <span className="font-['Cormorant_Garamond'] text-base tracking-wide text-[#f5f0e8]">
              LuxStay
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-[rgba(201,169,110,0.08)] border border-[rgba(201,169,110,0.15)] w-fit">
            <ShieldCheckIcon className="w-3 h-3 text-[#C9A96E]" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#C9A96E]">
              Admin
            </span>
          </div>
        </div>
        <nav className="flex-1 px-2 pt-3 space-y-0.5">
          {NAV.map(({ key, label, icon: Icon }) => {
            const isActive =
              view === key || (view === "host-detail" && key === "hosts");
            return (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${isActive ? "text-[#0e0d0b] shadow-md" : "text-[rgba(245,240,232,0.4)] hover:text-[rgba(245,240,232,0.75)] hover:bg-[rgba(245,240,232,0.04)]"}`}
                style={
                  isActive
                    ? { background: "linear-gradient(135deg,#C9A96E,#9a7030)" }
                    : {}
                }
              >
                <Icon style={{ width: 15, height: 15 }} className="shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>
        <div className="px-2 pb-4 pt-2 border-t border-[rgba(245,240,232,0.06)]">
          <p className="text-[9px] text-[rgba(245,240,232,0.2)] text-center">
            Admin ID: {adminId.slice(0, 8)}…
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-[rgba(14,13,11,0.9)] border-b border-[rgba(245,240,232,0.06)] flex items-center px-6 shrink-0 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <EyeIcon className="w-4 h-4 text-[#C9A96E]" />
            <span className="text-sm font-semibold text-[#f5f0e8]">
              {NAV.find((n) => n.key === view)?.label ?? "Admin Console"}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-[rgba(201,169,110,0.08)] border border-[rgba(201,169,110,0.15)] rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="text-[10px] font-bold text-[#C9A96E] uppercase tracking-wider">
              Live
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {view === "overview" && <OverviewPanel onNavigate={setView} />}
          {(view === "hosts" || view === "host-detail") && (
            <HostsPanel adminId={adminId} />
          )}
          {view === "withdrawals" && <WithdrawalsPanel adminId={adminId} />}
          {view === "verification" && <VerificationPanel adminId={adminId} />}
          {view === "bookings" && <AllBookingsPanel />}
          {view === "reviews" && <AllReviewsPanel />}
        </div>
      </div>
    </div>
  );
}
