import { useState, useRef } from "react";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  MoonIcon,
  UsersIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { BookingsDB, RoomTypesDB, RoomsDB } from "./index";
import type { Booking, RoomType } from "./index";

/* ── helpers ─────────────────────────────────────────── */
const fmt$ = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/* ── status pill ────────────────────────────────────── */
function StatusPill({ status }: { status: Booking["status"] }) {
  const map = {
    confirmed: {
      bg: "#dcfce7",
      color: "#166534",
      border: "#bbf7d0",
      label: "Confirmed",
    },
    pending: {
      bg: "#fef9c3",
      color: "#854d0e",
      border: "#fef08a",
      label: "Pending",
    },
    cancelled: {
      bg: "#fee2e2",
      color: "#991b1b",
      border: "#fecaca",
      label: "Cancelled",
    },
  };
  const s = map[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 99,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {status === "confirmed" ? (
        <CheckCircleIcon style={{ width: 12, height: 12 }} />
      ) : status === "cancelled" ? (
        <XCircleIcon style={{ width: 12, height: 12 }} />
      ) : null}
      {s.label}
    </span>
  );
}

/* ── info row ───────────────────────────────────────── */
function InfoRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "9px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <span style={{ color: "#9ca3af", flexShrink: 0, marginTop: 1 }}>
        {icon}
      </span>
      <span
        style={{ fontSize: 12, color: "#6b7280", minWidth: 100, flexShrink: 0 }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: highlight ? 700 : 500,
          color: highlight ? "#C9A96E" : "#111827",
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ── main component ─────────────────────────────────── */
export default function ValidateBooking() {
  const [open, setOpen] = useState(false);
  const [refInput, setRefInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [arrivalRoom, setArrivalRoom] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Reset when panel closes */
  const handleToggle = () => {
    setOpen((v) => !v);
    if (!open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const resetSearch = () => {
    setBooking(null);
    setRoomTypes([]);
    setSelectedRoomTypeId("");
    setError(null);
    setConfirmed(false);
    setArrivalRoom(null);
    setRefInput("");
  };

  /* Look up booking by ref */
  const handleSearch = async () => {
    const ref = refInput.trim().toUpperCase();
    if (!ref) return;
    setLoading(true);
    setError(null);
    setBooking(null);
    setRoomTypes([]);
    setSelectedRoomTypeId("");
    setConfirmed(false);
    setArrivalRoom(null);

    try {
      const result = await BookingsDB.getByRef(ref);
      if (!result) {
        setError(
          `No booking found for reference "${ref}". Check the reference and try again.`,
        );
      } else {
        setBooking(result);
        const [room, types] = await Promise.all([
          RoomsDB.byBooking(result.id),
          result.roomTypeId
            ? Promise.resolve([])
            : RoomTypesDB.byListing(result.listingId),
        ]);
        setRoomTypes(types);
        const matchingType = types.find(
          (type) =>
            type.name.toLocaleLowerCase() ===
            result.roomTypeName?.trim().toLocaleLowerCase(),
        );
        setSelectedRoomTypeId(result.roomTypeId ?? matchingType?.id ?? "");
        if (room?.status === "occupied") {
          setArrivalRoom(room.label);
          setConfirmed(true);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* Confirm guest arrival */
  const handleConfirmArrival = async () => {
    if (!booking) return;
    setConfirming(true);
    setError(null);
    try {
      let confirmedBooking = booking;
      if (!confirmedBooking.roomTypeId) {
        const roomType = roomTypes.find(
          (type) => type.id === selectedRoomTypeId,
        );
        if (!roomType) {
          throw new Error("Select the room type for this booking first.");
        }
        confirmedBooking = await BookingsDB.setRoomType(
          confirmedBooking.id,
          roomType,
        );
        setBooking(confirmedBooking);
      }
      const room = await RoomsDB.assignBooking(confirmedBooking);
      setArrivalRoom(room.label);
      setConfirmed(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not assign a room to this booking. Please try again.",
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        marginBottom: 20,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* ── Header / Toggle ── */}
      <button
        onClick={handleToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          borderBottom: open ? "1px solid #e5e7eb" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "rgba(201,169,110,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MagnifyingGlassIcon
              style={{ width: 16, height: 16, color: "#C9A96E" }}
            />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              Validate Guest Booking
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
              Look up a booking by reference number
            </div>
          </div>
        </div>
        {open ? (
          <ChevronUpIcon style={{ width: 18, height: 18, color: "#6b7280" }} />
        ) : (
          <ChevronDownIcon
            style={{ width: 18, height: 18, color: "#6b7280" }}
          />
        )}
      </button>

      {/* ── Body ── */}
      {open && (
        <div style={{ padding: "20px" }}>
          {/* Search row */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                ref={inputRef}
                value={refInput}
                onChange={(e) => setRefInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g. EDEN-4827"
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 38px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  color: "#111827",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "monospace",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid #C9A96E";
                  e.currentTarget.style.background = "#fff";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid #d1d5db";
                  e.currentTarget.style.background = "#f9fafb";
                }}
              />
              <MagnifyingGlassIcon
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 16,
                  height: 16,
                  color: "#9ca3af",
                  pointerEvents: "none",
                }}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !refInput.trim()}
              style={{
                padding: "10px 20px",
                background: loading || !refInput.trim() ? "#f3f4f6" : "#C9A96E",
                color: loading || !refInput.trim() ? "#9ca3af" : "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 13,
                cursor: loading || !refInput.trim() ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Searching…
                </>
              ) : (
                "Look Up"
              )}
            </button>
          </div>

          {/* Error state */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 10,
                marginBottom: 12,
              }}
            >
              <XCircleIcon
                style={{
                  width: 18,
                  height: 18,
                  color: "#ef4444",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              />
              <p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>
                {error}
              </p>
            </div>
          )}

          {/* Booking card */}
          {booking && (
            <div
              style={{
                background: "#fafafa",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "16px 18px",
                position: "relative",
              }}
            >
              {/* Card header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Booking Reference
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#C9A96E",
                      letterSpacing: "0.08em",
                      fontFamily: "monospace",
                    }}
                  >
                    {booking.ref}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusPill status={booking.status} />
                  <button
                    onClick={resetSearch}
                    style={{
                      background: "none",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 11,
                      color: "#6b7280",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{ height: 1, background: "#e5e7eb", marginBottom: 4 }}
              />

              {/* Details */}
              <InfoRow
                icon={<UserIcon style={{ width: 14, height: 14 }} />}
                label="Guest Name"
                value={booking.guestName}
              />
              <InfoRow
                icon={<EnvelopeIcon style={{ width: 14, height: 14 }} />}
                label="Email"
                value={booking.guestEmail}
              />
              <InfoRow
                icon={<PhoneIcon style={{ width: 14, height: 14 }} />}
                label="Phone"
                value={booking.guestPhone || "—"}
              />
              <InfoRow
                icon={<CalendarDaysIcon style={{ width: 14, height: 14 }} />}
                label="Check-in"
                value={fmtDate(booking.checkIn)}
                highlight
              />
              <InfoRow
                icon={<CalendarDaysIcon style={{ width: 14, height: 14 }} />}
                label="Check-out"
                value={fmtDate(booking.checkOut)}
                highlight
              />
              <InfoRow
                icon={<MoonIcon style={{ width: 14, height: 14 }} />}
                label="Nights"
                value={`${booking.nights} night${booking.nights !== 1 ? "s" : ""}`}
              />
              <InfoRow
                icon={<UsersIcon style={{ width: 14, height: 14 }} />}
                label="Guests"
                value={`${booking.guests} guest${booking.guests !== 1 ? "s" : ""}`}
              />
              <InfoRow
                icon={<BuildingOffice2Icon style={{ width: 14, height: 14 }} />}
                label="Room Type"
                value={
                  booking.roomTypeName ??
                  roomTypes.find((type) => type.id === selectedRoomTypeId)
                    ?.name ??
                  "Not specified"
                }
              />
              <InfoRow
                icon={<CurrencyDollarIcon style={{ width: 14, height: 14 }} />}
                label="Total Paid"
                value={fmt$(booking.totalAmount)}
                highlight
              />
              {booking.specialRequests && (
                <InfoRow
                  icon={<span style={{ fontSize: 12 }}>📝</span>}
                  label="Special Requests"
                  value={booking.specialRequests}
                />
              )}

              {!booking.roomTypeId && !confirmed && booking.status !== "cancelled" && (
                <label
                  style={{
                    display: "block",
                    marginTop: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#6b7280",
                  }}
                >
                  Choose the booked room type
                  <select
                    value={selectedRoomTypeId}
                    onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: 6,
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 8,
                      background: "#fff",
                      color: "#111827",
                    }}
                  >
                    <option value="">Select a room type</option>
                    {roomTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {/* Confirm arrival CTA */}
              <div style={{ marginTop: 16 }}>
                {booking.status === "cancelled" ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "11px 16px",
                      background: "#fee2e2",
                      border: "1px solid #fecaca",
                      borderRadius: 10,
                      color: "#991b1b",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    <XCircleIcon style={{ width: 18, height: 18 }} />
                    This booking has been cancelled
                  </div>
                ) : confirmed ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "11px 16px",
                      background: "#dcfce7",
                      border: "1px solid #bbf7d0",
                      borderRadius: 10,
                      color: "#166534",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    <CheckCircleIcon style={{ width: 18, height: 18 }} />
                    Guest checked in — {arrivalRoom}
                  </div>
                ) : (
                  <button
                    onClick={handleConfirmArrival}
                    disabled={
                      confirming ||
                      (!booking.roomTypeId && !selectedRoomTypeId)
                    }
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      background: confirming
                        ? "rgba(201,169,110,0.4)"
                        : "#C9A96E",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor:
                        confirming ||
                        (!booking.roomTypeId && !selectedRoomTypeId)
                          ? "not-allowed"
                          : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.15s",
                    }}
                  >
                    {confirming ? (
                      <>
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            border: "2px solid rgba(255,255,255,0.3)",
                            borderTopColor: "#fff",
                            borderRadius: "50%",
                            display: "inline-block",
                            animation: "spin 0.8s linear infinite",
                          }}
                        />
                        Confirming…
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon style={{ width: 16, height: 16 }} />
                        Confirm Arrival & Occupy Room
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
