/**
 * pages/GuestDashboard.tsx
 *
 * Guest dashboard: booking history, wishlist, profile.
 * All data live from BookingsDB and user.wishlist.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDaysIcon,
  HeartIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "./AuthContext";
import { BookingsDB, ListingsDB, type Booking, type Listing } from "./index";

type Tab = "bookings" | "wishlist" | "profile";

export default function GuestDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("bookings");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Listing[]>([]);

  useEffect(() => {
    if (!user) return;

    BookingsDB.byGuest(user.id).then(setBookings);

    const wishlist = user.wishlist ?? [];
    if (wishlist.length === 0) {
      setWishlistItems([]);
    } else {
      Promise.all(wishlist.map((id) => ListingsDB.getById(id))).then((items) =>
        setWishlistItems(
          items.filter((item): item is Listing => Boolean(item)),
        ),
      );
    }
  }, [user]);

  if (!user) return null;

  const NAV = [
    {
      key: "bookings",
      label: "My Bookings",
      icon: <CalendarDaysIcon className="w-4 h-4" />,
    },
    {
      key: "wishlist",
      label: "Wishlist",
      icon: <HeartIcon className="w-4 h-4" />,
    },
    {
      key: "profile",
      label: "Profile",
      icon: <UserIcon className="w-4 h-4" />,
    },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0e0d0b] font-sans text-[#f5f0e8] flex flex-col">
      {/* Nav */}
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
          <button
            onClick={() => navigate("/explore")}
            className="text-sm text-[rgba(245,240,232,0.55)] hover:text-[#f5f0e8] transition-colors hidden md:block"
          >
            Explore Stays
          </button>
          <div className="w-8 h-8 rounded-full bg-[rgba(201,169,110,0.12)] border border-[rgba(201,169,110,0.3)] flex items-center justify-center text-[#C9A96E] font-semibold text-sm">
            {user.avatar}
          </div>
        </div>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 bg-[#161410] border-r border-[rgba(245,240,232,0.06)] flex-col py-6 px-4 gap-1 flex-shrink-0">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[rgba(245,240,232,0.25)] px-3 mb-2">
            My Account
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
          <button
            onClick={() => navigate("/explore")}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[rgba(245,240,232,0.4)] hover:text-[#f5f0e8] transition-colors mt-2"
          >
            <MagnifyingGlassIcon className="w-4 h-4" /> Explore Stays
          </button>
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
          {tab === "bookings" && (
            <div>
              <h2 className="font-['Cormorant Garamond'] text-3xl font-medium mb-2">
                My Bookings
              </h2>
              <p className="text-[rgba(245,240,232,0.45)] text-sm mb-8">
                Your confirmed reservations and travel history.
              </p>
              {bookings.length === 0 ? (
                <div className="text-center py-20 text-[rgba(245,240,232,0.4)]">
                  <div className="text-4xl mb-4">🌍</div>
                  <p className="text-sm mb-5">No bookings yet.</p>
                  <button
                    onClick={() => navigate("/explore")}
                    className="bg-[#C9A96E] text-[#0e0d0b] text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-[#dfc08a] transition-all"
                  >
                    Explore Stays →
                  </button>
                </div>
              ) : (
                <div className="bg-[#1e1c18] border border-[rgba(245,240,232,0.08)] rounded-2xl overflow-x-auto">
                  <table className="w-full min-w-[600px]">
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
                          <td className="px-5 py-4 font-mono text-[11px] text-[#C9A96E]">
                            {b.ref}
                          </td>
                          <td className="px-5 py-4 text-sm">{b.listingName}</td>
                          <td className="px-5 py-4 text-sm text-[rgba(245,240,232,0.55)]">
                            {b.checkIn}
                          </td>
                          <td className="px-5 py-4 text-sm text-[rgba(245,240,232,0.55)]">
                            {b.checkOut}
                          </td>
                          <td className="px-5 py-4 text-sm text-[rgba(245,240,232,0.55)]">
                            {b.nights}
                          </td>
                          <td className="px-5 py-4 text-sm font-medium">
                            ${b.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-medium capitalize ${b.status === "confirmed" ? "bg-[rgba(126,200,160,0.1)] text-[#7ec8a0] border-[rgba(126,200,160,0.25)]" : b.status === "pending" ? "bg-[rgba(201,169,110,0.1)] text-[#C9A96E] border-[rgba(201,169,110,0.25)]" : "bg-[rgba(224,112,112,0.1)] text-[#e07070] border-[rgba(224,112,112,0.25)]"}`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "wishlist" && (
            <div>
              <h2 className="font-['Cormorant Garamond'] text-3xl font-medium mb-2">
                Wishlist
              </h2>
              <p className="text-[rgba(245,240,232,0.45)] text-sm mb-8">
                Properties you've saved for later.
              </p>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-20 text-[rgba(245,240,232,0.4)]">
                  <div className="text-4xl mb-4">❤️</div>
                  <p className="text-sm mb-5">
                    Your wishlist is empty. Heart a property while exploring.
                  </p>
                  <button
                    onClick={() => navigate("/explore")}
                    className="bg-[#C9A96E] text-[#0e0d0b] text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-[#dfc08a] transition-all"
                  >
                    Explore Stays →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {wishlistItems.map((l) => (
                    <div
                      key={l.id}
                      onClick={() => navigate(`/listing/${l.id}`)}
                      className="bg-[#1e1c18] border border-[rgba(245,240,232,0.06)] rounded-2xl overflow-hidden cursor-pointer hover:border-[rgba(201,169,110,0.2)] hover:-translate-y-1 transition-all"
                    >
                      <div className="h-44 overflow-hidden relative">
                        <img
                          src={
                            l.images[0] ||
                            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"
                          }
                          alt={l.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400";
                          }}
                        />
                        <span className="absolute top-3 left-3 bg-[rgba(14,13,11,0.75)] backdrop-blur-sm border border-[rgba(245,240,232,0.1)] rounded-full px-2.5 py-1 text-[11px] text-[#C9A96E] capitalize">
                          {l.category}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-['Cormorant Garamond'] text-base font-semibold mb-1 truncate">
                          {l.name}
                        </h3>
                        <p className="text-xs text-[rgba(245,240,232,0.4)] mb-2">
                          {l.location}
                        </p>
                        <p className="text-sm font-semibold text-[#C9A96E]">
                          ${l.pricePerNight.toLocaleString()}
                          <span className="text-[rgba(245,240,232,0.35)] font-normal text-xs">
                            {" "}
                            /night
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "profile" && (
            <div>
              <h2 className="font-['Cormorant Garamond'] text-3xl font-medium mb-2">
                My Profile
              </h2>
              <p className="text-[rgba(245,240,232,0.45)] text-sm mb-8">
                Your guest account details.
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
                  ["Total Bookings", bookings.length],
                  ["Wishlist Items", wishlistItems.length],
                  ["Country", user.country || "—"],
                  ["Phone", user.phone || "—"],
                  ["Account Type", "Guest"],
                  [
                    "Member Since",
                    new Date(user.createdAt).toLocaleDateString("en-GB", {
                      month: "long",
                      year: "numeric",
                    }),
                  ],
                ].map(([k, v]) => (
                  <div
                    key={String(k)}
                    className="flex justify-between py-3 border-b border-[rgba(245,240,232,0.06)] text-sm"
                  >
                    <span className="text-[rgba(245,240,232,0.45)]">{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => navigate("/explore")}
                    className="flex-1 py-3 rounded-xl bg-[#C9A96E] text-[#0e0d0b] text-sm font-medium hover:bg-[#dfc08a] transition-all"
                  >
                    Explore Stays →
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="px-5 py-3 rounded-xl border border-[rgba(224,112,112,0.25)] text-[#e07070] text-sm font-medium hover:bg-[rgba(224,112,112,0.08)] transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
