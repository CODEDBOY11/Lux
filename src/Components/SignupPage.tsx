import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { EyeIcon, EyeSlashIcon, CheckIcon } from "@heroicons/react/24/outline";
import SEO from "../seo";

type FixedRole = "host" | "guest";

type SignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company: string;
  country: string;
  phone: string;
  terms: boolean;
};

type PasswordStrength = { score: number; label: string; color: string };

const ROLE_CONFIG: Record<
  FixedRole,
  {
    accentColor: string;
    bgImage: string;
    heading: string;
    subheading: string;
    welcomeTitle: string;
    welcomeBody: string;
    loginPath: string;
    quote: string;
    stats: [string, string][];
    seoTitle: string;
    seoUrl: string;
  }
> = {
  host: {
    accentColor: "#C9A96E",
    bgImage:
      "https://images.unsplash.com/photo-1540202404-a2f29d618464?w=900&q=80",
    heading: "Become a Host",
    subheading: "List your property and start earning with LuxStay.",
    welcomeTitle: "Welcome to LuxStay",
    welcomeBody:
      "Your host account has been created. You can now list your first property and start receiving bookings.",
    loginPath: "/host/login",
    quote: "Your property deserves a stage worthy of its elegance.",
    stats: [
      ["12K+", "Active Hosts"],
      ["98%", "Satisfaction"],
      ["90%", "Host Payout Rate"],
    ],
    seoTitle: "Become a Host",
    seoUrl: "https://lux-d1ok.vercel.app/host/signup",
  },
  guest: {
    accentColor: "#6EADC9",
    bgImage:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80",
    heading: "Create your account",
    subheading: "Browse and book verified luxury stays.",
    welcomeTitle: "Welcome to LuxStay",
    welcomeBody:
      "Your guest account is ready. You can now browse and book luxury stays.",
    loginPath: "/guest/login",
    quote: "Your next unforgettable escape is one search away.",
    stats: [
      ["12+", "Properties"],
      ["4.9★", "Avg Rating"],
      ["24/7", "Concierge"],
    ],
    seoTitle: "Create an Account",
    seoUrl: "https://lux-d1ok.vercel.app/guest/signup",
  },
};

function getStrength(pw: string): PasswordStrength {
  const checks = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ];
  const score = checks.filter(Boolean).length;
  const map: PasswordStrength[] = [
    { score: 0, label: "Enter a password", color: "transparent" },
    { score: 1, label: "Weak", color: "#e07070" },
    { score: 2, label: "Fair", color: "#e0a870" },
    { score: 3, label: "Good", color: "#d4c460" },
    { score: 4, label: "Strong", color: "#7ec8a0" },
  ];
  return map[score];
}

const SignupPage = ({ fixedRole }: { fixedRole: FixedRole }) => {
  const config = ROLE_CONFIG[fixedRole];
  const { register, loginWithGoogle, loginWithApple } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<SignupForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    company: "",
    country: "",
    phone: "",
    terms: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupForm, string>>
  >({});
  const [errorMessage, setErrorMessage] = useState("");

  const strength = getStrength(form.password);
  const pwReqs = [
    { id: "len", label: "8+ characters", met: form.password.length >= 8 },
    {
      id: "upper",
      label: "Uppercase letter",
      met: /[A-Z]/.test(form.password),
    },
    { id: "num", label: "Number", met: /[0-9]/.test(form.password) },
    { id: "sym", label: "Symbol", met: /[^A-Za-z0-9]/.test(form.password) },
  ];

  const validate = (): boolean => {
    const e: Partial<Record<keyof SignupForm, string>> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid email required";
    if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (!form.terms) e.terms = "You must agree to the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrorMessage("");

    // fixedRole is always "host" or "guest" here — admin accounts are never
    // created through this form, only via direct SQL by a platform operator.
    const res = await register({
      role: fixedRole,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      company: form.company,
      country: form.country,
      phone: form.phone,
    });

    setLoading(false);
    if (!res.ok) {
      setErrorMessage(res.msg || "Unable to create account. Please try again.");
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#0e0d0b] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[rgba(126,200,160,0.12)] border border-[rgba(126,200,160,0.3)] flex items-center justify-center mx-auto mb-5">
            <CheckIcon className="w-7 h-7 text-[#7ec8a0]" />
          </div>
          <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#f5f0e8] mb-3">
            {config.welcomeTitle}
          </h2>
          <p className="text-sm text-[rgba(245,240,232,0.45)] leading-relaxed mb-7">
            {config.welcomeBody}
          </p>
          <button
            onClick={() => navigate(config.loginPath)}
            className="w-full bg-[#C9A96E] text-[#0e0d0b] font-medium py-3.5 rounded-xl text-sm hover:bg-[#dfc08a] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Proceed to Sign In →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0d0b] grid grid-cols-1 lg:grid-cols-2">
      <SEO title={config.seoTitle} url={config.seoUrl} />

      {/* LEFT PANEL */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${config.bgImage}')`, opacity: 0.35 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(14,13,11,0.7)] via-[rgba(14,13,11,0.4)] to-[rgba(14,13,11,0.85)]" />
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-5 h-5 bg-[#C9A96E] rotate-45 rounded-sm" />
          <span className="font-['Cormorant_Garamond'] text-xl tracking-wide text-[#f5f0e8]">
            LuxStay
          </span>
        </div>
        <div className="relative z-10">
          <blockquote className="font-['Cormorant_Garamond'] text-[28px] italic leading-snug text-[#f5f0e8] mb-5">
            "{config.quote}"
          </blockquote>
          <cite className="text-xs text-[rgba(245,240,232,0.45)] uppercase tracking-widest not-italic">
            — LuxStay {fixedRole === "host" ? "Host Promise" : "Guest Network"}
          </cite>
          <div className="flex gap-8 mt-10">
            {config.stats.map(([n, l]) => (
              <div key={l}>
                <div
                  className="font-['Cormorant_Garamond'] text-[32px] leading-none"
                  style={{ color: config.accentColor }}
                >
                  {n}
                </div>
                <div className="text-[11px] text-[rgba(245,240,232,0.45)] mt-1 uppercase tracking-wider">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="bg-[#1e1c18] flex flex-col justify-center items-center px-6 py-12 lg:px-10 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[rgba(201,169,110,0.05)] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="mb-8">
            <p
              className="text-[11px] uppercase tracking-[0.18em] mb-2.5"
              style={{ color: config.accentColor }}
            >
              {fixedRole === "host" ? "Host Sign Up" : "Create Account"}
            </p>
            <h1 className="font-['Cormorant_Garamond'] text-4xl text-[#f5f0e8] leading-tight">
              {config.heading}
            </h1>
            <p className="text-sm text-[rgba(245,240,232,0.45)] mt-2 leading-relaxed">
              {config.subheading}
            </p>
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {(["firstName", "lastName"] as const).map((key) => (
              <div key={key}>
                <label className="block text-[11px] uppercase tracking-[0.12em] text-[rgba(245,240,232,0.45)] mb-2">
                  {key === "firstName" ? "First Name" : "Last Name"}
                </label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  placeholder={key === "firstName" ? "Isabelle" : "Fontaine"}
                  className={`w-full bg-[#252220] border rounded-xl px-4 py-3 text-sm text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.2)] outline-none transition-all focus:border-[#C9A96E] focus:shadow-[0_0_0_3px_rgba(201,169,110,0.08)] ${errors[key] ? "border-[#e07070]" : "border-[rgba(245,240,232,0.08)]"}`}
                />
                {errors[key] && (
                  <p className="text-[11px] text-[#e07070] mt-1">
                    {errors[key]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-[11px] uppercase tracking-[0.12em] text-[rgba(245,240,232,0.45)] mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="your@email.com"
              className={`w-full bg-[#252220] border rounded-xl px-4 py-3 text-sm text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.2)] outline-none transition-all focus:border-[#C9A96E] focus:shadow-[0_0_0_3px_rgba(201,169,110,0.08)] ${errors.email ? "border-[#e07070]" : "border-[rgba(245,240,232,0.08)]"}`}
            />
            {errors.email && (
              <p className="text-[11px] text-[#e07070] mt-1">{errors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-[11px] uppercase tracking-[0.12em] text-[rgba(245,240,232,0.45)] mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="Min. 8 characters"
                className={`w-full bg-[#252220] border rounded-xl px-4 py-3 pr-14 text-sm text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.2)] outline-none transition-all focus:border-[#C9A96E] ${errors.password ? "border-[#e07070]" : "border-[rgba(245,240,232,0.08)]"}`}
              />
              <button
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgba(245,240,232,0.4)] hover:text-[rgba(245,240,232,0.7)] transition-colors"
              >
                {showPw ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            {form.password.length > 0 && (
              <div className="mt-2">
                <div className="h-0.5 bg-[rgba(245,240,232,0.08)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${strength.score * 25}%`,
                      background: strength.color,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {pwReqs.map((req) => (
                      <div
                        key={req.id}
                        className={`flex items-center gap-1.5 text-[11px] transition-colors ${req.met ? "text-[#7ec8a0]" : "text-[rgba(245,240,232,0.3)]"}`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        {req.label}
                      </div>
                    ))}
                  </div>
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: strength.color }}
                  >
                    {strength.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Host-only fields */}
          {fixedRole === "host" && (
            <>
              <div className="mb-4">
                <label className="block text-[11px] uppercase tracking-[0.12em] text-[rgba(245,240,232,0.45)] mb-2">
                  Property / Company Name
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, company: e.target.value }))
                  }
                  placeholder="e.g. Villa Soleil, Azure Residences"
                  className="w-full bg-[#252220] border border-[rgba(245,240,232,0.08)] rounded-xl px-4 py-3 text-sm text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.2)] outline-none focus:border-[#C9A96E] transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.12em] text-[rgba(245,240,232,0.45)] mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, country: e.target.value }))
                    }
                    placeholder="Nigeria"
                    className="w-full bg-[#252220] border border-[rgba(245,240,232,0.08)] rounded-xl px-4 py-3 text-sm text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.2)] outline-none focus:border-[#C9A96E] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.12em] text-[rgba(245,240,232,0.45)] mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="+234 8XX XXX XXXX"
                    className="w-full bg-[#252220] border border-[rgba(245,240,232,0.08)] rounded-xl px-4 py-3 text-sm text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.2)] outline-none focus:border-[#C9A96E] transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* Terms */}
          <div className="flex items-start gap-3 mb-5">
            <button
              onClick={() => setForm((f) => ({ ...f, terms: !f.terms }))}
              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${form.terms ? "bg-[#C9A96E] border-[#C9A96E]" : "border-[rgba(245,240,232,0.2)] bg-transparent"}`}
            >
              {form.terms && (
                <CheckIcon className="w-2.5 h-2.5 text-[#0e0d0b]" />
              )}
            </button>
            <p className="text-xs text-[rgba(245,240,232,0.4)] leading-relaxed">
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C9A96E] underline underline-offset-2"
              >
                Terms of Use
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C9A96E] underline underline-offset-2"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
          {errors.terms && (
            <p className="text-[11px] text-[#e07070] -mt-3 mb-3">
              {errors.terms}
            </p>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[rgba(245,240,232,0.06)]" />
            <span className="text-[11px] text-[rgba(245,240,232,0.2)] uppercase tracking-wider">
              or sign up with
            </span>
            <div className="flex-1 h-px bg-[rgba(245,240,232,0.06)]" />
          </div>

          {/* Google + Apple */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setLoading(true);
                loginWithGoogle(fixedRole);
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
              onClick={() => {
                setLoading(true);
                loginWithApple(fixedRole);
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

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#C9A96E] disabled:opacity-50 text-[#0e0d0b] font-medium py-3.5 rounded-xl text-sm hover:bg-[#dfc08a] transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_8px_24px_rgba(201,169,110,0.3)] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[rgba(0,0,0,0.2)] border-t-[#0e0d0b] rounded-full animate-spin" />{" "}
                Creating account…
              </>
            ) : (
              `Create ${fixedRole === "host" ? "Host" : "Guest"} Account →`
            )}
          </button>
          {errorMessage && (
            <p className="text-[12px] text-[#e07070] mt-3 text-center">
              {errorMessage}
            </p>
          )}

          <p className="text-center text-sm text-[rgba(245,240,232,0.4)] mt-5">
            Already have an account?{" "}
            <button
              onClick={() => navigate(config.loginPath)}
              className="text-[#C9A96E] underline underline-offset-2 hover:text-[#dfc08a] transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
