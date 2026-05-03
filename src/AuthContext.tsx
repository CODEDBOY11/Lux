// src/AuthContext.tsx
// Firebase Auth + Supabase DB — fully async.
//
// What changed from the localStorage version:
//   - Every AuthDB call is now awaited (Supabase is async)
//   - ensureSupabaseUser() replaces ensureLocalUser() — async, hits Supabase
//   - getRedirectResult() handles Google/Apple redirect return
//   - Role is persisted in localStorage across the OAuth redirect round-trip
//   - loginWithGoogle / loginWithApple are void (trigger redirect, page navigates away)

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, appleProvider } from "./Firebase";
import {
  AuthDB,
  Session,
  seedDemoData,
  type User,
  type UserRole,
} from "./index";

/* ─────────────── Constants ─────────────── */

const REDIRECT_ROLE_KEY = "zb_oauth_redirect_role";
const REDIRECT_PROVIDER_KEY = "zb_oauth_redirect_provider";

/* ─────────────── Types ─────────────── */

type AuthResult = { ok: boolean; msg?: string; user?: User };

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  updateUser: (data: Partial<User>) => Promise<void>;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  /** Saves role to localStorage then redirects to Google. Page navigates away. */
  loginWithGoogle: (role: UserRole) => void;
  /** Saves role to localStorage then redirects to Apple. Page navigates away. */
  loginWithApple: (role: UserRole) => void;
  forgotPassword: (email: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

interface RegisterData {
  role: UserRole;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  country?: string;
  phone?: string;
  marketingOptIn?: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/* ─────────────── Firebase error → readable message ─────────────── */

function firebaseMsg(code: string): string {
  const map: Record<string, string> = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/popup-closed-by-user": "Sign-in was closed. Please try again.",
    "auth/popup-blocked": "Popup blocked. Please allow popups for this site.",
    "auth/cancelled-popup-request": "Sign-in was cancelled.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/user-disabled": "This account has been disabled.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}

/* ─────────────── ensureSupabaseUser ─────────────────────────────────────────
 * After any Firebase sign-in, guarantee a matching row exists in Supabase.
 * Creates one automatically if the user signed in via Firebase Console
 * or is a first-time OAuth user.
 * ─────────────────────────────────────────────────────────────────────────── */

async function ensureSupabaseUser(
  fbUser: FirebaseUser,
  role: UserRole = "guest",
  provider?: "google" | "apple",
): Promise<User> {
  const email = (fbUser.email ?? "").toLowerCase().trim();

  // 1. Try find by firebase_uid
  let local = await AuthDB.getByFirebaseUid(fbUser.uid);

  // 2. Fall back to email
  if (!local) {
    local = await AuthDB.getByEmail(email);
  }

  if (local) {
    // Patch OAuth / verified fields if they changed
    const needsPatch =
      (provider && (!local.oauthProvider || !local.oauthId)) ||
      (fbUser.emailVerified && !local.emailVerified) ||
      !local.firebaseUid;

    if (needsPatch) {
      const patch: Partial<User> = {};
      if (!local.firebaseUid) patch.firebaseUid = fbUser.uid;
      if (provider && !local.oauthProvider) patch.oauthProvider = provider;
      if (provider && !local.oauthId) patch.oauthId = fbUser.uid;
      if (fbUser.emailVerified && !local.emailVerified)
        patch.emailVerified = true;

      local = (await AuthDB.update(local.id, patch)) ?? local;
    }
    return local;
  }

  // 3. No Supabase record at all — create one
  const nameParts = (fbUser.displayName ?? "").trim().split(" ");
  const firstName = nameParts[0] || "User";
  const lastName = nameParts.slice(1).join(" ") || "";

  const result = await AuthDB.register({
    role,
    email,
    password: "", // Firebase owns the credential
    firstName,
    lastName,
    firebaseUid: fbUser.uid,
    marketingOptIn: false,
  });

  if (result.ok && result.user) {
    const patches: Partial<User> = { firebaseUid: fbUser.uid };
    if (provider) {
      patches.oauthProvider = provider;
      patches.oauthId = fbUser.uid;
    }
    if (fbUser.emailVerified) patches.emailVerified = true;
    return (await AuthDB.update(result.user.id, patches)) ?? result.user;
  }

  // Race condition — row appeared between check and insert, look it up again
  const retry = await AuthDB.getByEmail(email);
  if (!retry) throw new Error("Failed to create or find user in Supabase.");
  return retry;
}

/* ─────────────── Provider ─────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(Session.get());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = useCallback(() => setUser(Session.get()), []);

  useEffect(() => {
    // No-op for Supabase (demo data seeded via schema.sql)
    seedDemoData();

    /* ── Step 1: Handle OAuth redirect result ────────────────────────────
     * When Google/Apple redirects back to your app, getRedirectResult()
     * returns the credential. We read the saved role from localStorage,
     * upsert the Supabase user, and navigate to the right dashboard.
     * ─────────────────────────────────────────────────────────────────── */
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return; // Normal page load — no pending redirect

        const savedRole =
          (localStorage.getItem(REDIRECT_ROLE_KEY) as UserRole) ?? "guest";
        const savedProvider =
          (localStorage.getItem(REDIRECT_PROVIDER_KEY) as "google" | "apple") ??
          "google";
        localStorage.removeItem(REDIRECT_ROLE_KEY);
        localStorage.removeItem(REDIRECT_PROVIDER_KEY);

        const localUser = await ensureSupabaseUser(
          result.user,
          savedRole,
          savedProvider,
        );
        Session.set(localUser);
        setUser(localUser);

        navigate(localUser.role === "host" ? "/dashboard" : "/account", {
          replace: true,
        });
      })
      .catch((err) => {
        console.error("getRedirectResult error:", err);
        localStorage.removeItem(REDIRECT_ROLE_KEY);
        localStorage.removeItem(REDIRECT_PROVIDER_KEY);
      });

    /* ── Step 2: Ongoing auth state observer ────────────────────────────
     * Fires on every page load and whenever Firebase auth state changes.
     * Syncs the Supabase user record into local session cache.
     * ─────────────────────────────────────────────────────────────────── */
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Look up the Supabase record by firebase_uid
        const existing =
          (await AuthDB.getByFirebaseUid(fbUser.uid)) ??
          (await AuthDB.getByEmail((fbUser.email ?? "").toLowerCase().trim()));

        if (existing) {
          // Sync email-verified from Firebase → Supabase if needed
          if (fbUser.emailVerified && !existing.emailVerified) {
            await AuthDB.verifyEmail(existing.id);
          }
          const fresh = (await AuthDB.getById(existing.id)) ?? existing;
          const remembered = Session.isRemembered();
          Session.set(fresh, remembered);
          setUser(fresh);
        }
        // No Supabase record on plain auth-state-change: handled by
        // getRedirectResult (OAuth) or login() (email/password).
      } else {
        Session.clear();
        setUser(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Email / password login ── */
  const login = useCallback(
    async (
      email: string,
      password: string,
      rememberMe = false,
    ): Promise<AuthResult> => {
      let fbUser: FirebaseUser;
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        fbUser = cred.user;
      } catch (err: any) {
        return { ok: false, msg: firebaseMsg(err.code) };
      }

      // Guarantee Supabase record (handles Firebase-Console-created users)
      const localUser = await ensureSupabaseUser(fbUser);
      Session.set(localUser, rememberMe);
      setUser(localUser);
      return { ok: true, user: localUser };
    },
    [],
  );

  /* ── Register ── */
  const register = useCallback(
    async (data: RegisterData): Promise<AuthResult> => {
      let fbUser: FirebaseUser;
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          data.email,
          data.password,
        );
        fbUser = cred.user;
      } catch (err: any) {
        return { ok: false, msg: firebaseMsg(err.code) };
      }

      // Send verification email (non-blocking)
      try {
        await sendEmailVerification(fbUser);
      } catch {
        /* best-effort */
      }

      // Save to Supabase
      const result = await AuthDB.register({
        ...data,
        firebaseUid: fbUser.uid,
      });
      if (!result.ok) return result;

      // Sign out — user must verify email before logging in
      await signOut(auth);
      return { ok: true, user: result.user };
    },
    [],
  );

  /* ── Google sign-in ──────────────────────────────────────────────────────
   * Saves role → triggers redirect → page navigates away.
   * Result is handled by getRedirectResult() in the useEffect above.
   * DO NOT await this — it returns void intentionally.
   * ─────────────────────────────────────────────────────────────────────── */
  const loginWithGoogle = useCallback((role: UserRole): void => {
    localStorage.setItem(REDIRECT_ROLE_KEY, role);
    localStorage.setItem(REDIRECT_PROVIDER_KEY, "google");
    signInWithRedirect(auth, googleProvider);
  }, []);

  /* ── Apple sign-in ── */
  const loginWithApple = useCallback((role: UserRole): void => {
    localStorage.setItem(REDIRECT_ROLE_KEY, role);
    localStorage.setItem(REDIRECT_PROVIDER_KEY, "apple");
    signInWithRedirect(auth, appleProvider);
  }, []);

  /* ── Forgot password ──
   * Firebase sends the reset email — no backend needed.
   * Customise the template at:
   * Firebase Console → Authentication → Templates → Password reset
   */
  const forgotPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      try {
        await sendPasswordResetEmail(auth, email);
        await AuthDB.forgotPassword(email); // no-op in Supabase version, kept for compat
        return { ok: true };
      } catch (err: any) {
        if (err.code === "auth/user-not-found") return { ok: true }; // don't expose
        return { ok: false, msg: firebaseMsg(err.code) };
      }
    },
    [],
  );

  /* ── Logout ── */
  const logout = useCallback(async (): Promise<void> => {
    await signOut(auth);
    Session.clear();
    setUser(null);
  }, []);

  /* ── Update user profile ── */
  const updateUser = useCallback(
    async (data: Partial<User>): Promise<void> => {
      if (!user) return;
      const updated = await AuthDB.update(user.id, data);
      if (updated) {
        Session.set(updated, Session.isRemembered());
        setUser(updated);
      }
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        loginWithApple,
        forgotPassword,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ─────────────── ProtectedRoute ─────────────── */

export function ProtectedRoute({
  children,
  role,
  fallback = null,
}: {
  children: ReactNode;
  role?: UserRole;
  fallback?: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#0e0d0b",
          color: "#C9A96E",
          fontFamily: "Cormorant Garamond, serif",
          fontSize: 22,
          gap: 12,
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            border: "2px solid rgba(201,169,110,0.3)",
            borderTopColor: "#C9A96E",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Loading…
      </div>
    );
  }

  if (!user) return <>{fallback}</>;
  if (role && user.role !== role) return <>{fallback}</>;
  return <>{children}</>;
}
