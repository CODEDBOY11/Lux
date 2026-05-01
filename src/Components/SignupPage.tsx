import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { EyeIcon, EyeSlashIcon, CheckIcon } from "@heroicons/react/24/outline";

type Role = "host" | "guest";

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

const BG_IMAGE =
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80";

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

const SignupPage = ({
  onNavigateToLogin,
}: {
  onNavigateToLogin?: () => void;
}) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("host");
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

    const res = await register({
      role,
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
          <h2 className="font-['Cormorant Garamond'] text-3xl text-[#f5f0e8] mb-3">
            Welcome to Zola Bekker
          </h2>
          <p className="text-sm text-[rgba(245,240,232,0.45)] leading-relaxed mb-7">
            {role === "host"
              ? "Your host account has been created. We're reviewing your property details — expect an onboarding email within 24 hours."
              : "Your guest account is ready. You can now browse and book luxury stays."}
          </p>
          <button
            onClick={() => {
              if (onNavigateToLogin) {
                onNavigateToLogin();
              } else {
                navigate("/login");
              }
            }}
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
      {/* LEFT PANEL */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${BG_IMAGE}')`, opacity: 0.35 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(14,13,11,0.7)] via-[rgba(14,13,11,0.4)] to-[rgba(14,13,11,0.85)]" />
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-5 h-5 bg-[#C9A96E] rotate-45 rounded-sm" />
          <span className="font-['Cormorant Garamond'] text-xl tracking-wide text-[#f5f0e8]">
            Zola Bekker
          </span>
        </div>
        <div className="relative z-10">
          <blockquote className="font-['Cormorant Garamond'] text-[28px] italic leading-snug text-[#f5f0e8] mb-5">
            "Your property deserves a stage worthy of its elegance."
          </blockquote>
          <cite className="text-xs text-[rgba(245,240,232,0.45)] uppercase tracking-widest not-italic">
            — The Zola Bekker Host Promise
          </cite>
          <div className="flex gap-8 mt-10">
            {[
              ["12K+", "Active Hosts"],
              ["98%", "Satisfaction"],
              ["$4.2M", "Paid Out Monthly"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-['Cormorant Garamond'] text-[32px] text-[#C9A96E] leading-none">
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
          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${i === 0 ? "w-6 bg-[#C9A96E]" : i === 1 && role === "host" ? "w-2 bg-[#C9A96E] opacity-60" : "w-2 bg-[rgba(245,240,232,0.1)]"}`}
              />
            ))}
          </div>

          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#C9A96E] mb-2.5">
              Create Account
            </p>
            <h1 className="font-['Cormorant Garamond'] text-4xl text-[#f5f0e8] leading-tight">
              Join Zola Bekker
            </h1>
            <p className="text-sm text-[rgba(245,240,232,0.45)] mt-2 leading-relaxed">
              Choose how you'd like to get started on the platform.
            </p>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-2 gap-3 mb-7">
            {(
              [
                [
                  "guest",
                  "🌿",
                  "Continue as Guest",
                  "Browse & book luxury stays without hosting",
                ],
                [
                  "host",
                  "🏛",
                  "Register as Host",
                  "List your property & earn with Zola Bekker",
                ],
              ] as const
            ).map(([r, icon, label, desc]) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 overflow-hidden group ${role === r ? "border-[#C9A96E]" : "border-[rgba(245,240,232,0.08)] hover:border-[rgba(201,169,110,0.2)]"}`}
                style={{ background: "#252220" }}
              >
                {role === r && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[rgba(201,169,110,0.12)] to-transparent pointer-events-none" />
                )}
                <div
                  className={`absolute top-2.5 right-2.5 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${role === r ? "bg-[#C9A96E] border-[#C9A96E]" : "border-[rgba(245,240,232,0.2)]"}`}
                >
                  {role === r && (
                    <CheckIcon className="w-2.5 h-2.5 text-[#0e0d0b]" />
                  )}
                </div>
                <div className="text-xl mb-2">{icon}</div>
                <div className="text-sm font-medium text-[#f5f0e8] mb-1">
                  {label}
                </div>
                <div className="text-[11px] text-[rgba(245,240,232,0.4)] leading-relaxed">
                  {desc}
                </div>
              </button>
            ))}
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
          <div
            className={`overflow-hidden transition-all duration-400 ${role === "host" ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}
          >
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
                  placeholder="France"
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
                  placeholder="+33 6 12 34 56"
                  className="w-full bg-[#252220] border border-[rgba(245,240,232,0.08)] rounded-xl px-4 py-3 text-sm text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.2)] outline-none focus:border-[#C9A96E] transition-all"
                />
              </div>
            </div>
          </div>

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
                href="#"
                className="text-[#C9A96E] underline underline-offset-2"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
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
              `Create ${role === "host" ? "Host" : "Guest"} Account →`
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
              onClick={onNavigateToLogin}
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
