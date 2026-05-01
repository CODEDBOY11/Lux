import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  UserIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

type LoginRole = "host" | "guest";
type LoginView = "login" | "forgot" | "forgot-sent" | "success";

/* ─── Role config ─── */
const ROLE_CONFIG = {
  host: {
    icon: BuildingOffice2Icon,
    label: "Property Host",
    sublabel: "Manage your listings & reservations",
    badge: "HOST PORTAL",
    badgeColor: "#C9A96E",
    redirectPath: "/dashboard",
    welcomeMsg: "Welcome back. Redirecting to your Host Dashboard…",
    demoEmail: "host@demo.com",
    bgAccent: "from-[#2d2418] to-[#1a1510]",
    stats: [
      { val: "4.9★", label: "Avg Rating" },
      { val: "180+", label: "Countries" },
      { val: "24/7", label: "Host Support" },
    ],
    quote: "Every great stay begins with a host who truly cares.",
    bgImage:
      "https://images.unsplash.com/photo-1540202404-a2f29d618464?w=900&q=80",
  },
  guest: {
    icon: UserIcon,
    label: "Traveller",
    sublabel: "Browse & book luxury stays",
    badge: "GUEST PORTAL",
    badgeColor: "#6EADC9",
    redirectPath: "/account",
    welcomeMsg: "Welcome back. Redirecting to your bookings…",
    demoEmail: "guest@demo.com",
    bgAccent: "from-[#18242d] to-[#101518]",
    stats: [
      { val: "12+", label: "Properties" },
      { val: "4.9★", label: "Avg Rating" },
      { val: "24/7", label: "Concierge" },
    ],
    quote: "Your next unforgettable escape is one search away.",
    bgImage:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80",
  },
};

/* ─── Input component ─── */
const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] uppercase tracking-[0.12em] text-[rgba(245,240,232,0.45)] font-medium">
      {label}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1.5 text-[11px] text-[#e07070]">
        <ExclamationCircleIcon className="w-3 h-3 shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const TextInput = ({
  icon: Icon,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ElementType;
  error?: boolean;
}) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(245,240,232,0.3)]" />
    )}
    <input
      {...props}
      className={`w-full bg-[#252220] border rounded-xl py-3 text-sm text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.2)] outline-none transition-all focus:shadow-[0_0_0_3px_rgba(201,169,110,0.1)] ${Icon ? "pl-10 pr-4" : "px-4"} ${error ? "border-[#e07070] focus:border-[#e07070]" : "border-[rgba(245,240,232,0.1)] focus:border-[#C9A96E]"}`}
    />
  </div>
);

/* ─── Main Component ─── */
const LoginPage = ({
  onNavigateToSignup,
}: {
  onNavigateToSignup?: () => void;
}) => {
  const [role, setRole] = useState<LoginRole>("host");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, loginWithGoogle, loginWithApple, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<LoginView>("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  const config = ROLE_CONFIG[role];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when switching roles
  useEffect(() => {
    setErrors({});
    setErrorMessage("");
  }, [role]);

  const validate = (): boolean => {
    const e: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setErrorMessage("");
    setLoading(true);
    const res = await login(email, password, rememberMe);
    setLoading(false);
    if (!res.ok) {
      setErrorMessage(res.msg || "Invalid email or password");
      return;
    }
    const targetRole = res.user?.role;
    if (targetRole !== role) {
      setErrorMessage(
        `This account is registered as a ${targetRole === "host" ? "Host" : "Guest"}. Please switch portal.`,
      );
      return;
    }
    setView("success");
    setTimeout(() => {
      navigate(config.redirectPath);
    }, 1800);
  };

  const handleForgot = async () => {
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) return;
    setLoading(true);
    await forgotPassword(forgotEmail);
    setLoading(false);
    setView("forgot-sent");
  };

  const fillDemo = () => {
    setEmail(config.demoEmail);
    setPassword("Demo1234!");
    setErrors({});
    setErrorMessage("");
  };

  /* ── Forgot password view ── */
  const renderForgot = () => (
    <div
      className={`w-full max-w-md transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <button
        onClick={() => setView("login")}
        className="flex items-center gap-2 text-[rgba(245,240,232,0.4)] hover:text-[rgba(245,240,232,0.7)] text-sm mb-8 transition-colors group"
      >
        <ArrowRightIcon className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
        Back to sign in
      </button>

      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(201,169,110,0.12)] border border-[rgba(201,169,110,0.2)] flex items-center justify-center mb-5">
          <LockClosedIcon className="w-5 h-5 text-[#C9A96E]" />
        </div>
        <h1 className="font-['Cormorant_Garamond'] text-3xl text-[#f5f0e8] leading-tight mb-2">
          Reset your password
        </h1>
        <p className="text-sm text-[rgba(245,240,232,0.45)] leading-relaxed">
          Enter your registered email and we'll send a secure reset link within
          a few minutes.
        </p>
      </div>

      <Field label="Email Address">
        <TextInput
          type="email"
          icon={EnvelopeIcon}
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e.target.value)}
          placeholder="your@email.com"
          onKeyDown={(e) => e.key === "Enter" && handleForgot()}
        />
      </Field>

      <button
        onClick={handleForgot}
        disabled={!forgotEmail}
        className="w-full mt-5 bg-[#C9A96E] disabled:opacity-40 disabled:cursor-not-allowed text-[#0e0d0b] font-semibold py-3.5 rounded-xl text-sm hover:bg-[#dfc08a] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
      >
        Send Reset Link
        <ArrowRightIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  /* ── Forgot sent view ── */
  const renderForgotSent = () => (
    <div className="w-full max-w-md text-center">
      <div className="w-16 h-16 rounded-full bg-[rgba(126,200,160,0.1)] border border-[rgba(126,200,160,0.25)] flex items-center justify-center mx-auto mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"
            stroke="#7ec8a0"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#f5f0e8] mb-3">
        Check your inbox
      </h2>
      <p className="text-sm text-[rgba(245,240,232,0.45)] leading-relaxed mb-7">
        A password reset link was sent to{" "}
        <strong className="text-[#f5f0e8]">{forgotEmail}</strong>. Check your
        spam folder if it doesn't arrive within 5 minutes.
      </p>
      <button
        onClick={() => setView("login")}
        className="w-full bg-[#C9A96E] text-[#0e0d0b] font-semibold py-3.5 rounded-xl text-sm hover:bg-[#dfc08a] transition-all hover:scale-[1.01]"
      >
        Back to Sign In
      </button>
    </div>
  );

  /* ── Success view ── */
  const renderSuccess = () => (
    <div className="w-full max-w-md text-center">
      <div className="w-16 h-16 rounded-full bg-[rgba(126,200,160,0.1)] border border-[rgba(126,200,160,0.25)] flex items-center justify-center mx-auto mb-5">
        <CheckIcon className="w-7 h-7 text-[#7ec8a0]" />
      </div>
      <div className="inline-flex items-center gap-2 bg-[rgba(126,200,160,0.08)] border border-[rgba(126,200,160,0.2)] rounded-full px-4 py-1.5 mb-5">
        <span className="text-xs font-semibold text-[#7ec8a0] uppercase tracking-wider">
          {role === "host" ? "Host" : "Guest"} Portal
        </span>
      </div>
      <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#f5f0e8] mb-2">
        Signed in successfully
      </h2>
      <p className="text-sm text-[rgba(245,240,232,0.45)] leading-relaxed mb-6">
        {config.welcomeMsg}
      </p>
      <div className="w-full bg-[rgba(245,240,232,0.06)] rounded-full h-px mb-6 overflow-hidden">
        <div
          className="h-full bg-[#C9A96E] rounded-full"
          style={{ animation: "grow 1.8s linear forwards" }}
        />
      </div>
    </div>
  );

  /* ── Main login view ── */
  const renderLogin = () => (
    <div
      className={`w-full max-w-md transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {/* Portal switcher */}
      <div className="flex gap-2 p-1 bg-[rgba(245,240,232,0.04)] rounded-2xl mb-8 border border-[rgba(245,240,232,0.06)]">
        {(["host", "guest"] as const).map((r) => {
          const Icon = ROLE_CONFIG[r].icon;
          const isActive = role === r;
          return (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#252220] text-[#f5f0e8] shadow-sm border border-[rgba(245,240,232,0.08)]"
                  : "text-[rgba(245,240,232,0.35)] hover:text-[rgba(245,240,232,0.6)]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {ROLE_CONFIG[r].label}
              {isActive && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{
                    background:
                      r === "host"
                        ? "rgba(201,169,110,0.15)"
                        : "rgba(110,173,201,0.15)",
                    color: r === "host" ? "#C9A96E" : "#6EADC9",
                  }}
                >
                  {ROLE_CONFIG[r].badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Header */}
      <div className="mb-7">
        <p
          className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-2"
          style={{ color: role === "host" ? "#C9A96E" : "#6EADC9" }}
        >
          {config.sublabel}
        </p>
        <h1 className="font-['Cormorant_Garamond'] text-4xl text-[#f5f0e8] leading-tight">
          Welcome back
        </h1>
      </div>

      {/* Role-specific context strip */}
      <div
        className="rounded-2xl p-4 mb-6 border"
        style={{
          background:
            role === "host"
              ? "rgba(201,169,110,0.06)"
              : "rgba(110,173,201,0.06)",
          borderColor:
            role === "host"
              ? "rgba(201,169,110,0.15)"
              : "rgba(110,173,201,0.15)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background:
                role === "host"
                  ? "rgba(201,169,110,0.12)"
                  : "rgba(110,173,201,0.12)",
            }}
          >
            {role === "host" ? (
              <BuildingOffice2Icon
                className="w-4.5 h-4.5"
                style={{ color: "#C9A96E", width: 18, height: 18 }}
              />
            ) : (
              <UserIcon
                className="w-4.5 h-4.5"
                style={{ color: "#6EADC9", width: 18, height: 18 }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#f5f0e8]">
              {role === "host"
                ? "Host Dashboard Access"
                : "Guest Account Access"}
            </p>
            <p className="text-[11px] text-[rgba(245,240,232,0.4)] mt-0.5">
              {role === "host"
                ? "Manage listings, view bookings, track earnings & analytics"
                : "Browse properties, manage reservations & travel history"}
            </p>
          </div>
          <button
            onClick={fillDemo}
            className="shrink-0 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors"
            style={{
              color: role === "host" ? "#C9A96E" : "#6EADC9",
              borderColor:
                role === "host"
                  ? "rgba(201,169,110,0.25)"
                  : "rgba(110,173,201,0.25)",
              background:
                role === "host"
                  ? "rgba(201,169,110,0.06)"
                  : "rgba(110,173,201,0.06)",
            }}
          >
            USE DEMO
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <Field label="Email Address" error={errors.email}>
          <TextInput
            type="email"
            icon={EnvelopeIcon}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={
              role === "host" ? "host@yourproperty.com" : "your@email.com"
            }
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            error={!!errors.email}
          />
        </Field>

        <Field label="Password" error={errors.password}>
          <div className="relative">
            <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(245,240,232,0.3)]" />
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className={`w-full bg-[#252220] border rounded-xl pl-10 pr-12 py-3 text-sm text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.2)] outline-none transition-all focus:shadow-[0_0_0_3px_rgba(201,169,110,0.1)] ${errors.password ? "border-[#e07070]" : "border-[rgba(245,240,232,0.1)] focus:border-[#C9A96E]"}`}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgba(245,240,232,0.35)] hover:text-[rgba(245,240,232,0.65)] transition-colors"
            >
              {showPw ? (
                <EyeSlashIcon className="w-4 h-4" />
              ) : (
                <EyeIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </Field>
      </div>

      {/* Options row */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <button
          type="button"
          onClick={() => setRememberMe((r) => !r)}
          className="flex items-center gap-2.5 group"
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${rememberMe ? "border-[#C9A96E] bg-[#C9A96E]" : "border-[rgba(245,240,232,0.2)]"}`}
          >
            {rememberMe && <CheckIcon className="w-2.5 h-2.5 text-[#0e0d0b]" />}
          </div>
          <span className="text-xs text-[rgba(245,240,232,0.4)] group-hover:text-[rgba(245,240,232,0.6)] transition-colors">
            Remember me
          </span>
        </button>
        <button
          type="button"
          onClick={() => setView("forgot")}
          className="text-xs text-[rgba(245,240,232,0.4)] hover:text-[#C9A96E] transition-colors underline underline-offset-2"
        >
          Forgot password?
        </button>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-[#C9A96E] disabled:opacity-50 disabled:cursor-not-allowed text-[#0e0d0b] font-semibold py-3.5 rounded-xl text-sm hover:bg-[#dfc08a] transition-all hover:scale-[1.01] active:scale-[0.99] hover:shadow-[0_8px_24px_rgba(201,169,110,0.25)] flex items-center justify-center gap-2.5"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-[rgba(0,0,0,0.2)] border-t-[#0e0d0b] rounded-full animate-spin" />
            Authenticating…
          </>
        ) : (
          <>
            Sign In to {role === "host" ? "Host Portal" : "Guest Account"}
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </>
        )}
      </button>

      {errorMessage && (
        <div className="mt-3 flex items-start gap-2.5 bg-[rgba(224,112,112,0.08)] border border-[rgba(224,112,112,0.2)] rounded-xl p-3">
          <ExclamationCircleIcon className="w-4 h-4 text-[#e07070] shrink-0 mt-0.5" />
          <p className="text-xs text-[#e07070] leading-relaxed">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[rgba(245,240,232,0.06)]" />
        <span className="text-[11px] text-[rgba(245,240,232,0.2)] uppercase tracking-wider">
          or continue with
        </span>
        <div className="flex-1 h-px bg-[rgba(245,240,232,0.06)]" />
      </div>

      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setErrorMessage("");
            const res = await loginWithGoogle(role);
            setLoading(false);
            if (!res.ok) {
              setErrorMessage(res.msg || "Google sign-in failed.");
              return;
            }
            if (res.user?.role !== role) {
              setErrorMessage(
                `This Google account is a ${res.user?.role === "host" ? "Host" : "Guest"} account. Please switch portal.`,
              );
              return;
            }
            setView("success");
            setTimeout(() => navigate(config.redirectPath), 1800);
          }}
          className="flex items-center justify-center gap-2.5 py-3 rounded-xl border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.02)] text-sm text-[rgba(245,240,232,0.6)] hover:border-[rgba(245,240,232,0.18)] hover:bg-[rgba(245,240,232,0.05)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="15" height="15" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"
            />
            <path
              fill="#34A853"
              d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"
            />
            <path
              fill="#4A90E2"
              d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"
            />
            <path
              fill="#FBBC05"
              d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"
            />
          </svg>
          Google
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setErrorMessage("");
            const res = await loginWithApple(role);
            setLoading(false);
            if (!res.ok) {
              setErrorMessage(res.msg || "Apple sign-in failed.");
              return;
            }
            if (res.user?.role !== role) {
              setErrorMessage(
                `This Apple account is a ${res.user?.role === "host" ? "Host" : "Guest"} account. Please switch portal.`,
              );
              return;
            }
            setView("success");
            setTimeout(() => navigate(config.redirectPath), 1800);
          }}
          className="flex items-center justify-center gap-2.5 py-3 rounded-xl border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.02)] text-sm text-[rgba(245,240,232,0.6)] hover:border-[rgba(245,240,232,0.18)] hover:bg-[rgba(245,240,232,0.05)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="rgba(245,240,232,0.7)"
          >
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          Apple
        </button>
      </div>

      {/* Security notice — host only */}
      {role === "host" && (
        <div className="flex items-start gap-3 bg-[rgba(201,169,110,0.05)] border border-[rgba(201,169,110,0.12)] rounded-xl p-3.5 mb-5">
          <ShieldCheckIcon className="w-4 h-4 text-[#C9A96E] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#f5f0e8]">
              Two-Factor Authentication Available
            </p>
            <p className="text-[11px] text-[rgba(245,240,232,0.35)] mt-0.5 leading-relaxed">
              Host accounts support 2FA. Enable it from your dashboard for
              enhanced security.
            </p>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-[rgba(245,240,232,0.4)]">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onNavigateToSignup}
          className="text-[#C9A96E] underline underline-offset-2 hover:text-[#dfc08a] transition-colors"
        >
          Create one
        </button>
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0e0d0b] grid grid-cols-1 lg:grid-cols-2">
      <style>{`
        @keyframes grow { from { width: 0%; } to { width: 100%; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden transition-all duration-700">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url('${config.bgImage}')`, opacity: 0.3 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(14,13,11,0.75)] via-[rgba(14,13,11,0.4)] to-[rgba(14,13,11,0.9)]" />

        {/* Role-colored accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-500"
          style={{
            background:
              role === "host"
                ? "linear-gradient(90deg, transparent, #C9A96E, transparent)"
                : "linear-gradient(90deg, transparent, #6EADC9, transparent)",
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-[#C9A96E] rotate-45 rounded-sm" />
            <span className="font-['Cormorant_Garamond'] text-xl tracking-wide text-[#f5f0e8]">
              LuxStay
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider transition-all duration-300"
            style={{
              color: role === "host" ? "#C9A96E" : "#6EADC9",
              borderColor:
                role === "host"
                  ? "rgba(201,169,110,0.25)"
                  : "rgba(110,173,201,0.25)",
              background:
                role === "host"
                  ? "rgba(201,169,110,0.08)"
                  : "rgba(110,173,201,0.08)",
            }}
          >
            {role === "host" ? (
              <BuildingOffice2Icon style={{ width: 12, height: 12 }} />
            ) : (
              <UserIcon style={{ width: 12, height: 12 }} />
            )}
            {config.badge}
          </div>
        </div>

        <div className="relative z-10">
          <blockquote className="font-['Cormorant_Garamond'] text-[26px] italic leading-snug text-[#f5f0e8] mb-5">
            "{config.quote}"
          </blockquote>
          <cite className="text-xs text-[rgba(245,240,232,0.4)] uppercase tracking-widest not-italic">
            — LuxStay {role === "host" ? "Host Community" : "Guest Network"}
          </cite>

          <div className="flex gap-8 mt-10">
            {config.stats.map(({ val, label }) => (
              <div key={label}>
                <div
                  className="font-['Cormorant_Garamond'] text-[30px] leading-none transition-colors duration-300"
                  style={{ color: role === "host" ? "#C9A96E" : "#6EADC9" }}
                >
                  {val}
                </div>
                <div className="text-[11px] text-[rgba(245,240,232,0.4)] mt-1 uppercase tracking-wider">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="bg-[#1a1916] flex flex-col justify-center items-center px-6 py-12 lg:px-10 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[rgba(201,169,110,0.03)] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[rgba(201,169,110,0.02)] pointer-events-none" />

        <div className="relative z-10 w-full flex justify-center">
          {view === "login" && renderLogin()}
          {view === "forgot" && renderForgot()}
          {view === "forgot-sent" && renderForgotSent()}
          {view === "success" && renderSuccess()}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
