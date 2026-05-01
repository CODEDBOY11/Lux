// src/AuthContext.tsx
// Full Firebase-wired auth context.
// Covers: email/password login, Google, Apple, forgot password,
//         email verification, remember me, role enforcement, session sync.

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
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider, appleProvider } from "../src/Firebase";
import { AuthDB, Session, type User, type UserRole } from "./index";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */

type AuthResult = { ok: boolean; msg?: string; user?: User };

interface AuthContextValue {
  /** The currently logged-in local user (null if not signed in) */
  user: User | null;
  /** True while Firebase is still resolving the initial auth state */
  loading: boolean;
  updateUser: (data: Partial<User>) => void;
  // ── Email / password ──
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;

  // ── Social ──
  loginWithGoogle: (role: UserRole) => Promise<AuthResult>;
  loginWithApple: (role: UserRole) => Promise<AuthResult>;

  // ── Password reset ──
  forgotPassword: (email: string) => Promise<AuthResult>;

  // ── Session ──
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

/* ─────────────────────────────────────────────────────────────────────────────
   Context
───────────────────────────────────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Helper — map Firebase error codes to readable messages
───────────────────────────────────────────────────────────────────────────── */

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
      "Popup was blocked by your browser. Please allow popups for this site.",
    "auth/cancelled-popup-request": "Sign-in was cancelled.",
    "auth/network-request-failed":
      "Network error. Check your connection and try again.",
    "auth/user-disabled": "This account has been disabled.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}

/* ─────────────────────────────────────────────────────────────────────────────
   Helper — sync a Firebase user profile into the local AuthDB
   (upsert on every OAuth sign-in so profile stays fresh)
───────────────────────────────────────────────────────────────────────────── */

function syncOAuthUser(
  fbUser: FirebaseUser,
  provider: "google" | "apple",
  role: UserRole,
): AuthResult {
  const [firstName, ...rest] = (fbUser.displayName ?? "User").split(" ");
  const lastName = rest.join(" ") || "";

  const result = AuthDB.loginWithOAuth({
    provider,
    oauthId: fbUser.uid,
    email: fbUser.email ?? "",
    firstName,
    lastName,
    role,
    avatar: fbUser.photoURL ?? undefined,
  });

  return result;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Provider
───────────────────────────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(Session.get());
  const [loading, setLoading] = useState(true);

  // Keep local user in sync whenever the session changes
  const refreshUser = useCallback(() => {
    setUser(Session.get());
  }, []);

  // Firebase auth state observer — runs once on mount
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        // Firebase says signed out — clear local session too
        const sessionUser = Session.get();
        if (sessionUser?.oauthProvider) {
          // Only clear if it was an OAuth session; email sessions managed manually
          Session.clear();
          setUser(null);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  /* ── Email / password login ── */
  const login = useCallback(
    async (
      email: string,
      password: string,
      rememberMe = false,
    ): Promise<AuthResult> => {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        return { ok: false, msg: firebaseMsg(err.code) };
      }

      // Pull the local profile (created during register)
      const localUser = AuthDB.getByEmail(email);
      if (!localUser) {
        return {
          ok: false,
          msg: "Account not found in local database. Please register.",
        };
      }

      Session.set(localUser, rememberMe);
      setUser(localUser);
      return { ok: true, user: localUser };
    },
    [],
  );

  /* ── Register ── */
  const register = useCallback(
    async (data: RegisterData): Promise<AuthResult> => {
      // 1. Create Firebase user (handles duplicate email, weak password, etc.)
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

      // 2. Send verification email (non-blocking — don't fail if it errors)
      try {
        await sendEmailVerification(fbUser);
      } catch {
        // best-effort
      }

      // 3. Save to local DB
      const result = AuthDB.register(data);
      if (!result.ok) {
        // Shouldn't happen if Firebase succeeded, but handle gracefully
        return result;
      }

      return { ok: true, user: result.user };
    },
    [],
  );

  /* ── Google sign-in ── */
  const loginWithGoogle = useCallback(
    async (role: UserRole): Promise<AuthResult> => {
      try {
        const cred = await signInWithPopup(auth, googleProvider);
        const result = syncOAuthUser(cred.user, "google", role);
        if (result.ok && result.user) {
          Session.set(result.user);
          setUser(result.user);
        }
        return result;
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
        const cred = await signInWithPopup(auth, appleProvider);
        const result = syncOAuthUser(cred.user, "apple", role);
        if (result.ok && result.user) {
          Session.set(result.user);
          setUser(result.user);
        }
        return result;
      } catch (err: any) {
        return { ok: false, msg: firebaseMsg(err.code) };
      }
    },
    [],
  );

  /* ── Forgot password ── */
  const forgotPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      try {
        await sendPasswordResetEmail(auth, email);
        // Also update local DB token for consistency
        AuthDB.forgotPassword(email);
        return { ok: true };
      } catch (err: any) {
        // Don't expose whether the email exists — show generic success
        if (err.code === "auth/user-not-found") return { ok: true };
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
        updateUser: (data: Partial<User>) => {
          if (!user) return;
          const updated = { ...user, ...data };
          AuthDB.update(user.id, data);
          Session.set(updated, Session.isRemembered());
          setUser(updated);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ProtectedRoute — Enforce authentication and role requirements
───────────────────────────────────────────────────────────────────────────── */

interface ProtectedRouteProps {
  children: ReactNode;
  role?: UserRole; // "host" | "guest" — if set, user must match
  fallback?: ReactNode; // Shown if not authenticated or wrong role
}

export function ProtectedRoute({
  children,
  role,
  fallback = null,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return fallback;
  }

  if (role && user.role !== role) {
    return fallback;
  }

  return <>{children}</>;
}
