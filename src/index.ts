/**
 * db/index.ts  ─  Supabase backend
 * ─────────────────────────────────────────────────────────────
 * DROP-IN replacement for the old localStorage version.
 * All method signatures are identical — only the implementation changed.
 *
 * SETUP:
 *   1. npm install @supabase/supabase-js
 *   2. Add to .env.local:
 *        VITE_SUPABASE_URL=https://bwfftarbhvbhywucgftx.supabase.co
 *        VITE_SUPABASE_ANON_KEY=sb_publishable_K7uv10xSBpxGRDF86xvOhg_AiCsVO-U
 *   3. Run schema.sql in Supabase SQL Editor (already done)
 *   4. Replace your old index.ts with this file
 * ─────────────────────────────────────────────────────────────
 */

import { createClient } from "@supabase/supabase-js";

/* ─────────────── Client ─────────────── */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local",
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true, // ← persist session in localStorage across refreshes
    autoRefreshToken: false, // ← automatically refresh tokens on page load
    detectSessionInUrl: true, // ← keep this for OAuth callback
    flowType: "pkce", // ← use PKCE flow for better security
  },
});

/* ─────────────── TYPES  (identical to old version) ─────────────── */

export type UserRole = "host" | "guest" | "admin";
export type OAuthProvider = "google" | "apple";

export interface User {
  id: string;
  role: UserRole;
  email: string;
  firebaseUid?: string;
  firstName: string;
  lastName: string;
  company: string;
  country: string;
  phone: string;
  avatar: string;
  wishlist: string[];
  bookings: string[];
  emailVerified: boolean;
  marketingOptIn: boolean;
  oauthProvider?: OAuthProvider;
  oauthId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Listing {
  id: string;
  hostId: string;
  hostName: string;
  name: string;
  description: string;
  location: string;
  city: string;
  country: string;
  category: "villa" | "apartment" | "resort" | "boutique" | "penthouse";
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  tags: string[];
  images: string[];
  rating: number;
  reviewCount: number;
  featured: boolean;
  available: boolean;
  createdAt: string;
  verificationStatus?: VerificationStatus;
  verificationNote?: string;
}

export type Hotel = Listing & {
  region?: string;
  thumbnail: string;
  shortDescription: string;
  currency?: string;
};

export interface SearchParams {
  query?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

export interface Booking {
  id: string;
  ref: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  listingId: string;
  listingName: string;
  hostId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalAmount: number;
  status: "confirmed" | "pending" | "cancelled";
  specialRequests: string;
  createdAt: string;
  guestPhone: string;
}

/* ─────────────── Row mappers  snake_case → camelCase ─────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUser(r: any): User {
  return {
    id: r.id,
    role: r.role,
    email: r.email,
    firebaseUid: r.firebase_uid ?? undefined,
    firstName: r.first_name ?? "",
    lastName: r.last_name ?? "",
    company: r.company ?? "",
    country: r.country ?? "",
    phone: r.phone ?? "",
    avatar: r.avatar ?? "",
    wishlist: r.wishlist ?? [],
    bookings: r.bookings ?? [],
    emailVerified: r.email_verified ?? false,
    marketingOptIn: r.marketing_opt_in ?? false,
    oauthProvider: r.oauth_provider ?? undefined,
    oauthId: r.oauth_id ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toListing(r: any): Listing {
  return {
    id: r.id,
    hostId: r.host_id,
    hostName: r.host_name,
    name: r.name,
    description: r.description ?? "",
    location: r.location ?? "",
    city: r.city ?? "",
    country: r.country ?? "",
    category: r.category,
    pricePerNight: Number(r.price_per_night),
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    maxGuests: r.max_guests,
    amenities: r.amenities ?? [],
    tags: r.tags ?? [],
    images: r.images ?? [],
    rating: Number(r.rating),
    reviewCount: r.review_count,
    featured: r.featured,
    available: r.available,
    createdAt: r.created_at,
    verificationStatus: r.verification_status ?? "unverified",
    verificationNote: r.verification_note ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBooking(r: any): Booking {
  return {
    id: r.id,
    ref: r.ref,
    guestId: r.guest_id,
    guestName: r.guest_name,
    guestEmail: r.guest_email,
    listingId: r.listing_id,
    listingName: r.listing_name,
    hostId: r.host_id,
    checkIn: r.check_in,
    checkOut: r.check_out,
    guests: r.guests,
    nights: r.nights,
    totalAmount: Number(r.total_amount),
    status: r.status,
    specialRequests: r.special_requests ?? "",
    createdAt: r.created_at,
    guestPhone: r.guest_phone ?? "",
  };
}

/* ─────────────── SESSION  (browser cache — Supabase is source of truth) ─── */

const SESSION_KEY = "zb_session";

export const Session = {
  set(user: User, rememberMe = false): void {
    const payload = JSON.stringify({ user, rememberMe, setAt: Date.now() });
    if (rememberMe) {
      localStorage.setItem(SESSION_KEY, payload);
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, payload);
      localStorage.removeItem(SESSION_KEY);
    }
  },

  get(): User | null {
    try {
      const raw =
        sessionStorage.getItem(SESSION_KEY) ??
        localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw) as {
        user: User;
        rememberMe: boolean;
        setAt: number;
      };
      if (p.rememberMe && Date.now() - p.setAt > 30 * 24 * 60 * 60 * 1000) {
        this.clear();
        return null;
      }
      return p.user;
    } catch {
      return null;
    }
  },

  clear(): void {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  },

  isLoggedIn(): boolean {
    return this.get() !== null;
  },
  isRemembered(): boolean {
    try {
      const raw =
        sessionStorage.getItem(SESSION_KEY) ??
        localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw).rememberMe ?? false) : false;
    } catch {
      return false;
    }
  },
};

/* ─────────────── AuthDB ─────────────── */

export const AuthDB = {
  async register(data: {
    role: UserRole;
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    firebaseUid?: string;
    company?: string;
    country?: string;
    phone?: string;
    marketingOptIn?: boolean;
  }): Promise<{ ok: boolean; msg?: string; user?: User }> {
    const email = data.email.toLowerCase().trim();

    const { data: row, error } = await supabase
      .from("users")
      .insert({
        firebase_uid: data.firebaseUid ?? null,
        email,
        role: data.role,
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        company: data.company?.trim() ?? "",
        country: data.country?.trim() ?? "",
        phone: data.phone?.trim() ?? "",
        avatar: (data.firstName[0] + (data.lastName?.[0] ?? "")).toUpperCase(),
        email_verified: false,
        marketing_opt_in: data.marketingOptIn ?? false,
        wishlist: [],
        bookings: [],
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505")
        return { ok: false, msg: "An account with this email already exists." };
      return { ok: false, msg: error.message };
    }
    return { ok: true, user: toUser(row) };
  },

  async loginWithOAuth(data: {
    provider: OAuthProvider;
    oauthId: string;
    email: string;
    firstName: string;
    lastName: string;
    firebaseUid: string;
    role?: UserRole;
    avatar?: string;
  }): Promise<{ ok: boolean; msg?: string; user?: User; isNew: boolean }> {
    const email = data.email.toLowerCase().trim();

    let { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("firebase_uid", data.oauthId)
      .maybeSingle();

    if (!existing) {
      const { data: byEmail } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      existing = byEmail;
    }

    if (existing) {
      const { data: updated, error } = await supabase
        .from("users")
        .update({
          firebase_uid: data.oauthId,
          oauth_provider: data.provider,
          oauth_id: data.oauthId,
          email_verified: true,
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) return { ok: false, msg: error.message, isNew: false };
      return { ok: true, user: toUser(updated), isNew: false };
    }

    if (!data.role)
      return {
        ok: false,
        msg: "Please select Host or Guest before signing in.",
        isNew: true,
      };

    const { data: created, error } = await supabase
      .from("users")
      .insert({
        firebase_uid: data.oauthId,
        email,
        role: data.role,
        first_name: data.firstName,
        last_name: data.lastName,
        company: "",
        country: "",
        phone: "",
        avatar:
          data.avatar ??
          (data.firstName[0] + (data.lastName?.[0] ?? "")).toUpperCase(),
        oauth_provider: data.provider,
        oauth_id: data.oauthId,
        email_verified: true,
        marketing_opt_in: false,
        wishlist: [],
        bookings: [],
      })
      .select()
      .single();

    if (error) return { ok: false, msg: error.message, isNew: true };
    return { ok: true, user: toUser(created), isNew: true };
  },

  async getByFirebaseUid(uid: string): Promise<User | null> {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("firebase_uid", uid)
      .maybeSingle();
    return data ? toUser(data) : null;
  },

  async getByEmail(email: string): Promise<User | null> {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();
    return data ? toUser(data) : null;
  },

  async getById(id: string): Promise<User | null> {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? toUser(data) : null;
  },

  /** Create a user from OAuth auth metadata (if they don't exist in DB) */
  async createFromOAuth(
    authUserId: string,
    email: string,
    role: UserRole = "guest",
  ): Promise<User | null> {
    try {
      // Check if profile already exists (might have been created by trigger)
      const existing = await this.getById(authUserId);
      if (existing) {
        console.log(
          "✅ OAuth user already exists in database:",
          existing.email,
        );
        return existing;
      }

      // Extract name from email if needed
      const nameParts = email.split("@")[0].split(".");
      const firstName =
        nameParts[0]?.charAt(0).toUpperCase() + nameParts[0]?.slice(1) ||
        "User";
      const lastName =
        nameParts[1]?.charAt(0).toUpperCase() + nameParts[1]?.slice(1) || "";

      const { data: created, error } = await supabase
        .from("users")
        .insert({
          id: authUserId,
          email: email.toLowerCase().trim(),
          role,
          first_name: firstName,
          last_name: lastName,
          company: "",
          country: "",
          phone: "",
          avatar: (firstName[0] + (lastName?.[0] ?? "")).toUpperCase(),
          email_verified: true,
          marketing_opt_in: false,
          wishlist: [],
          bookings: [],
        })
        .select()
        .single();

      if (error) {
        // If the error is a conflict (row already exists), try to fetch it
        if (error.code === "23505") {
          console.log("ℹ️ User row exists, fetching from database...", email);
          const fetched = await this.getById(authUserId);
          if (fetched) return fetched;
        }
        console.error("❌ Failed to create OAuth user:", error.message);
        return null;
      }

      console.log("✅ OAuth user created in database:", toUser(created).email);
      return toUser(created);
    } catch (err) {
      console.error("❌ createFromOAuth error:", err);
      return null;
    }
  },

  async update(
    id: string,
    data: Partial<Omit<User, "id" | "createdAt">>,
  ): Promise<User | null> {
    const p: Record<string, unknown> = {};
    if (data.firebaseUid !== undefined) p.firebase_uid = data.firebaseUid;
    if (data.role !== undefined) p.role = data.role;
    if (data.email !== undefined) p.email = data.email.toLowerCase().trim();
    if (data.firstName !== undefined) p.first_name = data.firstName;
    if (data.lastName !== undefined) p.last_name = data.lastName;
    if (data.company !== undefined) p.company = data.company;
    if (data.country !== undefined) p.country = data.country;
    if (data.phone !== undefined) p.phone = data.phone;
    if (data.avatar !== undefined) p.avatar = data.avatar;
    if (data.wishlist !== undefined) p.wishlist = data.wishlist;
    if (data.bookings !== undefined) p.bookings = data.bookings;
    if (data.emailVerified !== undefined) p.email_verified = data.emailVerified;
    if (data.marketingOptIn !== undefined)
      p.marketing_opt_in = data.marketingOptIn;
    if (data.oauthProvider !== undefined) p.oauth_provider = data.oauthProvider;
    if (data.oauthId !== undefined) p.oauth_id = data.oauthId;

    const { data: updated, error } = await supabase
      .from("users")
      .update(p)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("AuthDB.update:", error.message);
      return null;
    }
    return toUser(updated);
  },

  async verifyEmail(userId: string): Promise<void> {
    await supabase
      .from("users")
      .update({ email_verified: true })
      .eq("id", userId);
  },

  async all(): Promise<User[]> {
    const { data } = await supabase.from("users").select("*");
    return (data ?? []).map(toUser);
  },

  async forgotPassword(_email: string): Promise<{ ok: boolean }> {
    return { ok: true }; // Firebase handles this
  },
};

/* ─────────────── ListingsDB ─────────────── */

export const ListingsDB = {
  async add(
    data: Omit<
      Listing,
      "id" | "rating" | "reviewCount" | "featured" | "available" | "createdAt"
    >,
  ): Promise<Listing> {
    const { data: row, error } = await supabase
      .from("listings")
      .insert({
        host_id: data.hostId,
        host_name: data.hostName,
        name: data.name,
        description: data.description,
        location: data.location,
        city: data.city,
        country: data.country,
        category: data.category,
        price_per_night: Number(data.pricePerNight),
        bedrooms: Number(data.bedrooms),
        bathrooms: Number(data.bathrooms),
        max_guests: Number(data.maxGuests),
        amenities: data.amenities,
        tags: data.tags,
        images: data.images,
        rating: 0,
        review_count: 0,
        featured: false,
        available: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toListing(row);
  },

  async update(id: string, data: Partial<Listing>): Promise<Listing | null> {
    const p: Record<string, unknown> = {};
    if (data.hostId !== undefined) p.host_id = data.hostId;
    if (data.hostName !== undefined) p.host_name = data.hostName;
    if (data.name !== undefined) p.name = data.name;
    if (data.description !== undefined) p.description = data.description;
    if (data.location !== undefined) p.location = data.location;
    if (data.city !== undefined) p.city = data.city;
    if (data.country !== undefined) p.country = data.country;
    if (data.category !== undefined) p.category = data.category;
    if (data.pricePerNight !== undefined)
      p.price_per_night = data.pricePerNight;
    if (data.bedrooms !== undefined) p.bedrooms = data.bedrooms;
    if (data.bathrooms !== undefined) p.bathrooms = data.bathrooms;
    if (data.maxGuests !== undefined) p.max_guests = data.maxGuests;
    if (data.amenities !== undefined) p.amenities = data.amenities;
    if (data.tags !== undefined) p.tags = data.tags;
    if (data.images !== undefined) p.images = data.images;
    if (data.rating !== undefined) p.rating = data.rating;
    if (data.reviewCount !== undefined) p.review_count = data.reviewCount;
    if (data.featured !== undefined) p.featured = data.featured;
    if (data.available !== undefined) p.available = data.available;

    const { data: updated, error } = await supabase
      .from("listings")
      .update(p)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("ListingsDB.update:", error.message);
      return null;
    }
    return toListing(updated);
  },

  async delete(id: string): Promise<void> {
    await supabase.from("listings").delete().eq("id", id);
  },

  async byHost(hostId: string): Promise<Listing[]> {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("ListingsDB.byHost:", error.message);
      return [];
    }
    return (data ?? []).map(toListing);
  },

  async all(): Promise<Listing[]> {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("verification_status", "verified")
      .eq("available", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("ListingsDB.all:", error.message);
      return [];
    }
    return (data ?? []).map(toListing);
  },

  async getById(id: string): Promise<Listing | null> {
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? toListing(data) : null;
  },

  async search(
    query: string,
    guests?: number,
    category?: string,
  ): Promise<Listing[]> {
    let q = supabase
      .from("listings")
      .select("*")
      .eq("available", true)
      .eq("verification_status", "verified");
    if (query.trim()) {
      q = q.or(
        `name.ilike.%${query}%,city.ilike.%${query}%,country.ilike.%${query}%,` +
          `location.ilike.%${query}%,category.ilike.%${query}%`,
      );
    }
    if (guests) q = q.gte("max_guests", guests);
    if (category) q = q.eq("category", category);
    q = q
      .order("featured", { ascending: false })
      .order("rating", { ascending: false });
    const { data, error } = await q;
    if (error) {
      console.error("ListingsDB.search:", error.message);
      return [];
    }
    return (data ?? []).map(toListing);
  },
};

/* ─────────────── BookingsDB ─────────────── */

export const BookingsDB = {
  async add(data: {
    guestId: string;
    guestName: string;
    guestEmail: string;
    listingId: string;
    listingName: string;
    hostId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
    totalAmount: number;
    specialRequests?: string;
    guestPhone: string;
  }): Promise<Booking> {
    const { data: row, error } = await supabase
      .from("bookings")
      .insert({
        guest_id: data.guestId,
        guest_name: data.guestName,
        guest_email: data.guestEmail,
        listing_id: data.listingId,
        listing_name: data.listingName,
        host_id: data.hostId,
        check_in: data.checkIn,
        check_out: data.checkOut,
        guests: data.guests,
        nights: data.nights,
        total_amount: data.totalAmount,
        special_requests: data.specialRequests ?? "",
        status: "confirmed",
        guest_phone: data.guestPhone,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Append booking id to guest's bookings array
    const guest = await AuthDB.getById(data.guestId);
    if (guest)
      await AuthDB.update(data.guestId, {
        bookings: [...guest.bookings, row.id],
      });

    return toBooking(row);
  },

  async byGuest(guestId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("guest_id", guestId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("BookingsDB.byGuest:", error.message);
      return [];
    }
    return (data ?? []).map(toBooking);
  },

  async byHost(hostId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("BookingsDB.byHost:", error.message);
      return [];
    }
    return (data ?? []).map(toBooking);
  },

  async getById(id: string): Promise<Booking | null> {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? toBooking(data) : null;
  },

  async all(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("BookingsDB.all:", error.message);
      return [];
    }
    return (data ?? []).map(toBooking);
  },

  async updateStatus(id: string, status: Booking["status"]): Promise<void> {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);
    if (error) console.error("BookingsDB.updateStatus:", error.message);
  },
};

/* ─────────────── Hotel helpers ─────────────── */

export function listingToHotel(listing: Listing): Hotel {
  return {
    ...listing,
    thumbnail: listing.images[0] ?? "",
    shortDescription:
      listing.description.length > 120
        ? `${listing.description.slice(0, 117)}...`
        : listing.description,
  };
}

export async function getLocationSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  const listings = await ListingsDB.search(query);
  const out = new Set<string>();
  for (const l of listings) {
    for (const v of [l.location, l.city, l.country, l.category, ...l.tags]) {
      if (v.toLowerCase().includes(query.toLowerCase())) out.add(v);
      if (out.size >= 6) break;
    }
    if (out.size >= 6) break;
  }
  return Array.from(out);
}

export async function searchHotels(params: SearchParams): Promise<Hotel[]> {
  const listings = await ListingsDB.search(params.query ?? "", params.guests);
  return listings.map(listingToHotel);
}

/* ─────────────── seedDemoData — no-op (data lives in Supabase) ─────────────── */
export function seedDemoData(): void {
  // Demo data is seeded via schema.sql. Nothing to do here.
}

/* ─────────────── TYPES: Reviews & Messages ─────────────── */

export interface Review {
  id: string;
  bookingId: string;
  listingId: string;
  guestId: string;
  hostId: string;
  guestName: string;
  guestAvatar: string;
  rating: number;
  title: string;
  body: string;
  cleanliness?: number;
  service?: number;
  location?: number;
  value?: number;
  helpful: number;
  hostReply?: string;
  createdAt: string;
  guestPhone: string;
}

export interface Conversation {
  id: string;
  guestId: string;
  guestPhone: string;
  hostId: string;
  listingId?: string;
  listingName: string;
  guestName: string;
  hostName: string;
  lastMessage: string;
  lastAt: string;
  unreadHost: number;
  unreadGuest: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: "host" | "guest";
  body: string;
  read: boolean;
  createdAt: string;
}

/* ─────────────── Row mappers ─────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toReview(r: any): Review {
  return {
    id: r.id,
    guestPhone: r.guest_phone ?? "",
    bookingId: r.booking_id,
    listingId: r.listing_id,
    guestId: r.guest_id,
    hostId: r.host_id,
    guestName: r.guest_name ?? "",
    guestAvatar: r.guest_avatar ?? "",
    rating: r.rating,
    title: r.title ?? "",
    body: r.body ?? "",
    cleanliness: r.cleanliness ?? undefined,
    service: r.service ?? undefined,
    location: r.location ?? undefined,
    value: r.value ?? undefined,
    helpful: r.helpful ?? 0,
    hostReply: r.host_reply ?? undefined,
    createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toConversation(r: any): Conversation {
  return {
    id: r.id,
    guestId: r.guest_id,
    guestPhone: r.guest_phone ?? "",
    hostId: r.host_id,
    listingId: r.listing_id ?? undefined,
    listingName: r.listing_name ?? "",
    guestName: r.guest_name ?? "",
    hostName: r.host_name ?? "",
    lastMessage: r.last_message ?? "",
    lastAt: r.last_at,
    unreadHost: r.unread_host ?? 0,
    unreadGuest: r.unread_guest ?? 0,
    createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMessage(r: any): Message {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    senderName: r.sender_name ?? "",
    senderAvatar: r.sender_avatar ?? "",
    senderRole: r.sender_role,
    body: r.body,
    read: r.read ?? false,
    createdAt: r.created_at,
  };
}

/* ─────────────── ReviewsDB ─────────────── */

export const ReviewsDB = {
  async add(data: {
    guestPhone: string;
    bookingId: string;
    listingId: string;
    guestId: string;
    hostId: string;
    guestName: string;
    guestAvatar: string;
    rating: number;
    title: string;
    body: string;
    cleanliness?: number;
    service?: number;
    location?: number;
    value?: number;
  }): Promise<Review> {
    const { data: row, error } = await supabase
      .from("reviews")
      .insert({
        booking_id: data.bookingId,
        listing_id: data.listingId,
        guest_id: data.guestId,
        host_id: data.hostId,
        guest_name: data.guestName,
        guest_avatar: data.guestAvatar,
        rating: data.rating,
        title: data.title,
        body: data.body,
        cleanliness: data.cleanliness ?? null,
        service: data.service ?? null,
        location: data.location ?? null,
        value: data.value ?? null,
        guest_phone: data.guestPhone ?? "",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await NotificationsDB.create({
      userId: data.hostId,
      type: "review",
      title: `New ${data.rating}★ review`,
      body: `${data.guestName} left a review: "${data.body.slice(0, 80)}"`,
      link: "/dashboard?tab=reviews",
    });
    return toReview(row);
  },

  async byListing(listingId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("ReviewsDB.byListing:", error.message);
      return [];
    }
    return (data ?? []).map(toReview);
  },

  async byHost(hostId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("ReviewsDB.byHost:", error.message);
      return [];
    }
    return (data ?? []).map(toReview);
  },
  async featured(limit = 30): Promise<Review[]> {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .gte("rating", 4)
      .not("body", "is", null)
      .neq("body", "")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("ReviewsDB.featured:", error.message);
      return [];
    }
    return (data ?? []).map(toReview);
  },

  async byGuest(guestId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("guest_id", guestId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("ReviewsDB.byGuest:", error.message);
      return [];
    }
    return (data ?? []).map(toReview);
  },

  async addHostReply(reviewId: string, reply: string): Promise<void> {
    const { error } = await supabase
      .from("reviews")
      .update({ host_reply: reply })
      .eq("id", reviewId);
    if (error) console.error("ReviewsDB.addHostReply:", error.message);
  },

  async markHelpful(reviewId: string, currentCount: number): Promise<void> {
    const { error } = await supabase
      .from("reviews")
      .update({ helpful: currentCount + 1 })
      .eq("id", reviewId);
    if (error) console.error("ReviewsDB.markHelpful:", error.message);
  },

  /** Check if a booking already has a review */
  async existsForBooking(bookingId: string): Promise<boolean> {
    const { data } = await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", bookingId)
      .maybeSingle();
    return !!data;
  },
};

/* ─────────────── MessagesDB ─────────────── */

// ─────────────────────────────────────────────────────────────────────────────
// Replace the MessagesDB block in your index.ts with this corrected version.
// The original sendMessage had a broken increment_unread call pattern.
// ─────────────────────────────────────────────────────────────────────────────

export const MessagesDB = {
  /** Get or create a conversation between a guest and host about a listing */
  async getOrCreateConversation(data: {
    guestId: string;
    hostId: string;
    listingId?: string;
    listingName: string;
    guestName: string;
    hostName: string;
  }): Promise<Conversation> {
    let q = supabase
      .from("conversations")
      .select("*")
      .eq("guest_id", data.guestId)
      .eq("host_id", data.hostId);
    if (data.listingId) q = q.eq("listing_id", data.listingId);
    const { data: existing } = await q.maybeSingle();
    if (existing) return toConversation(existing);

    const { data: created, error } = await supabase
      .from("conversations")
      .insert({
        guest_id: data.guestId,
        host_id: data.hostId,
        listing_id: data.listingId ?? null,
        listing_name: data.listingName,
        guest_name: data.guestName,
        host_name: data.hostName,
        last_message: "",
        last_at: new Date().toISOString(),
        unread_host: 0,
        unread_guest: 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toConversation(created);
  },

  async conversationsByUser(
    userId: string,
    role: "host" | "guest" | "admin",
  ): Promise<Conversation[]> {
    const col = role === "host" ? "host_id" : "guest_id";
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq(col, userId)
      .order("last_at", { ascending: false });
    if (error) {
      console.error("MessagesDB.byUser:", error.message);
      return [];
    }
    return (data ?? []).map(toConversation);
  },

  async messagesByConversation(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("MessagesDB.messages:", error.message);
      return [];
    }
    return (data ?? []).map(toMessage);
  },

  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    senderRole: "host" | "guest";
    body: string;
  }): Promise<Message> {
    // 1. Insert the message row
    const { data: row, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: data.conversationId,
        sender_id: data.senderId,
        sender_name: data.senderName,
        sender_avatar: data.senderAvatar,
        sender_role: data.senderRole,
        body: data.body,
        read: false,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // 2. Update last_message + last_at on the conversation
    const unreadCol =
      data.senderRole === "host" ? "unread_guest" : "unread_host";

    const { data: conv } = await supabase
      .from("conversations")
      .update({
        last_message: data.body,
        last_at: new Date().toISOString(),
      })
      .eq("id", data.conversationId)
      .select()
      .single();

    // 3. Increment the correct unread counter via RPC
    await supabase.rpc("increment_unread", {
      conv_id: data.conversationId,
      col: unreadCol,
    });

    // 4. Notify the OTHER participant
    if (conv) {
      const recipientId =
        data.senderRole === "host" ? conv.guest_id : conv.host_id;
      await NotificationsDB.create({
        userId: recipientId,
        type: "message",
        title: `New message from ${data.senderName}`,
        body: data.body.slice(0, 100),
        link: "/account?tab=messages",
      });
    }

    return toMessage(row);
  },

  async markRead(
    conversationId: string,
    role: "host" | "guest",
  ): Promise<void> {
    const col = role === "host" ? "unread_host" : "unread_guest";
    await supabase
      .from("conversations")
      .update({ [col]: 0 })
      .eq("id", conversationId);
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_role", role);
  },

  async totalUnread(userId: string, role: "host" | "guest"): Promise<number> {
    const col = role === "host" ? "host_id" : "guest_id";
    const ucol = role === "host" ? "unread_host" : "unread_guest";
    const { data } = await supabase
      .from("conversations")
      .select(ucol)
      .eq(col, userId);
    return (data ?? []).reduce((s: number, r: any) => s + (r[ucol] ?? 0), 0);
  },

  /** Supabase Realtime subscription for new messages in a conversation */
  subscribeToConversation(
    conversationId: string,
    onMessage: (msg: Message) => void,
  ) {
    return supabase
      .channel(`conv:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => onMessage(toMessage(payload.new)),
      )
      .subscribe();
  },

  /** Realtime subscription for conversation list updates (new messages badge) */
  subscribeToInbox(
    userId: string,
    role: "host" | "guest",
    onUpdate: (conv: Conversation) => void,
  ) {
    const col = role === "host" ? "host_id" : "guest_id";
    return supabase
      .channel(`inbox:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `${col}=eq.${userId}`,
        },
        (payload) => onUpdate(toConversation(payload.new)),
      )
      .subscribe();
  },
};
// ─────────────────────────────────────────────────────────────
// PASTE THIS BLOCK AT THE BOTTOM OF YOUR db/index.ts
// ─────────────────────────────────────────────────────────────
// It follows the exact same patterns as the existing DB modules
// (snake_case → camelCase mappers, same supabase client, same
//  error handling style).
// ─────────────────────────────────────────────────────────────

/* ─────────────── TYPES ─────────────── */

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";

export type SubmissionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_more_info";

export interface VerificationSubmission {
  id: string;
  listingId: string;
  hostId: string;

  // Gate 1 – Host identity
  hostIdDocUrl?: string;
  hostSelfieUrl?: string;

  // Gate 2 – Property ownership
  ownershipDocUrl?: string;
  utilityBillUrl?: string;

  // Gate 3 – Physical evidence
  photoUrls: string[];
  videoUrl?: string;

  hostNotes?: string;

  // Admin review
  status: SubmissionStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNote?: string;

  createdAt: string;
  updatedAt: string;
}

// Shape returned by the admin_verification_queue view
export interface AdminVerificationItem extends VerificationSubmission {
  listingName: string;
  listingLocation: string;
  listingCategory: string;
  listingImages: string[];
  hostEmail: string;
  hostFirstName: string;
  hostLastName: string;
}

/* ─────────────── Row mapper ─────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSubmission(r: any): VerificationSubmission {
  return {
    id: r.id,
    listingId: r.listing_id,
    hostId: r.host_id,
    hostIdDocUrl: r.host_id_doc_url ?? undefined,
    hostSelfieUrl: r.host_selfie_url ?? undefined,
    ownershipDocUrl: r.ownership_doc_url ?? undefined,
    utilityBillUrl: r.utility_bill_url ?? undefined,
    photoUrls: r.photo_urls ?? [],
    videoUrl: r.video_url ?? undefined,
    hostNotes: r.host_notes ?? undefined,
    status: r.status,
    reviewedBy: r.reviewed_by ?? undefined,
    reviewedAt: r.reviewed_at ?? undefined,
    adminNote: r.admin_note ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAdminItem(r: any): AdminVerificationItem {
  return {
    ...toSubmission(r),
    listingName: r.listing_name ?? "",
    listingLocation: r.listing_location ?? "",
    listingCategory: r.listing_category ?? "",
    listingImages: r.listing_images ?? [],
    hostEmail: r.host_email ?? "",
    hostFirstName: r.host_first_name ?? "",
    hostLastName: r.host_last_name ?? "",
  };
}

/* ─────────────── VerificationDB ─────────────── */

export const VerificationDB = {
  // ── Host: submit verification documents ──────────────────
  async submit(data: {
    listingId: string;
    hostId: string;
    hostIdDocUrl?: string;
    hostSelfieUrl?: string;
    ownershipDocUrl?: string;
    utilityBillUrl?: string;
    photoUrls?: string[];
    videoUrl?: string;
    hostNotes?: string;
  }): Promise<VerificationSubmission> {
    const { data: row, error } = await supabase
      .from("verification_submissions")
      .insert({
        listing_id: data.listingId,
        host_id: data.hostId,
        host_id_doc_url: data.hostIdDocUrl ?? null,
        host_selfie_url: data.hostSelfieUrl ?? null,
        ownership_doc_url: data.ownershipDocUrl ?? null,
        utility_bill_url: data.utilityBillUrl ?? null,
        photo_urls: data.photoUrls ?? [],
        video_url: data.videoUrl ?? null,
        host_notes: data.hostNotes ?? null,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Mark listing as pending verification
    await supabase
      .from("listings")
      .update({ verification_status: "pending", available: false })
      .eq("id", data.listingId);

    return toSubmission(row);
  },

  // ── Host: update an existing pending submission ───────────
  // (e.g. host re-uploads a clearer document after needs_more_info)
  async update(
    submissionId: string,
    data: Partial<
      Omit<
        VerificationSubmission,
        | "id"
        | "createdAt"
        | "updatedAt"
        | "status"
        | "reviewedBy"
        | "reviewedAt"
        | "adminNote"
      >
    >,
  ): Promise<VerificationSubmission> {
    const p: Record<string, unknown> = {};
    if (data.hostIdDocUrl !== undefined) p.host_id_doc_url = data.hostIdDocUrl;
    if (data.hostSelfieUrl !== undefined)
      p.host_selfie_url = data.hostSelfieUrl;
    if (data.ownershipDocUrl !== undefined)
      p.ownership_doc_url = data.ownershipDocUrl;
    if (data.utilityBillUrl !== undefined)
      p.utility_bill_url = data.utilityBillUrl;
    if (data.photoUrls !== undefined) p.photo_urls = data.photoUrls;
    if (data.videoUrl !== undefined) p.video_url = data.videoUrl;
    if (data.hostNotes !== undefined) p.host_notes = data.hostNotes;
    // Reset to pending so admin re-reviews
    p.status = "pending";

    const { data: row, error } = await supabase
      .from("verification_submissions")
      .update(p)
      .eq("id", submissionId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toSubmission(row);
  },

  // ── Host: get submission for a listing ───────────────────
  async byListing(listingId: string): Promise<VerificationSubmission | null> {
    const { data } = await supabase
      .from("verification_submissions")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? toSubmission(data) : null;
  },

  // ── Host: get all submissions they've made ────────────────
  async byHost(hostId: string): Promise<VerificationSubmission[]> {
    const { data, error } = await supabase
      .from("verification_submissions")
      .select("*")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("VerificationDB.byHost:", error.message);
      return [];
    }
    return (data ?? []).map(toSubmission);
  },

  // ── File upload helper ────────────────────────────────────
  // Uploads a file to the "verification-docs" Supabase Storage bucket.
  // Returns the public URL of the uploaded file.
  async uploadFile(
    _hostId: string,
    _listingId: string,
    file: File,
    category:
      | "host_id"
      | "selfie"
      | "ownership"
      | "utility"
      | "photo"
      | "video",
  ): Promise<string> {
    const { uploadToCloudinary } = await import("./cloudinary");
    const type = category === "video" ? "video" : "image";
    return uploadToCloudinary(file, type);
  },

  // ── Admin: get full verification queue ───────────────────
  async adminQueue(
    statusFilter?: SubmissionStatus,
  ): Promise<AdminVerificationItem[]> {
    let q = supabase.from("admin_verification_queue").select("*");
    if (statusFilter) q = q.eq("status", statusFilter);
    const { data, error } = await q;
    if (error) {
      console.error("VerificationDB.adminQueue:", error.message);
      return [];
    }
    return (data ?? []).map(toAdminItem);
  },

  // ── Admin: approve ────────────────────────────────────────
  async approve(submissionId: string, adminId: string): Promise<void> {
    const { error } = await supabase.rpc("approve_verification", {
      submission_id: submissionId,
      admin_id: adminId,
    });
    if (error) throw new Error(error.message);
  },

  // ── Admin: reject ─────────────────────────────────────────
  async reject(
    submissionId: string,
    adminId: string,
    note: string,
  ): Promise<void> {
    const { error } = await supabase.rpc("reject_verification", {
      submission_id: submissionId,
      admin_id: adminId,
      note,
    });
    if (error) throw new Error(error.message);
  },

  // ── Admin: request more information ──────────────────────
  async requestMoreInfo(
    submissionId: string,
    adminId: string,
    note: string,
  ): Promise<void> {
    const { error } = await supabase.rpc("request_more_info", {
      submission_id: submissionId,
      admin_id: adminId,
      note,
    });
    if (error) throw new Error(error.message);
  },
};
/* ─────────────── ListingImagesDB ─────────────── */

export const ListingImagesDB = {
  async upload(_hostId: string, file: File): Promise<string> {
    const { uploadToCloudinary } = await import("./cloudinary");
    return uploadToCloudinary(file, "image");
  },

  async delete(_url: string): Promise<void> {
    // Cloudinary deletion needs backend — skip for now
    // Old Supabase images still work fine, just won't be deleted
    console.log("Image hosted on Cloudinary — deletion skipped");
  },
};
/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  bookingId?: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  hostId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  // joined fields for admin view
  hostFirstName?: string;
  hostLastName?: string;
  hostEmail?: string;
}

/* ─────────────────────────────────────────────────────────────
   ROW MAPPERS
───────────────────────────────────────────────────────────── */
function toWallet(r: any): Wallet {
  return {
    id: r.id,
    userId: r.user_id,
    balance: Number(r.balance),
    totalEarned: Number(r.total_earned),
    totalWithdrawn: Number(r.total_withdrawn),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toTransaction(r: any): WalletTransaction {
  return {
    id: r.id,
    walletId: r.wallet_id,
    userId: r.user_id,
    type: r.type,
    amount: Number(r.amount),
    description: r.description ?? "",
    bookingId: r.booking_id ?? undefined,
    createdAt: r.created_at,
  };
}

function toWithdrawal(r: any): WithdrawalRequest {
  return {
    id: r.id,
    hostId: r.host_id,
    amount: Number(r.amount),
    bankName: r.bank_name,
    accountNumber: r.account_number,
    accountName: r.account_name,
    status: r.status,
    adminNote: r.admin_note ?? undefined,
    reviewedBy: r.reviewed_by ?? undefined,
    reviewedAt: r.reviewed_at ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    hostFirstName: r.first_name ?? undefined,
    hostLastName: r.last_name ?? undefined,
    hostEmail: r.email ?? undefined,
  };
}

/* ─────────────────────────────────────────────────────────────
   PLATFORM ADMIN USER ID
   Replace this with your actual admin user id from Supabase.
───────────────────────────────────────────────────────────── */
export const PLATFORM_ADMIN_ID = "7d597621-1416-4c1a-be9c-582dd68c5270";
export const PLATFORM_FEE_PCT = 0.1; // 10%

/* ─────────────────────────────────────────────────────────────
   WalletDB
───────────────────────────────────────────────────────────── */
export const WalletDB = {
  /** Get wallet for a user (returns null if not yet created) */
  async get(userId: string): Promise<Wallet | null> {
    const { data } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return data ? toWallet(data) : null;
  },

  /** Get transaction history for a user */
  async transactions(userId: string): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("WalletDB.transactions:", error.message);
      return [];
    }
    return (data ?? []).map(toTransaction);
  },

  /**
   * Called after a successful Paystack payment.
   * Credits 90% to the host wallet and 10% to the platform admin wallet.
   */
  async splitBookingPayment(
    hostId: string,
    bookingId: string,
    totalAmount: number,
    listingName: string,
  ): Promise<void> {
    const platformCut = Math.round(totalAmount * PLATFORM_FEE_PCT * 100) / 100;
    const hostCut = Math.round((totalAmount - platformCut) * 100) / 100;

    // Credit host (90%)
    const { error: hostErr } = await supabase.rpc("credit_wallet", {
      p_user_id: hostId,
      p_amount: hostCut,
      p_desc: `Booking earned: ${listingName}`,
      p_booking_id: bookingId,
    });
    if (hostErr) console.error("WalletDB credit host:", hostErr.message);

    // Credit platform admin (10%)
    const { error: adminErr } = await supabase.rpc("credit_wallet", {
      p_user_id: PLATFORM_ADMIN_ID,
      p_amount: platformCut,
      p_desc: `Platform fee (10%): ${listingName}`,
      p_booking_id: bookingId,
    });
    if (adminErr) console.error("WalletDB credit admin:", adminErr.message);
  },

  /** Host submits a withdrawal request (debits wallet immediately) */
  async requestWithdrawal(data: {
    hostId: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }): Promise<WithdrawalRequest> {
    // Debit the wallet first (locks the funds)
    const { error: debitErr } = await supabase.rpc("debit_wallet", {
      p_user_id: data.hostId,
      p_amount: data.amount,
      p_desc: `Withdrawal to ${data.bankName} — ${data.accountNumber}`,
    });
    if (debitErr) throw new Error(debitErr.message);

    // Create the withdrawal request record
    const { data: row, error } = await supabase
      .from("withdrawal_requests")
      .insert({
        host_id: data.hostId,
        amount: data.amount,
        bank_name: data.bankName,
        account_number: data.accountNumber,
        account_name: data.accountName,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toWithdrawal(row);
  },

  /** Host's withdrawal history */
  async withdrawalsByHost(hostId: string): Promise<WithdrawalRequest[]> {
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("WalletDB.withdrawalsByHost:", error.message);
      return [];
    }
    return (data ?? []).map(toWithdrawal);
  },

  /* ── Admin methods ── */

  /** All withdrawal requests with host info joined */
  async adminWithdrawals(
    status?: "pending" | "approved" | "rejected",
  ): Promise<WithdrawalRequest[]> {
    let q = supabase
      .from("withdrawal_requests")
      .select(
        "*, users!withdrawal_requests_host_id_fkey(first_name, last_name, email)",
      )
      .order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) {
      console.error("WalletDB.adminWithdrawals:", error.message);
      return [];
    }
    return (data ?? []).map((r: any) => ({
      ...toWithdrawal(r),
      hostFirstName: r.users?.first_name,
      hostLastName: r.users?.last_name,
      hostEmail: r.users?.email,
    }));
  },

  async approveWithdrawal(id: string, adminId: string): Promise<void> {
    const { data: wr, error } = await supabase
      .from("withdrawal_requests")
      .update({
        status: "approved",
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (wr) {
      await NotificationsDB.create({
        userId: wr.host_id,
        type: "withdrawal",
        title: "Withdrawal approved",
        body: `₦${Number(wr.amount).toLocaleString()} has been sent to ${wr.bank_name} — ${wr.account_number}.`,
        link: "/dashboard?tab=earnings",
      });
    }
  },

  async rejectWithdrawal(
    id: string,
    adminId: string,
    note: string,
    hostId: string,
    amount: number,
  ): Promise<void> {
    // Refund the wallet
    const { error: refundErr } = await supabase.rpc("credit_wallet", {
      p_user_id: hostId,
      p_amount: amount,
      p_desc: "Withdrawal rejected — funds returned",
    });
    if (refundErr) throw new Error(refundErr.message);

    const { data: wr, error } = await supabase
      .from("withdrawal_requests")
      .update({
        status: "rejected",
        admin_note: note,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (wr) {
      await NotificationsDB.create({
        userId: wr.host_id,
        type: "withdrawal",
        title: "Withdrawal rejected",
        body: `₦${Number(wr.amount).toLocaleString()} has been refunded to your wallet.`,
        link: "/dashboard?tab=earnings",
      });
    }
  },
};
/* ─────────────────────────────────────────────────────────────
   NOTIFICATIONS
───────────────────────────────────────────────────────────── */

export type NotificationType =
  | "message"
  | "booking_confirmed"
  | "payment"
  | "review"
  | "withdrawal";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNotification(r: any): AppNotification {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type,
    title: r.title,
    body: r.body ?? "",
    link: r.link ?? undefined,
    read: r.read ?? false,
    createdAt: r.created_at,
  };
}

export const NotificationsDB = {
  /** Create a notification for a user. Call this wherever an event happens
   *  that the user should be told about (message sent, booking confirmed,
   *  payment received, review left, withdrawal processed). */
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    link?: string;
  }): Promise<void> {
    const { error } = await supabase.from("notifications").insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      body: data.body ?? "",
      link: data.link ?? null,
    });
    if (error) console.error("NotificationsDB.create:", error.message);
  },

  /** Most recent notifications for a user, newest first. */
  async byUser(userId: string, limit = 20): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("NotificationsDB.byUser:", error.message);
      return [];
    }
    return (data ?? []).map(toNotification);
  },

  /** Count of unread notifications for a user. */
  async unreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) {
      console.error("NotificationsDB.unreadCount:", error.message);
      return 0;
    }
    return count ?? 0;
  },

  async markRead(id: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    if (error) console.error("NotificationsDB.markRead:", error.message);
  },

  async markAllRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) console.error("NotificationsDB.markAllRead:", error.message);
  },

  /** Realtime subscription — fires whenever a new notification is inserted
   *  for this user. Use this to bump the bell badge live, without polling. */
  subscribe(userId: string, onInsert: (n: AppNotification) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => onInsert(toNotification(payload.new)),
      )
      .subscribe();
  },
};
