// src/AuthContext.tsx
// Firebase-wired auth context.
// FIXES:
//   1. Correct Firebase import path
//   2. Email login works for Firebase-Console-created users (auto-creates local record)
//   3. onAuthStateChanged restores session for BOTH email AND OAuth users on page reload
//   4. Google login correctly handles existing email users (no role required on re-login)
//   5. rememberMe is properly forwarded from login()

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
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
// FIX 1: Correct import path — adjust if your file structure differs
import { auth, googleProvider, appleProvider } from "./Firebase";
import {
  AuthDB,
  Session,
  seedDemoData,
  type User,
  type UserRole,
} from "./index";

/* ─────────────── Types ─────────────── */

type AuthResult = { ok: boolean; msg?: string; user?: User };

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  updateUser: (data: Partial<User>) => void;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  loginWithGoogle: (role: UserRole) => Promise<AuthResult>;
  loginWithApple: (role: UserRole) => Promise<AuthResult>;
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

/* ─────────────── Firebase error messages ─────────────── */

function firebaseMsg(code: string): string {
  const map: Record<string, string> = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests":
      "Too many attempts. Please wait a moment and try again.",
    "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
    "auth/popup-blocked":
      "Popup was blocked. Please allow popups for this site.",
    "auth/cancelled-popup-request": "Sign-in was cancelled.",
    "auth/network-request-failed":
      "Network error. Check your connection and try again.",
    "auth/user-disabled": "This account has been disabled.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}

/* ─────────────── Helper: ensure a local DB record exists for a Firebase user ───
 *
 * FIX 2 + FIX 3:
 * Users created via the Firebase Console, Google OAuth, or any other
 * Firebase method may not have a matching record in localStorage yet.
 * This function creates one automatically so the rest of the app works.
 */
function ensureLocalUser(
  fbUser: FirebaseUser,
  role: UserRole = "guest",
  provider?: "google" | "apple",
): User {
  const email = (fbUser.email ?? "").toLowerCase().trim();

  // Try to find existing local record
  let local =
    AuthDB.getByEmail(email) ??
    (provider && fbUser.uid
      ? AuthDB.all().find(
          (u) => u.oauthProvider === provider && u.oauthId === fbUser.uid,
        )
      : undefined);

  if (local) {
    // Patch OAuth fields if missing (e.g. user signed up via email, now using Google)
    if (provider && (!local.oauthProvider || !local.oauthId)) {
      local =
        AuthDB.update(local.id, {
          oauthProvider: provider,
          oauthId: fbUser.uid,
          emailVerified: true,
        }) ?? local;
    }
    return local;
  }

  // No local record — create one from Firebase profile data
  const nameParts = (fbUser.displayName ?? "").trim().split(" ");
  const firstName = nameParts[0] || "User";
  const lastName = nameParts.slice(1).join(" ") || "";

  const result = AuthDB.register({
    role,
    email,
    password: "", // Firebase owns the password
    firstName,
    lastName,
    marketingOptIn: false,
  });

  if (result.ok && result.user) {
    // Mark verified if Firebase says so
    if (fbUser.emailVerified) {
      AuthDB.verifyEmail(result.user.id);
      return AuthDB.getById(result.user.id) ?? result.user;
    }
    // Patch OAuth fields
    if (provider) {
      return (
        AuthDB.update(result.user.id, {
          oauthProvider: provider,
          oauthId: fbUser.uid,
          emailVerified: true,
        }) ?? result.user
      );
    }
    return result.user;
  }

  // register() returned ok:false — the email was already there, race condition
  // Retry the lookup
  return AuthDB.getByEmail(email)!;
}

/* ─────────────── Provider ─────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(Session.get());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(() => setUser(Session.get()), []);

  useEffect(() => {
    // Seed demo data once
    seedDemoData();

    // FIX 3: onAuthStateChanged now restores BOTH email AND OAuth sessions
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        // Firebase has an active session — make sure local DB is in sync
        const email = (fbUser.email ?? "").toLowerCase().trim();
        const existing = AuthDB.getByEmail(email);

        if (existing) {
          // Sync email-verified status from Firebase → local DB
          if (fbUser.emailVerified && !existing.emailVerified) {
            AuthDB.verifyEmail(existing.id);
          }
          const fresh = AuthDB.getById(existing.id) ?? existing;
          const remembered = Session.isRemembered();
          Session.set(fresh, remembered);
          setUser(fresh);
        }
        // If no local record exists, we don't auto-create here —
        // that only happens when the user explicitly logs in below,
        // so we don't silently assign a role.
      } else {
        // Firebase signed out — clear local session
        Session.clear();
        setUser(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  /* ── Email / password login ──
   *
   * FIX 2: If the user was created in Firebase Console (no local record),
   * we auto-create their local profile so login succeeds.
   * FIX 5: rememberMe is now forwarded correctly.
   */
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

      // Ensure local record exists (handles Firebase-Console-created users)
      const localUser = ensureLocalUser(fbUser);

      Session.set(localUser, rememberMe); // FIX 5: rememberMe actually used
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

      // Save to local DB
      const result = AuthDB.register(data);
      if (!result.ok) return result;

      // Sign out after register so user goes through login + email verification
      await signOut(auth);
      return { ok: true, user: result.user };
    },
    [],
  );

  /* ── Google sign-in ──
   *
   * FIX 4: If the user already has a local email account, we link the
   * OAuth provider to it rather than failing or creating a duplicate.
   */
  const loginWithGoogle = useCallback(
    async (role: UserRole): Promise<AuthResult> => {
      try {
        const cred = await signInWithRedirect(auth, googleProvider);
        const localUser = ensureLocalUser(cred, role, "google");
        Session.set(localUser);
        setUser(localUser);
        return { ok: true, user: localUser };
      } catch (err: any) {
        return { ok: false, msg: firebaseMsg(err.code) };
      }
    },
    [],
  );

  /* ── Apple sign-in ── */
  const loginWithApple = useCallback(
    async (role: UserRole): Promise<AuthResult> => {
      try {
        const cred = await signInWithRedirect(auth, appleProvider);
        const localUser = ensureLocalUser(cred, role, "apple");
        Session.set(localUser);
        setUser(localUser);
        return { ok: true, user: localUser };
      } catch (err: any) {
        return { ok: false, msg: firebaseMsg(err.code) };
      }
    },
    [],
  );

  /* ── Forgot password ──
   * Firebase sends the reset email — no backend needed.
   * Customise the email template at:
   * Firebase Console → Authentication → Templates → Password reset
   */
  const forgotPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      try {
        await sendPasswordResetEmail(auth, email);
        AuthDB.forgotPassword(email); // local DB sync
        return { ok: true };
      } catch (err: any) {
        if (err.code === "auth/user-not-found") return { ok: true }; // don't expose
        return { ok: false, msg: firebaseMsg(err.code) };
      }
    },
    [],
  );

  /* ── Logout ── */
  const logout = useCallback(async () => {
    await signOut(auth);
    Session.clear();
    setUser(null);
  }, []);

  /* ── Update local user ── */
  const updateUser = useCallback(
    (data: Partial<User>) => {
      if (!user) return;
      const updated = AuthDB.update(user.id, data);
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
