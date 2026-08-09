/* ═══════════════════════════════════════════════════════════
   HOST DASHBOARD — NEW POWER-USER MODULES
   Occupancy Board · Booking Calendar · Sales Analytics
   Staff Management · Attendance · Guest CRM · Camera Grid
   ───────────────────────────────────────────────────────────
   Wire-up: everything reads/writes through the DB modules
   exported from ./index (Supabase-backed) — RoomsDB, StaffDB,
   AttendanceDB, GuestsDB, GuestOrdersDB, CamerasDB, AnalyticsDB.
   Run the SQL block near the bottom of index.ts in your
   Supabase SQL Editor once (rooms, staff, attendance,
   guest_orders, cameras tables) before using these sections.
═══════════════════════════════════════════════════════════ */
import { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  ClockIcon,
  UserPlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ChartBarIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  CakeIcon,
  BeakerIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "./AuthContext";
import {
  ListingsDB,
  BookingsDB,
  listingToHotel,
  RoomsDB,
  StaffDB,
  AttendanceDB,
  GuestsDB,
  GuestOrdersDB,
  CamerasDB,
  AnalyticsDB,
  type Booking,
  type Hotel,
  type Room,
  type RoomOccupancyStatus,
  type StaffMember,
  type StaffRole,
  type AttendanceRecord,
  type GuestProfile,
  type GuestOrderItem,
  type OrderCategory,
  type RoomCamera,
  type AnalyticsSummary,
} from "./index";
import { fmt$, fmtDate, Sk, StatCard } from "./HostDashboard";

const GOLD = "#C9A96E";

/* ═══════════════════════════════════════════════════════════
   1. OCCUPANCY BOARD — which rooms are filled / empty
═══════════════════════════════════════════════════════════ */
const OCC_CONFIG: Record<
  RoomOccupancyStatus,
  { label: string; color: string; bg: string }
> = {
  occupied: { label: "Occupied", color: "#dc2626", bg: "#fef2f2" },
  vacant: { label: "Vacant", color: "#16a34a", bg: "#f0fdf4" },
  cleaning: { label: "Cleaning", color: "#2563eb", bg: "#eff6ff" },
  maintenance: { label: "Maintenance", color: "#d97706", bg: "#fffbeb" },
  reserved: { label: "Reserved", color: "#7c3aed", bg: "#f5f3ff" },
};

export const OccupancyBoard = () => {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [listingId, setListingId] = useState<string>("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!user) return;
    ListingsDB.byHost(user.id)
      .then((l) => l.map(listingToHotel))
      .then((h) => {
        setHotels(h);
        if (h[0]) setListingId(h[0].id);
      });
    BookingsDB.byHost(user.id).then(setBookings);
  }, [user]);

  const load = () => {
    if (!listingId) return;
    setLoading(true);
    RoomsDB.byListing(listingId)
      .then(setRooms)
      .finally(() => setLoading(false));
  };
  useEffect(load, [listingId]);

  const bookingById = useMemo(() => new Map(bookings.map((b) => [b.id, b])), [bookings]);

  const setStatus = async (id: string, status: RoomOccupancyStatus) => {
    setRooms((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
    await RoomsDB.updateStatus(id, status, status !== "occupied" ? { currentBookingId: null } : undefined);
  };

  const addRoom = async () => {
    if (!listingId || !newLabel.trim()) return;
    setAdding(true);
    const room = await RoomsDB.add({ listingId, label: newLabel.trim() });
    setRooms((p) => [...p, room]);
    setNewLabel("");
    setAdding(false);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    rooms.forEach((r) => (c[r.status] = (c[r.status] ?? 0) + 1));
    return c;
  }, [rooms]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6" style={{ animation: "fadeUp 0.3s ease both" }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Room Occupancy</h2>
          <p className="text-gray-400 text-sm mt-0.5">Live status of every room across your property</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {hotels.length > 1 && (
            <select
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#C9A96E] bg-white"
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          )}
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Room 305"
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#C9A96E] bg-white w-32"
          />
          <button
            disabled={adding || !newLabel.trim()}
            onClick={addRoom}
            className="text-xs font-semibold text-white bg-[#C9A96E] hover:bg-[#b8935a] px-3.5 py-2.5 rounded-xl disabled:opacity-50 whitespace-nowrap"
          >
            + Add Room
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap mb-6">
        {(Object.keys(OCC_CONFIG) as RoomOccupancyStatus[]).map((s) => (
          <div key={s} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-2.5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: OCC_CONFIG[s].color }} />
            <span className="text-sm font-semibold text-gray-700">{counts[s] ?? 0}</span>
            <span className="text-xs text-gray-400">{OCC_CONFIG[s].label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Sk key={i} h="h-32" />)}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <BuildingOffice2Icon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No rooms added yet — add your first room above</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map((r, i) => {
            const cfg = OCC_CONFIG[r.status];
            const booking = r.currentBookingId ? bookingById.get(r.currentBookingId) : undefined;
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all"
                style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-900 text-sm">{r.label}</p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: cfg.color, background: cfg.bg }}
                  >
                    {cfg.label}
                  </span>
                </div>
                {r.status === "occupied" && booking ? (
                  <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                    <p className="truncate">👤 {booking.guestName}</p>
                    <p>{fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-3">
                    {r.lastCleanedAt ? `Last cleaned ${fmtDate(r.lastCleanedAt)}` : "No recent activity"}
                  </p>
                )}
                <select
                  value={r.status}
                  onChange={(e) => setStatus(r.id, e.target.value as RoomOccupancyStatus)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#C9A96E] bg-gray-50 text-gray-600"
                >
                  {(Object.keys(OCC_CONFIG) as RoomOccupancyStatus[]).map((s) => (
                    <option key={s} value={s}>{OCC_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   2. BOOKING CALENDAR — which rooms are booked, by date
═══════════════════════════════════════════════════════════ */
export const BookingCalendarSection = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    BookingsDB.byHost(user.id).then(setBookings).finally(() => setLoading(false));
  }, [user]);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [
      ...Array(startOffset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ];
    return cells;
  }, [cursor]);

  const bookingsByDay = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings
      .filter((b) => b.status !== "cancelled")
      .forEach((b) => {
        const start = new Date(b.checkIn);
        const end = new Date(b.checkOut);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().slice(0, 10);
          (map[key] ??= []).push(b);
        }
      });
    return map;
  }, [bookings]);

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const selectedBookings = selected ? bookingsByDay[selected] ?? [] : [];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6" style={{ animation: "fadeUp 0.3s ease both" }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Booking Calendar</h2>
        <p className="text-gray-400 text-sm mt-0.5">See which rooms are booked on any given day</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <p className="font-bold text-gray-900">{monthLabel}</p>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <Sk h="h-72" />
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((d, i) => {
                  if (!d) return <div key={i} />;
                  const key = d.toISOString().slice(0, 10);
                  const count = (bookingsByDay[key] ?? []).length;
                  const isSelected = selected === key;
                  const isToday = key === new Date().toISOString().slice(0, 10);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(key)}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all relative ${
                        isSelected
                          ? "bg-[#C9A96E] text-white shadow-md"
                          : count > 0
                          ? "bg-[#C9A96E]/10 text-gray-800 hover:bg-[#C9A96E]/20"
                          : "text-gray-500 hover:bg-gray-50"
                      } ${isToday && !isSelected ? "ring-1 ring-[#C9A96E]" : ""}`}
                    >
                      {d.getDate()}
                      {count > 0 && (
                        <span
                          className={`mt-0.5 text-[9px] font-bold ${isSelected ? "text-white/80" : "text-[#C9A96E]"}`}
                        >
                          {count} booked
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">
            {selected ? fmtDate(selected) : "Pick a date"}
          </h3>
          {!selected ? (
            <p className="text-gray-400 text-xs">Click a day to see which rooms are booked.</p>
          ) : selectedBookings.length === 0 ? (
            <p className="text-gray-400 text-xs">No rooms booked this day — fully vacant.</p>
          ) : (
            <div className="space-y-3">
              {selectedBookings.map((b) => (
                <div key={b.id} className="border border-gray-100 rounded-xl p-3">
                  <p className="text-sm font-semibold text-gray-800 truncate">{b.listingName}</p>
                  <p className="text-xs text-gray-500">{b.guestName}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   3. SALES ANALYTICS — revenue charts
═══════════════════════════════════════════════════════════ */
export const SalesAnalyticsSection = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [range, setRange] = useState(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    AnalyticsDB.summary(user.id, range).then(setData).finally(() => setLoading(false));
  }, [user, range]);

  const chartData = (data?.series ?? []).map((p) => ({
    date: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Bookings: p.bookingRevenue,
    Orders: p.orderRevenue,
  }));

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6" style={{ animation: "fadeUp 0.3s ease both" }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Analytics</h2>
          <p className="text-gray-400 text-sm mt-0.5">Revenue trends across bookings and in-stay orders</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-all ${range === d ? "bg-[#C9A96E] border-[#C9A96E] text-white" : "border-gray-200 text-gray-500 bg-white hover:border-[#C9A96E]"}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="space-y-6">
          <div className="flex gap-4 flex-wrap">{[...Array(4)].map((_, i) => <Sk key={i} h="h-24" />)}</div>
          <Sk h="h-80" />
        </div>
      ) : (
        <>
          <div className="flex gap-4 flex-wrap mb-6">
            <StatCard icon={<BanknotesIcon className="w-5 h-5 text-[#C9A96E]" />} label="Total Revenue" value={fmt$(data.totalRevenue)} />
            <StatCard icon={<BuildingOffice2Icon className="w-5 h-5 text-[#C9A96E]" />} label="Booking Revenue" value={fmt$(data.totalBookingRevenue)} delay={60} />
            <StatCard icon={<ShoppingBagIcon className="w-5 h-5 text-[#C9A96E]" />} label="Order Revenue" value={fmt$(data.totalOrderRevenue)} delay={120} />
            <StatCard icon={<ChartBarIcon className="w-5 h-5 text-[#C9A96E]" />} label="Occupancy Rate" value={`${data.occupancyRate}%`} delay={180} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Revenue Over Time</h3>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GOLD} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6EADC9" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6EADC9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f1f1f1", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Bookings" stroke={GOLD} fill="url(#gBookings)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Orders" stroke="#6EADC9" fill="url(#gOrders)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Top Earning Properties</h3>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={data.topListings} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f1f1f1", fontSize: 12 }} />
                  <Bar dataKey="revenue" fill={GOLD} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   4. STAFF MANAGEMENT
═══════════════════════════════════════════════════════════ */
const ROLE_LABELS: Record<StaffRole, string> = {
  manager: "Manager",
  front_desk: "Front Desk",
  housekeeping: "Housekeeping",
  security: "Security",
  kitchen: "Kitchen",
  maintenance: "Maintenance",
  other: "Other",
};

export const StaffManagementSection = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", role: "front_desk" as StaffRole, phone: "", email: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!user) return;
    setLoading(true);
    StaffDB.byHost(user.id).then(setStaff).finally(() => setLoading(false));
  };
  useEffect(load, [user]);

  const addStaff = async () => {
    if (!user || !form.fullName.trim()) return;
    setSaving(true);
    const rec = await StaffDB.add({
      hostId: user.id,
      fullName: form.fullName.trim(),
      role: form.role,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
    });
    setStaff((p) => [...p, rec]);
    setForm({ fullName: "", role: "front_desk", phone: "", email: "" });
    setShowForm(false);
    setSaving(false);
  };

  const removeStaff = async (id: string) => {
    if (!confirm("Remove this staff member?")) return;
    setStaff((p) => p.filter((s) => s.id !== id));
    await StaffDB.remove(id);
  };

  const toggleStatus = async (s: StaffMember) => {
    const next = s.status === "active" ? "on_leave" : "active";
    setStaff((p) => p.map((x) => (x.id === s.id ? { ...x, status: next } : x)));
    await StaffDB.setStatus(s.id, next);
  };

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/10 transition-all bg-white";

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6" style={{ animation: "fadeUp 0.3s ease both" }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-400 text-sm mt-0.5">{staff.length} team member{staff.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#C9A96E] hover:bg-[#b8935a] px-4 py-2.5 rounded-xl transition-all"
        >
          <UserPlusIcon className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ animation: "fadeUp 0.2s ease both" }}>
          <input className={inp} placeholder="Full name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          <select className={inp} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as StaffRole }))}>
            {(Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <input className={inp} placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <input className={inp} placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-sm font-semibold text-gray-500 px-4 py-2">Cancel</button>
            <button disabled={saving} onClick={addStaff} className="text-sm font-semibold text-white bg-[#C9A96E] hover:bg-[#b8935a] px-5 py-2 rounded-xl disabled:opacity-50">
              {saving ? "Saving…" : "Save Staff"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Sk key={i} h="h-12" />)}</div>
        ) : staff.length === 0 ? (
          <div className="p-14 text-center">
            <UserGroupIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No staff added yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Name", "Role", "Contact", "Status", "Hired", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/60" style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both` }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "linear-gradient(135deg,#C9A96E,#8a6030)" }}>
                          {s.fullName[0]}
                        </div>
                        <p className="text-sm font-medium text-gray-800">{s.fullName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{ROLE_LABELS[s.role]}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {s.phone && <p className="flex items-center gap-1"><PhoneIcon className="w-3 h-3" />{s.phone}</p>}
                      {s.email && <p className="flex items-center gap-1 truncate max-w-[160px]"><EnvelopeIcon className="w-3 h-3" />{s.email}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleStatus(s)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${s.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                      >
                        {s.status === "active" ? "Active" : s.status.replace("_", " ")}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(s.hiredAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => removeStaff(s.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
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
   5. ATTENDANCE — clock in/out tracking
═══════════════════════════════════════════════════════════ */
export const AttendanceSection = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [records, setRecords] = useState<(AttendanceRecord & { staffName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState<string>(new Date().toISOString().slice(0, 10));
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    if (!user) return;
    setLoading(true);
    Promise.all([StaffDB.byHost(user.id), AttendanceDB.byHost(user.id)])
      .then(([s, r]) => {
        setStaff(s);
        setRecords(r);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, [user]);

  const today = new Date().toISOString().slice(0, 10);
  const openRecordFor = (staffId: string) =>
    records.find((r) => r.staffId === staffId && r.date === today && !r.clockOut);

  const doClockIn = async (staffId: string) => {
    setBusyId(staffId);
    const rec = await AttendanceDB.clockIn(staffId);
    const name = staff.find((s) => s.id === staffId)?.fullName ?? "Unknown";
    setRecords((p) => [{ ...rec, staffName: name }, ...p]);
    setBusyId(null);
  };

  const doClockOut = async (recordId: string) => {
    setBusyId(recordId);
    const updated = await AttendanceDB.clockOut(recordId);
    if (updated) {
      setRecords((p) => p.map((r) => (r.id === recordId ? { ...updated, staffName: r.staffName } : r)));
    }
    setBusyId(null);
  };

  const dayRecords = records.filter((r) => r.date === dayFilter);
  const lateCount = dayRecords.filter((r) => r.status === "late").length;
  const absentCount = dayRecords.filter((r) => r.status === "absent").length;
  const onTimeCount = dayRecords.filter((r) => r.status === "on_time").length;

  const STATUS_STYLE: Record<string, string> = {
    on_time: "bg-emerald-50 text-emerald-700 border-emerald-200",
    late: "bg-amber-50 text-amber-700 border-amber-200",
    absent: "bg-red-50 text-red-600 border-red-200",
    half_day: "bg-blue-50 text-blue-600 border-blue-200",
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6" style={{ animation: "fadeUp 0.3s ease both" }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Attendance</h2>
          <p className="text-gray-400 text-sm mt-0.5">Track clock-in / clock-out times per day</p>
        </div>
        <input
          type="date"
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#C9A96E] bg-white"
        />
      </div>

      {staff.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Clock In / Out</p>
          <div className="flex flex-wrap gap-2">
            {staff.filter((s) => s.status === "active").map((s) => {
              const open = openRecordFor(s.id);
              return (
                <button
                  key={s.id}
                  disabled={busyId === s.id || busyId === open?.id}
                  onClick={() => (open ? doClockOut(open.id) : doClockIn(s.id))}
                  className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-all disabled:opacity-50 ${
                    open
                      ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  {s.fullName} — {open ? "Clock Out" : "Clock In"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-4 flex-wrap mb-6">
        <StatCard icon={<CheckCircleIcon className="w-5 h-5 text-emerald-500" />} label="On Time" value={onTimeCount} accent="#16a34a" />
        <StatCard icon={<ClockIcon className="w-5 h-5 text-amber-500" />} label="Late" value={lateCount} delay={60} accent="#d97706" />
        <StatCard icon={<ExclamationTriangleIcon className="w-5 h-5 text-red-500" />} label="Absent" value={absentCount} delay={120} accent="#dc2626" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Sk key={i} h="h-12" />)}</div>
        ) : dayRecords.length === 0 ? (
          <div className="p-14 text-center">
            <ClockIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No attendance records for this day</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Staff", "Clock In", "Clock Out", "Hours", "Status"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayRecords.map((r, i) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/60" style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both` }}>
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{r.staffName}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {r.clockIn ? new Date(r.clockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {r.clockOut ? new Date(r.clockOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{r.hoursWorked ? `${r.hoursWorked}h` : "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[r.status]}`}>
                        {r.status.replace("_", " ")}
                      </span>
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
   6. GUEST CRM — spend, stay history, snacks/drinks ordered
═══════════════════════════════════════════════════════════ */
export const GuestProfilesSection = () => {
  const { user } = useAuth();
  const [guests, setGuests] = useState<GuestProfile[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GuestProfile | null>(null);
  const [orders, setOrders] = useState<GuestOrderItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderForm, setOrderForm] = useState({ itemName: "", category: "snack" as OrderCategory, quantity: 1, unitPrice: 0, listingId: "" });
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    if (!user) return;
    GuestsDB.byHost(user.id).then(setGuests).finally(() => setLoading(false));
    ListingsDB.byHost(user.id)
      .then((l) => l.map(listingToHotel))
      .then((h) => {
        setHotels(h);
        if (h[0]) setOrderForm((f) => ({ ...f, listingId: h[0].id }));
      });
  }, [user]);

  const openGuest = async (g: GuestProfile) => {
    setSelected(g);
    setOrdersLoading(true);
    GuestOrdersDB.byGuest(g.id).then(setOrders).finally(() => setOrdersLoading(false));
  };

  const logOrder = async () => {
    if (!user || !selected || !orderForm.itemName.trim() || !orderForm.listingId) return;
    setSavingOrder(true);
    const order = await GuestOrdersDB.add({
      guestId: selected.id,
      listingId: orderForm.listingId,
      hostId: user.id,
      category: orderForm.category,
      itemName: orderForm.itemName.trim(),
      quantity: orderForm.quantity,
      unitPrice: orderForm.unitPrice,
    });
    setOrders((p) => [order, ...p]);
    setSelected((s) => (s ? { ...s, totalSpend: s.totalSpend + order.unitPrice * order.quantity } : s));
    setGuests((p) => p.map((g) => (g.id === selected.id ? { ...g, totalSpend: g.totalSpend + order.unitPrice * order.quantity } : g)));
    setOrderForm((f) => ({ ...f, itemName: "", quantity: 1, unitPrice: 0 }));
    setSavingOrder(false);
  };

  const catIcon = (c: OrderCategory) =>
    c === "snack" ? <CakeIcon className="w-3.5 h-3.5" /> : c === "drink" ? <BeakerIcon className="w-3.5 h-3.5" /> : <ShoppingBagIcon className="w-3.5 h-3.5" />;

  const inp = "border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#C9A96E] bg-white";

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6" style={{ animation: "fadeUp 0.3s ease both" }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Guest Profiles</h2>
        <p className="text-gray-400 text-sm mt-0.5">Spend, stay history and orders per guest</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Sk key={i} h="h-14" />)}</div>
          ) : guests.length === 0 ? (
            <div className="p-14 text-center">
              <UserGroupIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No guest history yet — profiles build automatically from bookings</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Guest", "Stays", "Total Spend", "Last Stay", ""].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g, i) => (
                    <tr
                      key={g.id}
                      onClick={() => openGuest(g)}
                      className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${selected?.id === g.id ? "bg-[#C9A96E]/5" : ""}`}
                      style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both` }}
                    >
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-800">{g.fullName}</p>
                        <p className="text-xs text-gray-400">{g.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-gray-600">{g.totalStays}</span>
                        {g.isReturning && (
                          <span className="ml-2 text-[10px] font-bold text-[#C9A96E] bg-[#C9A96E]/10 px-1.5 py-0.5 rounded-full">Returning</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-800">{fmt$(g.totalSpend)}</td>
                      <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">{g.lastStayAt && fmtDate(g.lastStayAt)}</td>
                      <td className="px-5 py-3 text-right text-gray-300"><ChevronRightIcon className="w-4 h-4" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {!selected ? (
            <div className="text-center py-10">
              <UserGroupIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-xs">Select a guest to view details</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ background: "linear-gradient(135deg,#C9A96E,#8a6030)" }}>
                  {selected.fullName[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{selected.fullName}</p>
                  <p className="text-xs text-gray-400">{selected.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Total Spend</p>
                  <p className="text-sm font-bold text-gray-800">{fmt$(selected.totalSpend)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Total Stays</p>
                  <p className="text-sm font-bold text-gray-800">{selected.totalStays}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">First Stay</p>
                  <p className="text-sm font-bold text-gray-800">{selected.firstStayAt && fmtDate(selected.firstStayAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Last Stay</p>
                  <p className="text-sm font-bold text-gray-800">{selected.lastStayAt && fmtDate(selected.lastStayAt)}</p>
                </div>
              </div>

              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Snacks & Drinks Ordered</p>
              {ordersLoading ? (
                <div className="space-y-2 mb-3">{[...Array(3)].map((_, i) => <Sk key={i} h="h-9" />)}</div>
              ) : orders.length === 0 ? (
                <p className="text-xs text-gray-400 mb-3">No orders recorded</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                      <span className="flex items-center gap-1.5 text-gray-700">{catIcon(o.category)} {o.itemName} ×{o.quantity}</span>
                      <span className="text-gray-500">{o.unitPrice ? fmt$(o.unitPrice * o.quantity) : "—"}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Log an Order</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input className={inp} placeholder="Item name" value={orderForm.itemName} onChange={(e) => setOrderForm((f) => ({ ...f, itemName: e.target.value }))} />
                  <select className={inp} value={orderForm.category} onChange={(e) => setOrderForm((f) => ({ ...f, category: e.target.value as OrderCategory }))}>
                    <option value="snack">Snack</option>
                    <option value="drink">Drink</option>
                    <option value="room_service">Room Service</option>
                    <option value="other">Other</option>
                  </select>
                  <input type="number" min={1} className={inp} placeholder="Qty" value={orderForm.quantity} onChange={(e) => setOrderForm((f) => ({ ...f, quantity: Number(e.target.value) || 1 }))} />
                  <input type="number" min={0} className={inp} placeholder="Unit price (₦)" value={orderForm.unitPrice} onChange={(e) => setOrderForm((f) => ({ ...f, unitPrice: Number(e.target.value) || 0 }))} />
                  {hotels.length > 1 && (
                    <select className={`${inp} col-span-2`} value={orderForm.listingId} onChange={(e) => setOrderForm((f) => ({ ...f, listingId: e.target.value }))}>
                      {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  )}
                </div>
                <button
                  disabled={savingOrder || !orderForm.itemName.trim()}
                  onClick={logOrder}
                  className="w-full text-xs font-semibold text-white bg-[#C9A96E] hover:bg-[#b8935a] px-3.5 py-2 rounded-lg disabled:opacity-50"
                >
                  {savingOrder ? "Saving…" : "Add Order"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   7. CAMERA GRID — CCTV UI shell (ready to plug in a real feed)
═══════════════════════════════════════════════════════════ */
export const CameraGridSection = () => {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [listingId, setListingId] = useState("");
  const [cameras, setCameras] = useState<RoomCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState<RoomCamera | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [streamInput, setStreamInput] = useState("");

  useEffect(() => {
    if (!user) return;
    ListingsDB.byHost(user.id).then((l) => l.map(listingToHotel)).then((h) => {
      setHotels(h);
      if (h[0]) setListingId(h[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    CamerasDB.byListing(listingId).then(setCameras).finally(() => setLoading(false));
  }, [listingId]);

  const addCamera = async () => {
    if (!listingId || !newLabel.trim()) return;
    setAdding(true);
    const cam = await CamerasDB.add({ listingId, roomLabel: newLabel.trim() });
    setCameras((p) => [...p, cam]);
    setNewLabel("");
    setAdding(false);
  };

  const connectStream = async () => {
    if (!focused || !streamInput.trim()) return;
    await CamerasDB.connectStream(focused.id, streamInput.trim());
    setCameras((p) => p.map((c) => (c.id === focused.id ? { ...c, streamUrl: streamInput.trim(), status: "online" } : c)));
    setFocused((f) => (f ? { ...f, streamUrl: streamInput.trim(), status: "online" } : f));
    setStreamInput("");
  };

  const onlineCount = cameras.filter((c) => c.status === "online").length;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6" style={{ animation: "fadeUp 0.3s ease both" }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Room Cameras</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {onlineCount}/{cameras.length} feeds online — connect each room's camera to view live
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {hotels.length > 1 && (
            <select value={listingId} onChange={(e) => setListingId(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#C9A96E] bg-white">
              {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          )}
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Room 305"
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#C9A96E] bg-white w-32"
          />
          <button
            disabled={adding || !newLabel.trim()}
            onClick={addCamera}
            className="text-xs font-semibold text-white bg-[#C9A96E] hover:bg-[#b8935a] px-3.5 py-2.5 rounded-xl disabled:opacity-50 whitespace-nowrap"
          >
            + Add Camera
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
        <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
        <span>This is the camera control UI. Click a tile and paste a stream URL (HLS/RTSP-via-proxy from your NVR provider) to go live for that room.</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <Sk key={i} h="h-36" />)}</div>
      ) : cameras.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <VideoCameraIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No cameras added yet — add one above</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cameras.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setFocused(c)}
              className="bg-gray-900 rounded-2xl overflow-hidden relative group text-left shadow-sm hover:shadow-lg transition-all"
              style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both`, aspectRatio: "4/3" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {c.status === "online" ? (
                  <VideoCameraIcon className="w-8 h-8 text-white/20" />
                ) : (
                  <VideoCameraSlashIcon className="w-8 h-8 text-white/15" />
                )}
              </div>
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${c.status === "online" ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
                <span className="text-[10px] font-bold text-white/80 uppercase">{c.status}</span>
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                <p className="text-white text-xs font-semibold">{c.roomLabel}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {focused && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setFocused(null)}>
          <div className="bg-gray-900 rounded-2xl overflow-hidden max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <p className="text-white text-sm font-semibold">{focused.roomLabel}</p>
              <button onClick={() => setFocused(null)} className="text-white/50 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="aspect-video flex items-center justify-center bg-black">
              {focused.streamUrl ? (
                <video src={focused.streamUrl} controls autoPlay className="w-full h-full" />
              ) : (
                <div className="text-center text-white/40 text-sm">
                  <VideoCameraSlashIcon className="w-10 h-10 mx-auto mb-2" />
                  No stream connected yet for this room
                </div>
              )}
            </div>
            {!focused.streamUrl && (
              <div className="flex gap-2 p-4 border-t border-white/10">
                <input
                  value={streamInput}
                  onChange={(e) => setStreamInput(e.target.value)}
                  placeholder="Paste HLS/stream URL…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#C9A96E]"
                />
                <button onClick={connectStream} className="text-xs font-semibold text-white bg-[#C9A96E] hover:bg-[#b8935a] px-4 py-2 rounded-lg">
                  Connect
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};