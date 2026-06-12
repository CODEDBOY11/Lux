import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  supabase,
  AuthDB,
  Session,
  seedDemoData,
  type User,
  type UserRole,
} from "./index";

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
  loginWithGithub: (role: UserRole) => void;
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

function roleToPath(role: UserRole): string {
  if (role === "admin") return "/admin";
  if (role === "host") return "/dashboard";
  return "/account";
}

// Store pending role for OAuth sign-ups (before redirect)
const OAUTH_ROLE_KEY = "zb_oauth_role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(Session.get());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = useCallback(() => setUser(Session.get()), []);

  // ── Helper: load Supabase profile and sync session ──────────────────────
  const syncUser = useCallback(
    async (
      supabaseUser: { id: string; email?: string | null },
      rememberMe = false,
    ): Promise<User | null> => {
      try {
        // Try by id first (works for new users created via trigger)
        let profile = await AuthDB.getById(supabaseUser.id);

        // Fall back to email lookup (works for existing users with old IDs)
        if (!profile && supabaseUser.email) {
          profile = await AuthDB.getByEmail(supabaseUser.email);
        }

        if (profile) {
          Session.set(profile, rememberMe);
          setUser(profile);
          return profile;
        }
      } catch (err) {
        console.error("syncUser failed:", err);
      }
      return null;
    },
    [],
  );

  useEffect(() => {
    seedDemoData();

    // ── Listen to Supabase auth state changes ────────────────────────────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Supabase auth event:", event, session?.user?.email);

      if (session?.user) {
        const remembered = Session.isRemembered();
        const profile = await syncUser(session.user, remembered);

        if (profile) {
          const savedRole = localStorage.getItem(
            OAUTH_ROLE_KEY,
          ) as UserRole | null;
          if (savedRole && profile.role === "guest" && savedRole !== "guest") {
            const updated = await AuthDB.update(profile.id, {
              role: savedRole,
            });
            if (updated) {
              localStorage.removeItem(OAUTH_ROLE_KEY);
              Session.set(updated, remembered);
              setUser(updated);
              setLoading(false);
              navigate(roleToPath(updated.role), { replace: true });
              return;
            }
          }
          localStorage.removeItem(OAUTH_ROLE_KEY);
          setLoading(false);

          // ✅ Navigate on SIGNED_IN and INITIAL_SESSION (but not TOKEN_REFRESHED
          // to avoid re-navigating while user is already on the right page)
          if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
            const currentPath = window.location.pathname;
            const targetPath = roleToPath(profile.role);
            // Only navigate if on login/signup/callback — not if already on correct page
            if (
              currentPath === "/login" ||
              currentPath === "/signup" ||
              currentPath === "/auth/callback"
            ) {
              navigate(targetPath, { replace: true });
            }
          }
          return;
        } else {
          console.error("❌ Failed to sync user profile - logging out");
          await supabase.auth.signOut();
          Session.clear();
          setUser(null);
          setLoading(false);
          return;
        }
      } else {
        Session.clear();
        setUser(null);
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Email / password login ── */
  const login = useCallback(
    async (
      email: any,
      password: any,
      rememberMe = false,
    ): Promise<AuthResult> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        const msg = error.message.includes("Invalid login")
          ? "Invalid email or password."
          : error.message.includes("Email not confirmed")
            ? "Please verify your email before signing in."
            : error.message;
        return { ok: false, msg };
      }
      if (!data.user) return { ok: false, msg: "Sign in failed." };

      // ✅ Look up by email — works regardless of ID mismatch
      const profile = await AuthDB.getByEmail(data.user.email!);
      if (!profile)
        return { ok: false, msg: "Account not found. Please register first." };

      Session.set(profile, rememberMe);
      setUser(profile);
      return { ok: true, user: profile };
    },
    [],
  );
  /* ── Register ── */
  const register = useCallback(
    async (data: RegisterData): Promise<AuthResult> => {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered"))
          return {
            ok: false,
            msg: "An account with this email already exists.",
          };
        return { ok: false, msg: authError.message };
      }
      if (!authData.user) return { ok: false, msg: "Registration failed." };

      // 2. The trigger auto-creates a users row, but we need to update it with full details
      // Wait a moment for trigger to fire
      await new Promise((r) => setTimeout(r, 500));

      const updated = await AuthDB.update(authData.user.id, {
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company ?? "",
        country: data.country ?? "",
        phone: data.phone ?? "",
        marketingOptIn: data.marketingOptIn ?? false,
        avatar: (data.firstName[0] + (data.lastName?.[0] ?? "")).toUpperCase(),
      });

      // Sign out — user must verify email
      await supabase.auth.signOut();
      Session.clear();
      setUser(null);

      return { ok: true, user: updated ?? undefined };
    },
    [],
  );

  /* ── OAuth — Google ── */
  const loginWithGoogle = useCallback(async (role: UserRole) => {
    localStorage.setItem(OAUTH_ROLE_KEY, role);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google OAuth Error:", error);
    }
  }, []);
  /* ── OAuth — Apple ── */
  const loginWithApple = useCallback(async (role: UserRole) => {
    localStorage.setItem(OAUTH_ROLE_KEY, role);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      console.error("Apple OAuth Error:", error);
    }
  }, []);

  /* ── OAuth — GitHub ── */
  const loginWithGithub = useCallback(async (role: UserRole) => {
    localStorage.setItem(OAUTH_ROLE_KEY, role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      console.error("GitHub OAuth Error:", error);
    }
  }, []);

  /* ── Forgot password ── */
  const forgotPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) return { ok: false, msg: error.message };
      return { ok: true };
    },
    [],
  );

  /* ── Logout ── */
  const logout = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    Session.clear();
    setUser(null);
    navigate("/", { replace: true });
  }, [navigate]);

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
        loginWithGithub,
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
