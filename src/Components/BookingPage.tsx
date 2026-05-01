import { useState, useEffect, useRef } from "react";
import {
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
  UserIcon,
  ShieldCheckIcon,
  HeartIcon,
  ShareIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { StarIcon, HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { type Hotel } from "../index";

const REVIEWS = [
  {
    id: 1,
    name: "Isabelle Fontaine",
    avatar: "IF",
    location: "Paris, France",
    rating: 5,
    date: "March 2025",
    title: "Absolute perfection above the ocean",
    body: "Waking up to the Indian Ocean from your private deck never gets old. The butler remembered every preference from day one — cold brew at sunrise, champagne at sunset. The house reef snorkeling directly from the villa steps was otherworldly.",
    helpful: 47,
  },
  {
    id: 2,
    name: "James Okafor",
    avatar: "JO",
    location: "Lagos, Nigeria",
    rating: 5,
    date: "February 2025",
    title: "Honeymoon beyond imagination",
    body: "We celebrated our honeymoon here and the team went above and beyond to make every moment magical. Private sunset cruise, flower-petal bath, floating breakfast — all arranged without us asking. Worth every penny.",
    helpful: 38,
  },
  {
    id: 3,
    name: "Mei Lin",
    avatar: "ML",
    location: "Shanghai, China",
    rating: 4,
    date: "January 2025",
    title: "Stunning but transfer timing matters",
    body: "The villa itself is extraordinary — glass floors, private infinity pool, direct ocean access. One note: book the seaplane transfer as early as possible. The speedboat alternative takes much longer and is weather-dependent.",
    helpful: 29,
  },
  {
    id: 4,
    name: "Alejandro Reyes",
    avatar: "AR",
    location: "Mexico City, Mexico",
    rating: 5,
    date: "December 2024",
    title: "The finest resort stay of my life",
    body: "Having stayed at over 30 luxury resorts globally, this set a new benchmark. The Spa Island alone is worth the visit — a full day of treatments surrounded by nothing but open ocean. Exceptional in every dimension.",
    helpful: 61,
  },
];

const makeRoomTypes = (hotel: Hotel) => {
  const bedroomLabel =
    hotel.bedrooms > 1 ? `${hotel.bedrooms} bedrooms` : "1 bedroom";
  const baseFeatures = hotel.amenities.slice(0, 5);
  const standardPrice = hotel.pricePerNight;
  const premiumPrice = Math.round(standardPrice * 1.2);

  return [
    {
      id: "standard",
      name: `${hotel.category} Retreat`,
      size: `${Math.max(hotel.bedrooms * 28, 60)} m²`,
      guests: hotel.maxGuests,
      bed: bedroomLabel,
      price: standardPrice,
      features: baseFeatures,
      image: hotel.images[0] ?? hotel.thumbnail,
      badge: hotel.featured ? "Featured" : null,
    },
    {
      id: "premium",
      name: "Premium Stay",
      size: `${Math.max(hotel.bedrooms * 32, 70)} m²`,
      guests: hotel.maxGuests,
      bed: bedroomLabel,
      price: premiumPrice,
      features: baseFeatures,
      image: hotel.images[1] ?? hotel.images[0] ?? hotel.thumbnail,
      badge: hotel.featured ? "Best seller" : null,
    },
  ];
};

/* ─── Amenity icon map ─── */
const amenityIcons: Record<string, string> = {
  "Free WiFi": "📶",
  "Private Pool": "🏊",
  "Butler Service": "🛎",
  "Coral Reef Diving": "🤿",
  "Water Sports": "🚤",
  "Spa Island": "💆",
  "Sunset Cruise": "🌅",
  Aquarium: "🐠",
  "Airport Transfer": "✈️",
  "Fine Dining": "🍽",
  "Kids Club": "🧒",
  "Overwater Bungalow": "🌊",
};

/* ─────────────────────────────────────────────────────────────── */
/*  BookingPage                                                      */
/* ─────────────────────────────────────────────────────────────── */
type Props = { hotel: Hotel; onBack?: () => void };

const BookingPage = ({ hotel, onBack }: Props) => {
  /* ── state ── */
  const [activeImg, setActiveImg] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const roomTypes = makeRoomTypes(hotel);
  const [selectedRoom, setSelectedRoom] = useState(roomTypes[0].id);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [step, setStep] = useState<"idle" | "form" | "confirm" | "done">(
    "idle",
  );
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
    phone: "",
    requests: "",
  });
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "rooms" | "reviews">(
    "overview",
  );
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(
      0,
      Math.round(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000,
      ),
    );
  })();

  const room = roomTypes.find((r) => r.id === selectedRoom) ?? roomTypes[0];
  const subtotal = room.price * Math.max(nights, 1);
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + taxes;

  useEffect(() => {
    const el = heroRef.current?.parentElement;
    if (!el) return;
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const nextImg = () => setActiveImg((i) => (i + 1) % hotel.images.length);
  const prevImg = () =>
    setActiveImg((i) => (i - 1 + hotel.images.length) % hotel.images.length);

  /* ── Gallery overlay ── */
  const Gallery = () => (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-white/60 text-sm font-medium">
          {activeImg + 1} / {hotel.images.length}
        </span>
        <button
          onClick={() => setGalleryOpen(false)}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center relative px-4">
        <button
          onClick={prevImg}
          className="absolute left-4 md:left-8 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-105"
        >
          <ChevronLeftIcon className="w-5 h-5 text-white" />
        </button>
        <img
          src={hotel.images[activeImg]}
          alt=""
          className="max-h-[75vh] max-w-full object-contain rounded-xl"
          onError={(e) => {
            (e.target as HTMLImageElement).src = hotel.thumbnail;
          }}
        />
        <button
          onClick={nextImg}
          className="absolute right-4 md:right-8 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-105"
        >
          <ChevronRightIcon className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="flex gap-3 justify-center pb-6 overflow-x-auto px-4">
        {hotel.images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveImg(i)}
            className={`w-16 h-12 rounded-lg overflow-hidden shrink-0 transition-all ${i === activeImg ? "ring-2 ring-[#C9A96E] opacity-100" : "opacity-40 hover:opacity-70"}`}
          >
            <img
              src={img}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = hotel.thumbnail;
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );

  /* ── Booking Modal ── */
  const BookingModal = () => (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setStep("idle")}
      />
      <div className="relative z-10 bg-white w-full md:max-w-lg md:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {step === "form" && (
          <>
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-playfair text-xl font-semibold text-gray-900">
                  Guest Details
                </h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  {room.name} ·{" "}
                  {nights > 0 ? `${nights} nights` : "Select dates"}
                </p>
              </div>
              <button
                onClick={() => setStep("idle")}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary card */}
              <div className="bg-[#faf8f5] rounded-2xl p-4 flex gap-4 items-center">
                <img
                  src={room.image}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = hotel.thumbnail;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {hotel.name}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{room.name}</p>
                  <p className="text-[#C9A96E] font-bold text-sm mt-1">
                    ${total.toLocaleString()}{" "}
                    <span className="text-gray-400 font-normal text-xs">
                      total
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Check-in
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 outline-none focus:border-[#C9A96E] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Check-out
                  </label>
                  <input
                    type="date"
                    min={checkIn || today}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 outline-none focus:border-[#C9A96E] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={guestInfo.name}
                  onChange={(e) =>
                    setGuestInfo((g) => ({ ...g, name: e.target.value }))
                  }
                  placeholder="Your full name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C9A96E] transition-colors placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={guestInfo.email}
                  onChange={(e) =>
                    setGuestInfo((g) => ({ ...g, email: e.target.value }))
                  }
                  placeholder="your@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C9A96E] transition-colors placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={guestInfo.phone}
                  onChange={(e) =>
                    setGuestInfo((g) => ({ ...g, phone: e.target.value }))
                  }
                  placeholder="+1 234 567 8900"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C9A96E] transition-colors placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Special Requests
                </label>
                <textarea
                  value={guestInfo.requests}
                  onChange={(e) =>
                    setGuestInfo((g) => ({ ...g, requests: e.target.value }))
                  }
                  rows={3}
                  placeholder="Early check-in, dietary requirements, celebrations…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C9A96E] transition-colors placeholder:text-gray-300 resize-none"
                />
              </div>

              {/* Price breakdown */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>
                    ${room.price.toLocaleString()} × {Math.max(nights, 1)}{" "}
                    {nights === 1 ? "night" : "nights"}
                  </span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Taxes & resort fees (12%)</span>
                  <span>${taxes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (guestInfo.name && guestInfo.email) setStep("confirm");
                }}
                disabled={!guestInfo.name || !guestInfo.email}
                className="w-full bg-[#C9A96E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl text-sm hover:bg-[#b8935a] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#C9A96E]/30"
              >
                Continue to Payment
              </button>

              <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
                <ShieldCheckIcon className="w-4 h-4" />
                Free cancellation up to 48 hours before check-in
              </div>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-playfair text-xl font-semibold text-gray-900">
                Confirm & Pay
              </h2>
              <button
                onClick={() => setStep("form")}
                className="text-sm text-[#C9A96E] font-medium hover:underline"
              >
                ← Edit details
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Reservation summary */}
              <div className="bg-[#faf8f5] rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Reservation Summary
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    ["Property", hotel.name],
                    ["Room", room.name],
                    ["Guest", guestInfo.name],
                    ["Email", guestInfo.email],
                    ["Check-in", checkIn || "—"],
                    ["Check-out", checkOut || "—"],
                    ["Nights", nights || "—"],
                    ["Guests", guests],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex justify-between">
                      <span className="text-gray-400">{k}</span>
                      <span className="font-medium text-gray-800">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#e8e0d4] pt-3 flex justify-between text-base font-bold">
                  <span>Total Charge</span>
                  <span className="text-[#C9A96E]">
                    ${total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment placeholder */}
              <div className="border border-dashed border-gray-200 rounded-2xl p-5 text-center text-gray-400 text-sm space-y-2">
                <div className="text-2xl">💳</div>
                <p className="font-medium text-gray-500">Secure Payment</p>
                <p className="text-xs">
                  Connect your payment gateway (Stripe, PayStack, etc.) here
                </p>
              </div>

              <button
                onClick={() => setStep("done")}
                className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-2xl text-sm hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Confirm Reservation
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
              <CheckIcon className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="font-playfair text-2xl font-semibold text-gray-900 mb-2">
              Booking Confirmed!
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6">
              Your reservation at <strong>{hotel.name}</strong> has been
              confirmed. A detailed itinerary has been sent to{" "}
              <strong>{guestInfo.email}</strong>.
            </p>
            <div className="bg-[#faf8f5] rounded-2xl px-6 py-4 w-full mb-6 text-sm">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Booking Reference
              </p>
              <p className="text-2xl font-bold tracking-widest text-[#C9A96E] font-mono">
                ZB-{Math.random().toString(36).substring(2, 8).toUpperCase()}
              </p>
            </div>
            <button
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  setStep("idle");
                  setGuestInfo({
                    name: "",
                    email: "",
                    phone: "",
                    requests: "",
                  });
                }
              }}
              className="text-sm font-semibold text-[#C9A96E] hover:underline"
            >
              Back to property
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f7] font-sans text-gray-900">
      {/* ── Gallery ── */}
      {galleryOpen && <Gallery />}
      {step !== "idle" && <BookingModal />}

      {/* ── Sticky nav ── */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-transparent"}`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4 text-gray-700" />
            </button>
            <div
              className={`transition-all duration-300 ${scrolled ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <p className="font-semibold text-gray-900 text-sm font-playfair">
                {hotel.name}
              </p>
              <p className="text-gray-400 text-xs">
                ${room.price.toLocaleString()} / night
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWishlisted((w) => !w)}
              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-[#C9A96E] transition-all"
            >
              {wishlisted ? (
                <HeartSolid className="w-4 h-4 text-[#C9A96E]" />
              ) : (
                <HeartIcon className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <button className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-all">
              <ShareIcon className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setStep("form")}
              className="hidden md:flex items-center gap-2 bg-[#C9A96E] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#b8935a] transition-all hover:scale-105 shadow-md shadow-[#C9A96E]/30"
            >
              Reserve Now
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero image grid ── */}
      <div ref={heroRef} className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-6">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-3xl overflow-hidden h-[420px] md:h-[520px]">
          {/* Main large image */}
          <button
            onClick={() => setGalleryOpen(true)}
            className="col-span-2 row-span-2 relative overflow-hidden group"
          >
            <img
              src={hotel.images[0]}
              alt={hotel.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = hotel.thumbnail;
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
          {/* Side images */}
          {hotel.images.slice(1, 5).map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveImg(i + 1);
                setGalleryOpen(true);
              }}
              className="relative overflow-hidden group"
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = hotel.thumbnail;
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              {i === 3 && hotel.images.length > 5 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    +{hotel.images.length - 5} more
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          {/* ── LEFT ── */}
          <div>
            {/* Title block */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-[#C9A96E]/10 text-[#C9A96E] text-xs font-semibold px-3 py-1 rounded-full capitalize">
                  {hotel.category}
                </span>
                {hotel.featured && (
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Featured
                  </span>
                )}
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                  {hotel.region}
                </span>
              </div>

              <h1 className="font-playfair text-3xl md:text-4xl font-semibold text-gray-900 leading-tight mb-3">
                {hotel.name}
              </h1>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(hotel.rating) ? "text-[#C9A96E]" : "text-gray-200"}`}
                    />
                  ))}
                  <span className="text-sm font-bold text-gray-900 ml-1">
                    {hotel.rating}
                  </span>
                  <span className="text-sm text-gray-400">
                    ({hotel.reviewCount.toLocaleString()} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <MapPinIcon className="w-4 h-4 text-[#C9A96E]" />
                  {hotel.location}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {hotel.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
              <div className="flex gap-0">
                {(["overview", "rooms", "reviews"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${activeTab === tab ? "border-[#C9A96E] text-[#C9A96E]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" && (
              <div className="space-y-10">
                {/* Quick stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: "🛏", label: "Bedrooms", val: hotel.bedrooms },
                    { icon: "🚿", label: "Bathrooms", val: hotel.bathrooms },
                    { icon: "👥", label: "Max Guests", val: hotel.maxGuests },
                    {
                      icon: "🌃",
                      label: "Avg / Night",
                      val: `$${hotel.pricePerNight.toLocaleString()}`,
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm"
                    >
                      <div className="text-2xl mb-1.5">{s.icon}</div>
                      <div className="text-base font-bold text-gray-900">
                        {s.val}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <h2 className="font-playfair text-xl font-semibold text-gray-900 mb-4">
                    About this property
                  </h2>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                    {hotel.description}
                  </p>
                </div>

                {/* Amenities */}
                <div>
                  <h2 className="font-playfair text-xl font-semibold text-gray-900 mb-4">
                    Amenities
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(showAllAmenities
                      ? hotel.amenities
                      : hotel.amenities.slice(0, 6)
                    ).map((a) => (
                      <div
                        key={a}
                        className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-sm font-medium text-gray-700"
                      >
                        <span className="text-base">
                          {amenityIcons[a] || "✦"}
                        </span>
                        {a}
                      </div>
                    ))}
                  </div>
                  {hotel.amenities.length > 6 && (
                    <button
                      onClick={() => setShowAllAmenities((s) => !s)}
                      className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[#C9A96E] hover:underline"
                    >
                      {showAllAmenities
                        ? "Show less"
                        : `Show all ${hotel.amenities.length} amenities`}
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform ${showAllAmenities ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>

                {/* Policies */}
                <div>
                  <h2 className="font-playfair text-xl font-semibold text-gray-900 mb-4">
                    Policies
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        icon: "🕐",
                        title: "Check-in",
                        desc: "From 3:00 PM · Early check-in subject to availability",
                      },
                      {
                        icon: "🧳",
                        title: "Check-out",
                        desc: "Until 12:00 PM · Late check-out available on request",
                      },
                      {
                        icon: "❌",
                        title: "Cancellation",
                        desc: "Free cancellation up to 48 hours before arrival",
                      },
                      {
                        icon: "🐾",
                        title: "Pets",
                        desc: "Not permitted at this property",
                      },
                      {
                        icon: "🚭",
                        title: "Smoking",
                        desc: "Non-smoking property throughout",
                      },
                      {
                        icon: "💳",
                        title: "Payment",
                        desc: "All major cards, wire transfer, BNPL",
                      },
                    ].map((p) => (
                      <div
                        key={p.title}
                        className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                      >
                        <span className="text-xl mt-0.5">{p.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {p.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            {p.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── ROOMS TAB ── */}
            {activeTab === "rooms" && (
              <div className="space-y-5">
                <p className="text-gray-500 text-sm">
                  Select your preferred room type to see pricing.
                </p>
                {roomTypes.map((rt) => (
                  <button
                    key={rt.id}
                    onClick={() => setSelectedRoom(rt.id)}
                    className={`w-full text-left bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${selectedRoom === rt.id ? "border-[#C9A96E] shadow-[#C9A96E]/10" : "border-gray-100 hover:border-gray-200"}`}
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-52 h-44 md:h-auto shrink-0 overflow-hidden">
                        <img
                          src={rt.image}
                          alt={rt.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              hotel.thumbnail;
                          }}
                        />
                      </div>
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-playfair text-base font-semibold text-gray-900">
                                {rt.name}
                              </h3>
                              {rt.badge && (
                                <span className="text-[10px] font-bold text-[#C9A96E] bg-[#C9A96E]/10 px-2 py-0.5 rounded-full">
                                  {rt.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-xs">
                              {rt.size} · {rt.bed} · Up to {rt.guests} guests
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[#C9A96E] font-bold text-lg">
                              ${rt.price.toLocaleString()}
                            </p>
                            <p className="text-gray-400 text-xs">/ night</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {rt.features.map((f) => (
                            <span
                              key={f}
                              className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-full"
                            >
                              <CheckIcon className="w-3 h-3 text-[#C9A96E]" />
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex md:flex-col items-center justify-end p-4 md:pl-0 gap-2">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedRoom === rt.id ? "bg-[#C9A96E] border-[#C9A96E]" : "border-gray-300"}`}
                        >
                          {selectedRoom === rt.id && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ── REVIEWS TAB ── */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
                  <div className="text-center shrink-0">
                    <p className="text-5xl font-bold text-gray-900 font-playfair">
                      {hotel.rating}
                    </p>
                    <div className="flex gap-1 justify-center my-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(hotel.rating) ? "text-[#C9A96E]" : "text-gray-200"}`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-400 text-xs">
                      {hotel.reviewCount.toLocaleString()} reviews
                    </p>
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    {[
                      ["Cleanliness", 98],
                      ["Service", 97],
                      ["Location", 95],
                      ["Value", 90],
                      ["Amenities", 96],
                    ].map(([k, v]) => (
                      <div
                        key={String(k)}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="text-gray-500 w-24 shrink-0">{k}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-[#C9A96E]"
                            style={{ width: `${v}%` }}
                          />
                        </div>
                        <span className="text-gray-700 font-semibold text-xs w-8 text-right">
                          {Number(v) / 20}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {REVIEWS.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 flex items-center justify-center font-bold text-[#C9A96E] text-sm">
                          {r.avatar}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {r.name}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {r.location} · {r.date}
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-0.5">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <StarIcon
                              key={i}
                              className="w-3.5 h-3.5 text-[#C9A96E]"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="font-semibold text-gray-800 text-sm mb-1.5">
                        {r.title}
                      </p>
                      <p className="text-gray-500 text-xs leading-relaxed">
                        {r.body}
                      </p>
                      <p className="text-gray-300 text-xs mt-3">
                        {r.helpful} people found this helpful
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT — Booking widget ── */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
              {/* Room selector */}
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2418] p-6 text-white">
                <p className="text-[#C9A96E] text-xs font-semibold uppercase tracking-wider mb-3">
                  Selected Room
                </p>
                <h3 className="font-playfair text-xl font-semibold mb-1">
                  {room.name}
                </h3>
                <p className="text-white/50 text-xs mb-4">
                  {room.size} · {room.bed} · Up to {room.guests} guests
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    ${room.price.toLocaleString()}
                  </span>
                  <span className="text-white/50 text-sm">/ night</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Date pickers */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-gray-200 rounded-xl px-3 py-2.5 hover:border-[#C9A96E] transition-colors group">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Check-in
                    </p>
                    <input
                      type="date"
                      min={today}
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full text-sm font-medium text-gray-800 outline-none bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="border border-gray-200 rounded-xl px-3 py-2.5 hover:border-[#C9A96E] transition-colors">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Check-out{" "}
                      {nights > 0 && (
                        <span className="text-[#C9A96E]">· {nights}n</span>
                      )}
                    </p>
                    <input
                      type="date"
                      min={checkIn || today}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full text-sm font-medium text-gray-800 outline-none bg-transparent cursor-pointer"
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Guests
                    </p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">
                      {guests} {guests === 1 ? "guest" : "guests"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold transition-colors"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold w-4 text-center">
                      {guests}
                    </span>
                    <button
                      onClick={() =>
                        setGuests((g) => Math.min(room.guests, g + 1))
                      }
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Room selector mini */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Room Type
                  </p>
                  <div className="space-y-1.5">
                    {roomTypes.map((rt) => (
                      <button
                        key={rt.id}
                        onClick={() => setSelectedRoom(rt.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all ${selectedRoom === rt.id ? "bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-gray-900" : "bg-gray-50 border border-transparent text-gray-600 hover:bg-gray-100"}`}
                      >
                        <span className="font-medium truncate">{rt.name}</span>
                        <span
                          className={`font-bold shrink-0 ml-2 ${selectedRoom === rt.id ? "text-[#C9A96E]" : "text-gray-500"}`}
                        >
                          ${rt.price.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price breakdown */}
                {nights > 0 && (
                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>
                        ${room.price.toLocaleString()} × {nights} nights
                      </span>
                      <span>${subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Taxes & fees</span>
                      <span>${taxes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                      <span>Total</span>
                      <span>${total.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setStep("form")}
                  className="w-full bg-[#C9A96E] text-white font-semibold py-4 rounded-2xl text-sm hover:bg-[#b8935a] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#C9A96E]/30"
                >
                  Reserve ·{" "}
                  {nights > 0
                    ? `$${total.toLocaleString()}`
                    : `From $${room.price.toLocaleString()}`}
                </button>

                <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
                  <ShieldCheckIcon className="w-4 h-4" />
                  Free cancellation · No charge until confirmed
                </div>

                {/* Contact concierge */}
                <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      Speak to a Concierge
                    </p>
                    <p className="text-xs text-gray-400">
                      Available 24/7 · Avg reply 4 min
                    </p>
                  </div>
                  <button className="ml-auto text-xs font-semibold text-[#C9A96E] hover:underline shrink-0">
                    Chat →
                  </button>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["🔒", "Secure", "256-bit SSL"],
                ["✓", "Verified", "Official listing"],
                ["🏅", "Best Price", "Guaranteed"],
              ].map(([icon, title, sub]) => (
                <div
                  key={String(title)}
                  className="bg-white rounded-2xl border border-gray-100 py-3 shadow-sm"
                >
                  <div className="text-lg">{icon}</div>
                  <p className="text-xs font-semibold text-gray-800 mt-1">
                    {title}
                  </p>
                  <p className="text-[10px] text-gray-400">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile CTA bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between z-30">
        <div>
          <p className="font-bold text-gray-900 text-base">
            ${room.price.toLocaleString()}{" "}
            <span className="font-normal text-gray-400 text-sm">/ night</span>
          </p>
          <div className="flex items-center gap-1">
            <StarIcon className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span className="text-xs font-semibold text-gray-700">
              {hotel.rating}
            </span>
            <span className="text-xs text-gray-400">
              ({hotel.reviewCount.toLocaleString()})
            </span>
          </div>
        </div>
        <button
          onClick={() => setStep("form")}
          className="bg-[#C9A96E] text-white font-semibold px-7 py-3 rounded-2xl text-sm hover:bg-[#b8935a] transition-all shadow-lg shadow-[#C9A96E]/30"
        >
          Reserve
        </button>
      </div>
    </div>
  );
};

export default BookingPage;
