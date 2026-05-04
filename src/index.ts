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

console.log("URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://bwfftarbhvbhywucgftx.supabase.co";

const SUPABASE_ANON =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZmZ0YXJiaHZiaHl3dWNnZnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDA0MzAsImV4cCI6MjA5MzMxNjQzMH0.fEHW44Z-L2XmDfu143fdjbkEGIu9Wm12CnqioSqUW0I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

/* ─────────────── TYPES  (identical to old version) ─────────────── */

export type UserRole = "host" | "guest";
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
    let q = supabase.from("listings").select("*").eq("available", true);
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
