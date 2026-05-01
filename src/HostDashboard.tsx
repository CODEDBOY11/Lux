/**
 * pages/HostDashboard.tsx
 *
 * Full host dashboard: listings CRUD, reservations, revenue stats, profile.
 * All data is live from ListingsDB / BookingsDB — nothing hardcoded.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "./AuthContext";
import { ListingsDB, BookingsDB, type Listing, type Booking } from "./index";
import ListingModal from "./ListingModal";

type Tab = "overview" | "listings" | "bookings" | "profile";

export default function HostDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editListing, setEditListing] = useState<Listing | null>(null);

  const refresh = () => {
    if (!user) return;
    setListings(ListingsDB.byHost(user.id));
    setBookings(BookingsDB.byHost(user.id));
  };

  useEffect(() => {
    refresh();
  }, [user]);

  if (!user) return null;

  const revenue = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((a, b) => a + b.totalAmount, 0);

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    ListingsDB.delete(id);
    refresh();
  };

  const openAdd = () => {
    setEditListing(null);
    setModalOpen(true);
  };
  const openEdit = (l: Listing) => {
    setEditListing(l);
    setModalOpen(true);
  };

  const NAV = [
    {
      key: "overview",
      label: "Overview",
      icon: <ChartBarIcon className="w-4 h-4" />,
    },
    {
      key: "listings",
      label: "My Listings",
      icon: <BuildingOffice2Icon className="w-4 h-4" />,
    },
    {
      key: "bookings",
      label: "Reservations",
      icon: <CalendarDaysIcon className="w-4 h-4" />,
    },
    {
      key: "profile",
      label: "Profile",
      icon: <UserIcon className="w-4 h-4" />,
    },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0e0d0b] font-sans text-[#f5f0e8] flex flex-col">
      {/* Modal */}
      {modalOpen && (
        <ListingModal
          listing={editListing}
          hostId={user.id}
          hostName={`${user.firstName} ${user.lastName}`}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            refresh();
          }}
        />
      )}

      {/* Topnav */}
      <nav className="sticky top-0 z-40 h-16 bg-[rgba(14,13,11,0.95)] backdrop-blur-md border-b border-[rgba(245,240,232,0.08)] flex items-center justify-between px-6 md:px-10">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => navigate("/explore")}
        >
          <div className="w-[18px] h-[18px] bg-[#C9A96E] rotate-45 rounded-sm" />
          <span className="font-['Cormorant Garamond'] text-xl font-medium tracking-wide">
            Zola Bekker
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[rgba(245,240,232,0.4)] hidden md:block">
            Host Dashboard
          </span>
          <div className="w-8 h-8 rounded-full bg-[rgba(201,169,110,0.12)] border border-[rgba(201,169,110,0.3)] flex items-center justify-center text-[#C9A96E] font-semibold text-sm">
            {user.avatar}
          </div>
        </div>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 bg-[#161410] border-r border-[rgba(245,240,232,0.06)] flex-col py-6 px-4 gap-1 flex-shrink-0">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[rgba(245,240,232,0.25)] px-3 mb-2">
            Main
          </p>
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${tab === n.key ? "bg-[rgba(201,169,110,0.12)] border border-[rgba(201,169,110,0.2)] text-[#C9A96E]" : "text-[rgba(245,240,232,0.5)] hover:text-[#f5f0e8] hover:bg-[rgba(245,240,232,0.04)]"}`}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[rgba(245,240,232,0.4)] hover:text-[#e07070] transition-colors mt-4"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" /> Sign Out
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {tab === "overview" && (
            <div>
              <h2 className="font-['Cormorant Garamond'] text-3xl font-medium mb-1">
                Good day, {user.firstName} ✦
              </h2>
              <p className="text-[rgba(245,240,232,0.45)] text-sm mb-8">
                Here's your property portfolio at a glance.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { label: "Listings", value: listings.length, icon: "🏛" },
                  { label: "Reservations", value: bookings.length, icon: "📅" },
                  {
                    label: "Total Revenue",
                    value: `$${revenue.toLocaleString()}`,
                    icon: "💰",
                  },
                  {
                    label: "Confirmed",
                    value: bookings.filter((b) => b.status === "confirmed")
                      .length,
                    icon: "✅",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-[#1e1c18] border border-[rgba(245,240,232,0.08)] rounded-2xl p-5 text-center"
                  >
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <div className="font-['Cormorant Garamond'] text-2xl font-medium text-[#C9A96E]">
                      {s.value}
                    </div>
                    <div className="text-xs text-[rgba(245,240,232,0.4)] mt-1">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent listings */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-['Cormorant Garamond'] text-xl font-medium">
                  Your Properties
                </h3>
                <button
                  onClick={openAdd}
                  className="flex items-center gap-1.5 bg-[#C9A96E] text-[#0e0d0b] text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#dfc08a] transition-all"
                >
                  <PlusIcon className="w-4 h-4" /> Add Listing
                </button>
              </div>
              {listings.length === 0 ? (
                <EmptyState
                  icon="🏛"
                  message="No listings yet. Add your first property to get started."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {listings.map((l) => (
                    <HostListingCard
                      key={l.id}
                      listing={l}
                      bookings={bookings}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "listings" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-['Cormorant Garamond'] text-3xl font-medium">
                  My Listings
                </h2>
                <button
                  onClick={openAdd}
                  className="flex items-center gap-1.5 bg-[#C9A96E] text-[#0e0d0b] text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#dfc08a] transition-all"
                >
                  <PlusIcon className="w-4 h-4" /> New Listing
                </button>
              </div>
              <p className="text-[rgba(245,240,232,0.45)] text-sm mb-8">
                Manage your properties, pricing, and availability.
              </p>
              {listings.length === 0 ? (
                <EmptyState
                  icon="🏛"
                  message="No listings yet. Add your first property."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {listings.map((l) => (
                    <HostListingCard
                      key={l.id}
                      listing={l}
                      bookings={bookings}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "bookings" && (
            <div>
              <h2 className="font-['Cormorant Garamond'] text-3xl font-medium mb-2">
                Reservations
              </h2>
              <p className="text-[rgba(245,240,232,0.45)] text-sm mb-8">
                All bookings across your properties.
              </p>
              {bookings.length === 0 ? (
                <EmptyState icon="📅" message="No reservations yet." />
              ) : (
                <div className="bg-[#1e1c18] border border-[rgba(245,240,232,0.08)] rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(245,240,232,0.06)]">
                        {[
                          "Guest",
                          "Property",
                          "Dates",
                          "Guests",
                          "Amount",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-5 py-4 text-[11px] uppercase tracking-[0.1em] text-[rgba(245,240,232,0.4)] font-medium"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr
                          key={b.id}
                          className="border-b border-[rgba(245,240,232,0.04)] hover:bg-[rgba(245,240,232,0.02)]"
                        >
                          <td className="px-5 py-4 text-sm">{b.guestName}</td>
                          <td className="px-5 py-4 text-sm text-[#C9A96E]">
                            {b.listingName}
                          </td>
                          <td className="px-5 py-4 text-sm text-[rgba(245,240,232,0.55)]">
                            {b.checkIn} → {b.checkOut}
                          </td>
                          <td className="px-5 py-4 text-sm text-[rgba(245,240,232,0.55)]">
                            {b.guests}
                          </td>
                          <td className="px-5 py-4 text-sm font-medium">
                            ${b.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={b.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "profile" && (
            <div>
              <h2 className="font-['Cormorant Garamond'] text-3xl font-medium mb-2">
                Profile Settings
              </h2>
              <p className="text-[rgba(245,240,232,0.45)] text-sm mb-8">
                Manage your host account details.
              </p>
              <div className="max-w-lg bg-[#1e1c18] border border-[rgba(245,240,232,0.08)] rounded-2xl p-7">
                <div className="flex items-center gap-4 mb-7">
                  <div className="w-14 h-14 rounded-full bg-[rgba(201,169,110,0.12)] border-2 border-[rgba(201,169,110,0.3)] flex items-center justify-center font-semibold text-xl text-[#C9A96E]">
                    {user.avatar}
                  </div>
                  <div>
                    <p className="font-['Cormorant Garamond'] text-xl font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-[rgba(245,240,232,0.45)]">
                      {user.email}
                    </p>
                  </div>
                </div>
                {[
                  ["Company", user.company || "—"],
                  ["Country", user.country || "—"],
                  ["Phone", user.phone || "—"],
                  ["Account Type", "Host"],
                  [
                    "Member Since",
                    new Date(user.createdAt).toLocaleDateString("en-GB", {
                      month: "long",
                      year: "numeric",
                    }),
                  ],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between py-3 border-b border-[rgba(245,240,232,0.06)] text-sm"
                  >
                    <span className="text-[rgba(245,240,232,0.45)]">{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="w-full mt-6 py-3 rounded-xl border border-[rgba(224,112,112,0.25)] text-[#e07070] text-sm font-medium hover:bg-[rgba(224,112,112,0.08)] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function HostListingCard({
  listing,
  bookings,
  onEdit,
  onDelete,
}: {
  listing: Listing;
  bookings: Booking[];
  onEdit: (l: Listing) => void;
  onDelete: (id: string) => void;
}) {
  const bcount = bookings.filter((b) => b.listingId === listing.id).length;
  return (
    <div className="bg-[#1e1c18] border border-[rgba(245,240,232,0.06)] rounded-2xl overflow-hidden hover:border-[rgba(201,169,110,0.2)] transition-all">
      <div className="relative h-44 overflow-hidden">
        <img
          src={
            listing.images[0] ||
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"
          }
          alt={listing.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400";
          }}
        />
        <span className="absolute top-3 left-3 bg-[rgba(14,13,11,0.75)] backdrop-blur-sm border border-[rgba(245,240,232,0.1)] rounded-full px-2.5 py-1 text-[11px] text-[#C9A96E] capitalize">
          {listing.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-['Cormorant Garamond'] text-base font-semibold mb-1 truncate">
          {listing.name}
        </h3>
        <p className="text-xs text-[rgba(245,240,232,0.4)] mb-3">
          {listing.location}
        </p>
        <p className="text-xs text-[rgba(245,240,232,0.35)] mb-4">
          {bcount} booking{bcount !== 1 ? "s" : ""} · {listing.bedrooms} bd ·{" "}
          {listing.maxGuests} guests max
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[#C9A96E] font-semibold">
            ${listing.pricePerNight.toLocaleString()}
            <span className="text-[rgba(245,240,232,0.35)] font-normal text-xs">
              /night
            </span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(listing)}
              className="w-8 h-8 rounded-lg border border-[rgba(245,240,232,0.1)] flex items-center justify-center text-[rgba(245,240,232,0.5)] hover:text-[#f5f0e8] hover:border-[rgba(245,240,232,0.2)] transition-all"
            >
              <PencilIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(listing.id)}
              className="w-8 h-8 rounded-lg border border-[rgba(224,112,112,0.15)] flex items-center justify-center text-[rgba(224,112,112,0.5)] hover:text-[#e07070] hover:border-[rgba(224,112,112,0.3)] transition-all"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed:
      "bg-[rgba(126,200,160,0.1)] text-[#7ec8a0] border-[rgba(126,200,160,0.25)]",
    pending:
      "bg-[rgba(201,169,110,0.1)] text-[#C9A96E] border-[rgba(201,169,110,0.25)]",
    cancelled:
      "bg-[rgba(224,112,112,0.1)] text-[#e07070] border-[rgba(224,112,112,0.25)]",
  };
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-medium capitalize ${styles[status] || ""}`}
    >
      {status}
    </span>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="text-center py-20 text-[rgba(245,240,232,0.4)]">
      <div className="text-4xl mb-4">{icon}</div>
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  );
}