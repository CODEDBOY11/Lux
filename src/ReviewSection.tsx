import { useState, useEffect } from "react";
import {
  StarIcon,
  ChatBubbleLeftRightIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { useAuth } from "./AuthContext";
import {
  ReviewsDB,
  ListingsDB,
  listingToHotel,
  type Review,
  type Hotel,
} from "./index";

/* ── helpers ── */
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const Sk = ({
  h = "h-8",
  rounded = "rounded-xl",
}: {
  h?: string;
  rounded?: string;
}) => <div className={`w-full ${h} ${rounded} bg-gray-100 animate-pulse`} />;

const StarRow = ({
  rating,
  max = 5,
  size = "w-3.5 h-3.5",
}: {
  rating: number;
  max?: number;
  size?: string;
}) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <StarSolid
        key={i}
        className={`${size} ${i < Math.round(rating) ? "text-[#C9A96E]" : "text-gray-200"}`}
      />
    ))}
  </div>
);

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
    className="bg-white rounded-2xl border border-gray-100 p-5 flex-1 min-w-[140px] shadow-sm hover:shadow-md transition-all"
    style={{ animation: `fadeUp 0.4s ease ${delay}ms both` }}
  >
    <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center mb-3">
      {icon}
    </div>
    <p className="text-2xl font-bold text-gray-900 font-['Cormorant_Garamond'] leading-none">
      {value}
    </p>
    <p className="text-xs text-gray-400 mt-1">{label}</p>
  </div>
);

/* ════════════════════════════════════════════════════════════
   HOST REPLY FORM
════════════════════════════════════════════════════════════ */
const ReplyForm = ({
  reviewId,
  existing,
  onSaved,
}: {
  reviewId: string;
  existing?: string;
  onSaved: (reply: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(existing ?? "");
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-[#C9A96E] hover:underline mt-3"
      >
        {existing ? "Edit reply →" : "Reply to this review →"}
      </button>
    );
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <p className="text-xs font-semibold text-gray-500 mb-2">Your reply</p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        placeholder="Thank the guest or address their feedback…"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C9A96E] resize-none placeholder:text-gray-300 transition-colors"
      />
      <div className="flex gap-2 mt-2">
        <button
          disabled={saving || !draft.trim()}
          onClick={async () => {
            setSaving(true);
            await ReviewsDB.addHostReply(reviewId, draft.trim());
            onSaved(draft.trim());
            setSaving(false);
            setOpen(false);
          }}
          className="text-xs font-bold bg-[#C9A96E] text-white px-4 py-2 rounded-xl hover:bg-[#b8935a] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Reply"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-3 py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════════════════════════ */
export default function ReviewsSection() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "5" | "4" | "3" | "1-2">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      ReviewsDB.byHost(user.id),
      ListingsDB.byHost(user.id).then((l) => l.map(listingToHotel)),
    ])
      .then(([r, h]) => {
        setReviews(r);
        setHotels(h);
      })
      .finally(() => setLoading(false));
  }, [user]);

  /* ── derived stats ── */
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  const filtered =
    filter === "all"
      ? reviews
      : filter === "1-2"
        ? reviews.filter((r) => r.rating <= 2)
        : reviews.filter((r) => Math.round(r.rating) === Number(filter));

  /* ── sub-rating averages ── */
  const subAvg = (key: keyof Review) => {
    const vals = reviews
      .map((r) => r[key] as number | undefined)
      .filter(Boolean) as number[];
    return vals.length
      ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1)
      : "—";
  };

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-50 p-6"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          Guest feedback across all your properties
        </p>
      </div>

      {/* ── Stat cards ── */}
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
          value={reviews.length}
          delay={60}
        />
        <StatCard
          icon={<BuildingOffice2Icon className="w-5 h-5 text-[#C9A96E]" />}
          label="Properties Rated"
          value={new Set(reviews.map((r) => r.listingId)).size}
          delay={120}
        />
        <StatCard
          icon={<StarSolid className="w-5 h-5 text-[#C9A96E]" />}
          label="5-Star Reviews"
          value={`${reviews.length ? Math.round((reviews.filter((r) => r.rating === 5).length / reviews.length) * 100) : 0}%`}
          delay={180}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 mb-6">
        {/* ── Rating breakdown ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5">Rating Distribution</h3>
          <div className="flex items-center gap-8 flex-wrap">
            {/* Big number */}
            <div className="text-center shrink-0">
              <p className="font-['Cormorant_Garamond'] text-5xl font-bold text-gray-900 leading-none">
                {avg}
              </p>
              <StarRow rating={Number(avg) || 0} size="w-4 h-4" />
              <p className="text-xs text-gray-400 mt-1">
                {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </p>
            </div>
            {/* Bars */}
            <div className="flex-1 min-w-[160px] space-y-2">
              {ratingDist.map(({ star, count }) => (
                <div
                  key={star}
                  className="flex items-center gap-2 text-xs text-gray-500"
                >
                  <span className="w-3 text-right shrink-0">{star}</span>
                  <StarSolid className="w-3 h-3 text-[#C9A96E] shrink-0" />
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-[#C9A96E] transition-all duration-700"
                      style={{
                        width: reviews.length
                          ? `${(count / reviews.length) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <span className="w-4 text-right shrink-0 text-gray-400">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sub-rating averages ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5">Category Averages</h3>
          <div className="space-y-3">
            {[
              { label: "Cleanliness", key: "cleanliness" as keyof Review },
              { label: "Service", key: "service" as keyof Review },
              { label: "Location", key: "location" as keyof Review },
              { label: "Value", key: "value" as keyof Review },
            ].map(({ label, key }) => {
              const val = subAvg(key);
              const pct = val === "—" ? 0 : (Number(val) / 5) * 100;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-24 shrink-0">
                    {label}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-[#C9A96E] transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-8 text-right">
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Per-property summary ── */}
      {hotels.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Property Ratings</h3>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Sk key={i} h="h-16" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {hotels.map((h, i) => {
                const hotelReviews = reviews.filter(
                  (r) => r.listingId === h.id,
                );
                const hotelAvg = hotelReviews.length
                  ? (
                      hotelReviews.reduce((s, r) => s + r.rating, 0) /
                      hotelReviews.length
                    ).toFixed(1)
                  : null;
                return (
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
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPinIcon className="w-3 h-3 text-[#C9A96E]" />
                        <p className="text-xs text-gray-400">
                          {h.city}, {h.country}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {hotelAvg ? (
                        <>
                          <StarRow rating={Number(hotelAvg)} />
                          <p className="text-sm font-bold text-gray-800 mt-0.5">
                            {hotelAvg}
                          </p>
                          <p className="text-xs text-gray-400">
                            {hotelReviews.length} review
                            {hotelReviews.length !== 1 ? "s" : ""}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          No reviews yet
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Full review list ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filter tabs */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-bold text-gray-900">All Reviews</h3>
          <div className="flex gap-2 flex-wrap">
            {(["all", "5", "4", "3", "1-2"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${filter === f ? "bg-[#C9A96E] border-[#C9A96E] text-white" : "border-gray-200 text-gray-500 hover:border-[#C9A96E]"}`}
              >
                {f === "all"
                  ? `All (${reviews.length})`
                  : f === "1-2"
                    ? "1-2 ★"
                    : `${f} ★`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Sk key={i} h="h-28" rounded="rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <StarIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No reviews in this category</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((r, i) => {
              const hotel = hotels.find((h) => h.id === r.listingId);
              const isExpanded = expanded === r.id;
              return (
                <div
                  key={r.id}
                  className="px-6 py-5 hover:bg-gray-50/40 transition-colors"
                  style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both` }}
                >
                  {/* Review header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center font-bold text-[#C9A96E] text-sm shrink-0">
                      {r.guestAvatar || r.guestName?.[0]?.toUpperCase() || "G"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">
                          {r.guestName || "Anonymous"}
                        </p>
                        <span className="text-xs text-gray-400">
                          {fmtDate(r.createdAt)}
                        </span>
                      </div>
                      <StarRow rating={r.rating} size="w-3 h-3" />
                      {hotel && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <BuildingOffice2Icon className="w-3 h-3" />{" "}
                          {hotel.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Review content */}
                  {r.title && (
                    <p className="font-semibold text-gray-800 text-sm mb-1">
                      {r.title}
                    </p>
                  )}
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {isExpanded || r.body.length <= 200
                      ? r.body
                      : `${r.body.slice(0, 200)}…`}
                  </p>
                  {r.body.length > 200 && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : r.id)}
                      className="text-xs text-[#C9A96E] font-semibold mt-1 flex items-center gap-1 hover:underline"
                    >
                      {isExpanded ? "Show less" : "Read more"}
                      <ChevronDownIcon
                        className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}

                  {/* Sub-ratings */}
                  {(r.cleanliness || r.service || r.location || r.value) && (
                    <div className="flex gap-4 mt-3 flex-wrap">
                      {[
                        { label: "Clean", val: r.cleanliness },
                        { label: "Service", val: r.service },
                        { label: "Location", val: r.location },
                        { label: "Value", val: r.value },
                      ]
                        .filter((x) => x.val)
                        .map(({ label, val }) => (
                          <div
                            key={label}
                            className="flex items-center gap-1 text-xs text-gray-500"
                          >
                            <span className="text-gray-400">{label}:</span>
                            <StarSolid className="w-3 h-3 text-[#C9A96E]" />
                            <span className="font-semibold text-gray-700">
                              {val}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Host reply */}
                  {r.hostReply && (
                    <div className="mt-3 bg-[#C9A96E]/06 border border-[#C9A96E]/15 rounded-xl px-4 py-3">
                      <p className="text-xs font-bold text-[#C9A96E] mb-1">
                        Your Reply
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {r.hostReply}
                      </p>
                    </div>
                  )}

                  {/* Reply button */}
                  <ReplyForm
                    reviewId={r.id}
                    existing={r.hostReply}
                    onSaved={(reply) => {
                      setReviews((prev) =>
                        prev.map((x) =>
                          x.id === r.id ? { ...x, hostReply: reply } : x,
                        ),
                      );
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
