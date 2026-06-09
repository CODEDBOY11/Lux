// src/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
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

const REDIRECT_ROLE_KEY = "zb_oauth_redirect_role";
const REDIRECT_PROVIDER_KEY = "zb_oauth_redirect_provider";

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
  loginWithGoogle: (role: UserRole) => void;
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

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

async function ensureSupabaseUser(
  fbUser: FirebaseUser,
  role: UserRole = "guest",
  provider?: "google" | "apple",
): Promise<User> {
  const email = (fbUser.email ?? "").toLowerCase().trim();

  let local = await AuthDB.getByFirebaseUid(fbUser.uid);
  if (!local) local = await AuthDB.getByEmail(email);

  if (local) {
    // Never override existing role — only patch missing fields
    const needsPatch =
      !local.firebaseUid ||
      (provider && !local.oauthProvider) ||
      (provider && !local.oauthId) ||
      (fbUser.emailVerified && !local.emailVerified);

    if (needsPatch) {
      const patch: Partial<User> = {};
      if (!local.firebaseUid) patch.firebaseUid = fbUser.uid;
      if (provider && !local.oauthProvider) patch.oauthProvider = provider;
      if (provider && !local.oauthId) patch.oauthId = fbUser.uid;
      if (fbUser.emailVerified && !local.emailVerified)
        patch.emailVerified = true;
      local = (await AuthDB.update(local.id, patch)) ?? local;
    }
    return local; // role is whatever Supabase has — admin stays admin
  }

  // Brand new user — create record
  const nameParts = (fbUser.displayName ?? "").trim().split(" ");
  const result = await AuthDB.register({
    role,
    email,
    firstName: nameParts[0] || "User",
    lastName: nameParts.slice(1).join(" ") || "",
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

  const retry = await AuthDB.getByEmail(email);
  if (!retry) throw new Error("Failed to create or find user in Supabase.");
  return retry;
}

function roleToPath(role: UserRole): string {
  if (role === "admin") return "/admin";
  if (role === "host") return "/dashboard";
  return "/account";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(Session.get());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const loginHandled = useRef(false);

  const refreshUser = useCallback(() => setUser(Session.get()), []);

  useEffect(() => {
    seedDemoData();

    // ── OAuth redirect return ──
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return;

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
        loginHandled.current = true;
        navigate(roleToPath(localUser.role), { replace: true });
      })
      .catch((err) => {
        console.error("getRedirectResult error:", err);
        localStorage.removeItem(REDIRECT_ROLE_KEY);
        localStorage.removeItem(REDIRECT_PROVIDER_KEY);
      });

    // ── Auth state observer ──
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        if (loginHandled.current) {
          loginHandled.current = false;
          setLoading(false); // ✅ already handled by login()
          return;
        }

        try {
          const existing =
            (await AuthDB.getByFirebaseUid(fbUser.uid)) ??
            (await AuthDB.getByEmail(
              (fbUser.email ?? "").toLowerCase().trim(),
            ));

          if (existing) {
            if (fbUser.emailVerified && !existing.emailVerified) {
              await AuthDB.verifyEmail(existing.id);
            }
            const remembered = Session.isRemembered();
            Session.set(existing, remembered);
            setUser(existing);
            console.log(
              "👤 onAuthStateChanged:",
              existing.email,
              "| role:",
              existing.role,
            );
          }
        } catch (err) {
          console.error("onAuthStateChanged Supabase lookup failed:", err);
        } finally {
          setLoading(false); // ✅ only set false AFTER supabase lookup completes
        }
      } else {
        Session.clear();
        setUser(null);
        setLoading(false);
      }
    });
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
      } catch (err: unknown) {
        return {
          ok: false,
          msg: firebaseMsg(
            (err as { code?: string }).code || "auth/unknown-error",
          ),
        };
      }

      const localUser = await ensureSupabaseUser(fbUser);
      Session.set(localUser, rememberMe);
      setUser(localUser);
      loginHandled.current = true;

      console.log(
        "✅ login() user:",
        localUser.email,
        "| role:",
        localUser.role,
      );
      console.log("✅ navigating to:", roleToPath(localUser.role));

      navigate(roleToPath(localUser.role), { replace: true });
      return { ok: true, user: localUser };
    },
    [navigate],
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
      } catch (err: unknown) {
        return {
          ok: false,
          msg: firebaseMsg(
            (err as { code?: string }).code || "auth/unknown-error",
          ),
        };
      }

      try {
        await sendEmailVerification(fbUser);
      } catch {
        /* best-effort */
      }

      const result = await AuthDB.register({
        ...data,
        firebaseUid: fbUser.uid,
      });
      if (!result.ok) return result;

      await signOut(auth);
      return { ok: true, user: result.user };
    },
    [],
  );

  const loginWithGoogle = useCallback((role: UserRole): void => {
    localStorage.setItem(REDIRECT_ROLE_KEY, role);
    localStorage.setItem(REDIRECT_PROVIDER_KEY, "google");
    signInWithRedirect(auth, googleProvider);
  }, []);

  const loginWithApple = useCallback((role: UserRole): void => {
    localStorage.setItem(REDIRECT_ROLE_KEY, role);
    localStorage.setItem(REDIRECT_PROVIDER_KEY, "apple");
    signInWithRedirect(auth, appleProvider);
  }, []);

  const forgotPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      try {
        await sendPasswordResetEmail(auth, email);
        await AuthDB.forgotPassword(email);
        return { ok: true };
      } catch (err: unknown) {
        if ((err as { code?: string }).code === "auth/user-not-found")
          return { ok: true };
        return {
          ok: false,
          msg: firebaseMsg(
            (err as { code?: string }).code || "auth/unknown-error",
          ),
        };
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    await signOut(auth);
    Session.clear();
    setUser(null);
    navigate("/", { replace: true });
  }, [navigate]);

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
