/**
 * db/index.ts
 * Central in-browser database using localStorage.
 *
 * Production swap-out pattern:
 *   AuthDB.register(data)        → POST /api/auth/register
 *   AuthDB.login(e,p)            → POST /api/auth/login
 *   AuthDB.loginWithOAuth(data)  → POST /api/auth/oauth   (or use Firebase/Supabase/Clerk)
 *   AuthDB.forgotPassword(email) → POST /api/auth/forgot-password
 *   AuthDB.resetPassword(...)    → POST /api/auth/reset-password
 *   ListingsDB.add(data)         → POST /api/listings
 *   BookingsDB.add(data)         → POST /api/bookings
 *
 * OAuth (Google / Apple):
 *   These require a real OAuth provider — Firebase Auth, Supabase, Auth0, or Clerk.
 *   This file provides the LOCAL stub that OAuth callbacks would populate.
 *   Wire `AuthDB.loginWithOAuth` to your provider's callback in production.
 *
 * Password reset:
 *   Requires a backend email service (Resend, SendGrid, etc.).
 *   The LOCAL stub simulates token generation/verification in localStorage.
 *   In production, replace with a server endpoint that emails a signed JWT link.
 */

/* ─────────────── HELPERS ─────────────── */

/**
 * Minimal password obfuscation for local dev only.
 * NEVER use this in production — use bcrypt/argon2 on the server.
 */
function hashPassword(plain: string): string {
  return "hashed__" + btoa(unescape(encodeURIComponent(plain)));
}

function verifyPassword(plain: string, hashed: string): boolean {
  return hashed === hashPassword(plain);
}

/** Cryptographically random hex token (browser-safe). */
function generateToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

/* ─────────────── TYPES ─────────────── */

export type UserRole = "host" | "guest";
export type OAuthProvider = "google" | "apple";

export interface User {
  id: string;
  role: UserRole;
  email: string;
  password: string; // hashed; empty string for pure OAuth users
  firstName: string;
  lastName: string;
  company: string;
  country: string;
  phone: string;
  avatar: string; // initials e.g. "AB"
  wishlist: string[]; // listing ids
  bookings: string[]; // booking ids
  emailVerified: boolean;
  marketingOptIn: boolean;
  oauthProvider?: OAuthProvider;
  oauthId?: string; // provider's subject / uid
  createdAt: string;
  updatedAt: string;
}

/** Stored password-reset token record */
export interface PasswordResetToken {
  token: string;
  email: string;
  expiresAt: number; // epoch ms
  used: boolean;
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

/* ─────────────── STORAGE KEYS ─────────────── */

const KEYS = {
  users: "zb_users",
  listings: "zb_listings",
  bookings: "zb_bookings",
  session: "zb_session",
  resetTokens: "zb_reset_tokens",
  seeded: "zb_seeded", // separate seed flag — not tied to user count
} as const;

/* ─────────────── LOW-LEVEL STORAGE ─────────────── */

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ─────────────── AUTH DB ─────────────── */

export const AuthDB = {
  /* ── Register ── */
  register(data: {
    role: UserRole;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    company?: string;
    country?: string;
    phone?: string;
    marketingOptIn?: boolean;
  }): { ok: boolean; msg?: string; user?: User } {
    const users = load<User>(KEYS.users);
    const emailLower = data.email.toLowerCase().trim();

    if (users.find((u) => u.email === emailLower)) {
      return { ok: false, msg: "An account with this email already exists." };
    }

    const now = new Date().toISOString();
    const user: User = {
      id: "u_" + generateToken(8),
      role: data.role,
      email: emailLower,
      password: hashPassword(data.password),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      company: data.company?.trim() || "",
      country: data.country?.trim() || "",
      phone: data.phone?.trim() || "",
      avatar: (data.firstName[0] + (data.lastName?.[0] || "")).toUpperCase(),
      wishlist: [],
      bookings: [],
      emailVerified: false,
      marketingOptIn: data.marketingOptIn ?? false,
      createdAt: now,
      updatedAt: now,
    };

    users.push(user);
    save(KEYS.users, users);
    return { ok: true, user };
  },

  /* ── Email / password login ── */
  login(
    email: string,
    password: string,
    rememberMe = false,
  ): { ok: boolean; msg?: string; user?: User } {
    const users = load<User>(KEYS.users);
    const emailLower = email.toLowerCase().trim();
    const user = users.find((u) => u.email === emailLower);

    if (!user) return { ok: false, msg: "Invalid email or password." };

    // Support legacy plaintext passwords created before this upgrade
    const passwordMatch = user.password.startsWith("hashed__")
      ? verifyPassword(password, user.password)
      : user.password === password;

    if (!passwordMatch) return { ok: false, msg: "Invalid email or password." };

    Session.set(user, rememberMe);
    return { ok: true, user };
  },

  /* ── OAuth login / register (Google, Apple) ──────────────────────────────
   *
   * HOW TO WIRE THIS IN PRODUCTION:
   *
   * Option A — Firebase Auth (recommended for solo devs):
   *   import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
   *   const result = await signInWithPopup(auth, new GoogleAuthProvider());
   *   const profile = result.user;
   *   AuthDB.loginWithOAuth({
   *     provider: "google",
   *     oauthId: profile.uid,
   *     email: profile.email!,
   *     firstName: profile.displayName?.split(" ")[0] ?? "",
   *     lastName: profile.displayName?.split(" ").slice(1).join(" ") ?? "",
   *     role: selectedRole,   // capture before the OAuth popup
   *   });
   *
   * Option B — Supabase Auth:
   *   const { data } = await supabase.auth.signInWithOAuth({ provider: "google" });
   *   // Then handle the session callback in your AuthContext.
   *
   * Option C — Clerk / Auth0:
   *   Use their pre-built <SignIn /> component; hook the onSuccess callback
   *   to call AuthDB.loginWithOAuth with the returned profile.
   *
   * This local stub lets the rest of the app work identically in dev
   * without any real OAuth provider.
   * ─────────────────────────────────────────────────────────────────────── */
  loginWithOAuth(data: {
    provider: OAuthProvider;
    oauthId: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: UserRole; // required on first sign-up; ignored on re-login
    avatar?: string;
  }): { ok: boolean; msg?: string; user?: User; isNew: boolean } {
    const users = load<User>(KEYS.users);
    const emailLower = data.email.toLowerCase().trim();

    // Find by oauthId first (most stable), fall back to email
    let user =
      users.find(
        (u) => u.oauthProvider === data.provider && u.oauthId === data.oauthId,
      ) ?? users.find((u) => u.email === emailLower);

    const now = new Date().toISOString();

    if (!user) {
      // First-time OAuth sign-up — role selection is required
      if (!data.role) {
        return {
          ok: false,
          msg: "Please select Host or Guest before signing in with a provider.",
          isNew: true,
        };
      }

      user = {
        id: "u_" + generateToken(8),
        role: data.role,
        email: emailLower,
        password: "", // no password for OAuth-only users
        firstName: data.firstName,
        lastName: data.lastName,
        company: "",
        country: "",
        phone: "",
        avatar:
          data.avatar ||
          (data.firstName[0] + (data.lastName?.[0] || "")).toUpperCase(),
        wishlist: [],
        bookings: [],
        emailVerified: true, // OAuth providers already verify the email
        marketingOptIn: false,
        oauthProvider: data.provider,
        oauthId: data.oauthId,
        createdAt: now,
        updatedAt: now,
      };
      users.push(user);
      save(KEYS.users, users);
      Session.set(user);
      return { ok: true, user, isNew: true };
    }

    // Returning user — patch OAuth fields if they signed up via email before
    const i = users.findIndex((u) => u.id === user!.id);
    users[i] = {
      ...users[i],
      oauthProvider: data.provider,
      oauthId: data.oauthId,
      emailVerified: true,
      updatedAt: now,
    };
    save(KEYS.users, users);
    Session.set(users[i]);
    return { ok: true, user: users[i], isNew: false };
  },

  /* ── Forgot password ─────────────────────────────────────────────────────
   *
   * HOW TO WIRE IN PRODUCTION:
   *   POST /api/auth/forgot-password  { email }
   *   → server looks up user, generates a signed JWT (short-lived),
   *     stores token hash in DB, emails link: /reset-password?token=<jwt>
   *   Use: Resend, SendGrid, Postmark, or AWS SES for the email.
   *   Use: jsonwebtoken or jose to sign/verify the token server-side.
   *
   * LOCAL STUB:
   *   Generates a random token, stores it in localStorage with a 15-min
   *   expiry, and returns __devToken so you can test the full reset flow
   *   without an email service.
   *   In dev: navigate to /reset-password?token=<__devToken> manually.
   * ─────────────────────────────────────────────────────────────────────── */
  forgotPassword(email: string): {
    ok: boolean;
    msg?: string;
    /** Dev-only: simulate clicking the reset link without a real email */
    __devToken?: string;
  } {
    const users = load<User>(KEYS.users);
    const emailLower = email.toLowerCase().trim();
    const user = users.find((u) => u.email === emailLower);

    // Always return ok=true to prevent email enumeration
    if (!user) return { ok: true };

    const token = generateToken(32);
    const record: PasswordResetToken = {
      token,
      email: emailLower,
      expiresAt: Date.now() + 15 * 60 * 1000,
      used: false,
    };

    const tokens = load<PasswordResetToken>(KEYS.resetTokens);
    const cleaned = tokens.filter((t) => t.email !== emailLower); // invalidate old tokens
    cleaned.push(record);
    save(KEYS.resetTokens, cleaned);

    // Production: send email here via your backend
    return { ok: true, __devToken: token };
  },

  /** Validate a reset token before showing the new-password form */
  validateResetToken(token: string): {
    ok: boolean;
    msg?: string;
    email?: string;
  } {
    const tokens = load<PasswordResetToken>(KEYS.resetTokens);
    const record = tokens.find((t) => t.token === token);
    if (!record) return { ok: false, msg: "Invalid or expired reset link." };
    if (record.used)
      return { ok: false, msg: "This link has already been used." };
    if (Date.now() > record.expiresAt)
      return {
        ok: false,
        msg: "This link has expired. Please request a new one.",
      };
    return { ok: true, email: record.email };
  },

  /** Complete the reset — call after validateResetToken succeeds */
  resetPassword(
    token: string,
    newPassword: string,
  ): { ok: boolean; msg?: string } {
    const validation = this.validateResetToken(token);
    if (!validation.ok) return validation;

    const users = load<User>(KEYS.users);
    const i = users.findIndex((u) => u.email === validation.email);
    if (i === -1) return { ok: false, msg: "User not found." };

    users[i].password = hashPassword(newPassword);
    users[i].updatedAt = new Date().toISOString();
    save(KEYS.users, users);

    // Mark token as used
    const tokens = load<PasswordResetToken>(KEYS.resetTokens);
    const ti = tokens.findIndex((t) => t.token === token);
    if (ti > -1) {
      tokens[ti].used = true;
      save(KEYS.resetTokens, tokens);
    }

    return { ok: true };
  },

  /** Call after the user clicks the verification link in their welcome email */
  verifyEmail(userId: string): void {
    const users = load<User>(KEYS.users);
    const i = users.findIndex((u) => u.id === userId);
    if (i > -1) {
      users[i].emailVerified = true;
      users[i].updatedAt = new Date().toISOString();
      save(KEYS.users, users);
    }
  },

  changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): { ok: boolean; msg?: string } {
    const users = load<User>(KEYS.users);
    const i = users.findIndex((u) => u.id === id);
    if (i === -1) return { ok: false, msg: "User not found." };

    const match = users[i].password.startsWith("hashed__")
      ? verifyPassword(currentPassword, users[i].password)
      : users[i].password === currentPassword;

    if (!match) return { ok: false, msg: "Current password is incorrect." };

    users[i].password = hashPassword(newPassword);
    users[i].updatedAt = new Date().toISOString();
    save(KEYS.users, users);
    return { ok: true };
  },

  getById(id: string): User | undefined {
    return load<User>(KEYS.users).find((u) => u.id === id);
  },

  getByEmail(email: string): User | undefined {
    return load<User>(KEYS.users).find(
      (u) => u.email === email.toLowerCase().trim(),
    );
  },

  update(
    id: string,
    data: Partial<Omit<User, "id" | "createdAt">>,
  ): User | undefined {
    const users = load<User>(KEYS.users);
    const i = users.findIndex((u) => u.id === id);
    if (i > -1) {
      users[i] = { ...users[i], ...data, updatedAt: new Date().toISOString() };
      save(KEYS.users, users);
      // Keep active session in sync
      const session = Session.get();
      if (session?.id === id) Session.set(users[i]);
      return users[i];
    }
  },

  all(): User[] {
    return load<User>(KEYS.users);
  },
};

/* ─────────────── LISTINGS DB ─────────────── */

export const ListingsDB = {
  add(
    data: Omit<
      Listing,
      "id" | "rating" | "reviewCount" | "featured" | "available" | "createdAt"
    >,
  ): Listing {
    const listings = load<Listing>(KEYS.listings);
    const listing: Listing = {
      id: "l_" + generateToken(8),
      ...data,
      pricePerNight: Number(data.pricePerNight),
      bedrooms: Number(data.bedrooms),
      bathrooms: Number(data.bathrooms),
      maxGuests: Number(data.maxGuests),
      rating: 0,
      reviewCount: 0,
      featured: false,
      available: true,
      createdAt: new Date().toISOString(),
    };
    listings.push(listing);
    save(KEYS.listings, listings);
    return listing;
  },

  update(id: string, data: Partial<Listing>): Listing | undefined {
    const listings = load<Listing>(KEYS.listings);
    const i = listings.findIndex((l) => l.id === id);
    if (i > -1) {
      listings[i] = { ...listings[i], ...data };
      save(KEYS.listings, listings);
      return listings[i];
    }
  },

  delete(id: string): void {
    save(
      KEYS.listings,
      load<Listing>(KEYS.listings).filter((l) => l.id !== id),
    );
  },

  byHost(hostId: string): Listing[] {
    return load<Listing>(KEYS.listings).filter((l) => l.hostId === hostId);
  },

  all(): Listing[] {
    return load<Listing>(KEYS.listings).filter((l) => l.available);
  },

  getById(id: string): Listing | undefined {
    return load<Listing>(KEYS.listings).find((l) => l.id === id);
  },

  search(query: string, guests?: number, category?: string): Listing[] {
    let results = this.all();
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.country.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (guests) results = results.filter((l) => l.maxGuests >= guests);
    if (category) results = results.filter((l) => l.category === category);
    return results;
  },
};

/* ─────────────── BOOKINGS DB ─────────────── */

export const BookingsDB = {
  add(data: {
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
  }): Booking {
    const bookings = load<Booking>(KEYS.bookings);
    const booking: Booking = {
      id: "bk_" + generateToken(8),
      ref: "ZB-" + generateToken(3).toUpperCase(),
      ...data,
      specialRequests: data.specialRequests || "",
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    bookings.push(booking);
    save(KEYS.bookings, bookings);

    const guest = AuthDB.getById(data.guestId);
    if (guest) {
      AuthDB.update(data.guestId, {
        bookings: [...guest.bookings, booking.id],
      });
    }
    return booking;
  },

  byGuest(guestId: string): Booking[] {
    return load<Booking>(KEYS.bookings).filter((b) => b.guestId === guestId);
  },

  byHost(hostId: string): Booking[] {
    return load<Booking>(KEYS.bookings).filter((b) => b.hostId === hostId);
  },

  getById(id: string): Booking | undefined {
    return load<Booking>(KEYS.bookings).find((b) => b.id === id);
  },

  all(): Booking[] {
    return load<Booking>(KEYS.bookings);
  },

  updateStatus(id: string, status: Booking["status"]): void {
    const bookings = load<Booking>(KEYS.bookings);
    const i = bookings.findIndex((b) => b.id === id);
    if (i > -1) {
      bookings[i].status = status;
      save(KEYS.bookings, bookings);
    }
  },
};

/* ─────────────── SESSION ─────────────── */

export const Session = {
  /**
   * rememberMe=true  → localStorage  (persists 30 days across tab closes)
   * rememberMe=false → sessionStorage (clears when tab/browser closes)
   */
  set(user: User, rememberMe = false): void {
    const payload = JSON.stringify({ user, rememberMe, setAt: Date.now() });
    if (rememberMe) {
      localStorage.setItem(KEYS.session, payload);
      sessionStorage.removeItem(KEYS.session);
    } else {
      sessionStorage.setItem(KEYS.session, payload);
      localStorage.removeItem(KEYS.session);
    }
  },

  get(): User | null {
    try {
      const raw =
        sessionStorage.getItem(KEYS.session) ??
        localStorage.getItem(KEYS.session);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as {
        user: User;
        rememberMe: boolean;
        setAt: number;
      };

      if (parsed.rememberMe) {
        const ageMs = Date.now() - parsed.setAt;
        if (ageMs > 30 * 24 * 60 * 60 * 1000) {
          this.clear();
          return null;
        }
      }

      return parsed.user;
    } catch {
      return null;
    }
  },

  clear(): void {
    sessionStorage.removeItem(KEYS.session);
    localStorage.removeItem(KEYS.session);
  },

  isLoggedIn(): boolean {
    return this.get() !== null;
  },
};

/* ─────────────── HOTEL HELPERS ─────────────── */

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

export function getLocationSuggestions(query: string): string[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const suggestions = new Set<string>();

  for (const listing of ListingsDB.all()) {
    const values = [
      listing.location,
      listing.city,
      listing.country,
      listing.category,
      ...listing.tags,
    ];
    for (const value of values) {
      if (value.toLowerCase().includes(q)) suggestions.add(value);
    }
    if (suggestions.size >= 10) break;
  }

  return Array.from(suggestions).slice(0, 6);
}

export function searchHotels(params: SearchParams): Hotel[] {
  return ListingsDB.search(params.query ?? "", params.guests, undefined).map(
    listingToHotel,
  );
}

/* ─────────────── SEED DEMO DATA ─────────────── */

export function seedDemoData(): void {
  // Use a dedicated flag — not user count — so real user signups don't
  // prevent the seed from running on a fresh install.
  if (localStorage.getItem(KEYS.seeded) === "1") return;

  const hostRes = AuthDB.register({
    role: "host",
    email: "host@demo.com",
    password: "Demo1234!",
    firstName: "Alexandre",
    lastName: "Dubois",
    company: "Villa Lumière",
    country: "France",
    phone: "+33 6 12 34 56",
  });

  AuthDB.register({
    role: "guest",
    email: "guest@demo.com",
    password: "Demo1234!",
    firstName: "Aria",
    lastName: "Chen",
    country: "Singapore",
    phone: "+65 9123 4567",
  });

  // Pre-verify demo accounts so they skip the "check your email" banner
  const hostUser = AuthDB.getByEmail("host@demo.com");
  const guestUser = AuthDB.getByEmail("guest@demo.com");
  if (hostUser) AuthDB.verifyEmail(hostUser.id);
  if (guestUser) AuthDB.verifyEmail(guestUser.id);

  if (hostRes.ok && hostRes.user) {
    const h = hostRes.user;

    ListingsDB.add({
      hostId: h.id,
      hostName: `${h.firstName} ${h.lastName}`,
      name: "Villa Lumière Côte d'Azur",
      description:
        "A breathtaking clifftop villa perched above the azure Mediterranean with panoramic sea views from every room. Private infinity pool, terraced gardens, and seamless indoor-outdoor living.",
      location: "Èze-sur-Mer, Côte d'Azur",
      city: "Èze",
      country: "France",
      category: "villa",
      pricePerNight: 1850,
      bedrooms: 4,
      bathrooms: 4,
      maxGuests: 8,
      amenities: [
        "Pool",
        "Sea View",
        "BBQ",
        "Wine Cellar",
        "Butler",
        "Air Conditioning",
      ],
      images: [
        "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
      ],
      tags: ["Sea View", "Romantic", "Luxury", "Private"],
    });

    ListingsDB.add({
      hostId: h.id,
      hostName: `${h.firstName} ${h.lastName}`,
      name: "Appartement Haussmann Paris 7e",
      description:
        "Authentic Second Empire Haussmann apartment with original ceiling mouldings, herringbone parquet floors, and views over the golden-lit rooftops of the 7th arrondissement.",
      location: "Saint-Germain-des-Prés, Paris",
      city: "Paris",
      country: "France",
      category: "apartment",
      pricePerNight: 620,
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      amenities: [
        "Free WiFi",
        "Concierge",
        "Air Conditioning",
        "Netflix",
        "Daily Cleaning",
      ],
      images: [
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
        "https://images.unsplash.com/photo-1549144511-f099e773c147?w=800",
      ],
      tags: ["Historic", "Paris", "Elegant", "Central"],
    });
  }

  localStorage.setItem(KEYS.seeded, "1");
}
