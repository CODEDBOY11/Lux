import { useState } from "react";
import {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  StarIcon,
  PhoneIcon,
  CheckBadgeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

/* ─── Token-based theming (adapts to prefers-color-scheme + data-theme) ─── */
const css = `
  .wcu-section {
    --wcu-bg: #FFFFFF;
    --wcu-surface: #F8F7F4;
    --wcu-border: #E8E4DD;
    --wcu-text: #1A1714;
    --wcu-sub: #6A6359;
    --wcu-muted: #8A8278;
    --wcu-gold: #C9A96E;
    --wcu-gold-dim: rgba(201,169,110,0.10);
    --wcu-gold-border: rgba(201,169,110,0.25);
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    .wcu-section:not([data-theme="light"]) {
      --wcu-bg: #141210;
      --wcu-surface: #1E1B18;
      --wcu-border: rgba(255,255,255,0.08);
      --wcu-text: #F0EDE8;
      --wcu-sub: #A8A09A;
      --wcu-muted: #706860;
      --wcu-gold: #C9A96E;
      --wcu-gold-dim: rgba(201,169,110,0.12);
      --wcu-gold-border: rgba(201,169,110,0.22);
      color-scheme: dark;
    }
  }
  [data-theme="dark"] .wcu-section {
    --wcu-bg: #141210;
    --wcu-surface: #1E1B18;
    --wcu-border: rgba(255,255,255,0.08);
    --wcu-text: #F0EDE8;
    --wcu-sub: #A8A09A;
    --wcu-muted: #706860;
    --wcu-gold: #C9A96E;
    --wcu-gold-dim: rgba(201,169,110,0.12);
    --wcu-gold-border: rgba(201,169,110,0.22);
    color-scheme: dark;
  }
  .wcu-card {
    background: var(--wcu-bg);
    border: 1px solid var(--wcu-border);
    border-radius: 14px;
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    transition: border-color .22s, box-shadow .22s, transform .22s;
    position: relative;
    overflow: hidden;
  }
  .wcu-card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--wcu-gold) 0%, transparent 100%);
    opacity: 0;
    transition: opacity .25s;
  }
  .wcu-card:hover {
    border-color: var(--wcu-gold-border);
    box-shadow: 0 10px 36px rgba(0,0,0,0.09);
    transform: translateY(-3px);
  }
  .wcu-card:hover::before { opacity: 1; }
  .wcu-icon-wrap {
    width: 48px; height: 48px;
    border-radius: 12px;
    background: var(--wcu-gold-dim);
    border: 1px solid var(--wcu-gold-border);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .wcu-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media (min-width: 640px) { .wcu-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .wcu-grid { grid-template-columns: repeat(3, 1fr); } }
  .wcu-divider {
    width: 28px; height: 1.5px;
    background: var(--wcu-gold);
    border-radius: 99px;
    margin: 8px auto 0;
  }
  .wcu-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: var(--wcu-gold-dim);
    border: 1px solid var(--wcu-gold-border);
    color: var(--wcu-gold);
    border-radius: 99px;
    padding: 4px 10px;
    font-size: 9px; font-weight: 700;
    letter-spacing: .18em; text-transform: uppercase;
  }
  .wcu-stat-row {
    display: flex; align-items: center; justify-content: center;
    gap: 0;
    border-top: 1px solid var(--wcu-border);
    padding-top: 40px;
    margin-top: 16px;
    flex-wrap: wrap;
  }
  .wcu-stat-item {
    flex: 1; min-width: 120px;
    text-align: center; padding: 0 20px;
    position: relative;
  }
  .wcu-stat-item:not(:last-child)::after {
    content: "";
    position: absolute;
    right: 0; top: 10%; bottom: 10%;
    width: 1px;
    background: var(--wcu-border);
  }
  @keyframes wcu-fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const features = [
  {
    icon: <CheckBadgeIcon style={{ width: 22, height: 22, color: "#C9A96E" }} />,
    title: "Every Property Verified",
    body: "Our team physically inspects and photographs every listing before it goes live. No fake photos, no unpleasant surprises on arrival.",
    badge: "100% Inspected",
  },
  {
    icon: <LockClosedIcon style={{ width: 22, height: 22, color: "#C9A96E" }} />,
    title: "Secure Paystack Payments",
    body: "Pay in Naira directly to a Paystack-secured escrow. Your money is only released to the host after check-in — zero risk of fraud.",
    badge: "Naira · No FX Fees",
  },
  {
    icon: <StarIcon style={{ width: 22, height: 22, color: "#C9A96E" }} />,
    title: "Genuine Guest Reviews",
    body: "Every review comes from a verified booking on Eden. Hosts cannot remove negative reviews — only real guests can write them.",
    badge: "Verified Stays Only",
  },
  {
    icon: <CurrencyDollarIcon style={{ width: 22, height: 22, color: "#C9A96E" }} />,
    title: "No Hidden Fees",
    body: "The price you see is the price you pay. Cleaning fees, service charges — all shown upfront before you confirm. No checkout surprises.",
    badge: "Transparent Pricing",
  },
  {
    icon: <PhoneIcon style={{ width: 22, height: 22, color: "#C9A96E" }} />,
    title: "Nigerian Support Team",
    body: "Call or WhatsApp a real person in Nigeria — not a bot, not an overseas call centre. We know Lagos traffic and local check-in nuances.",
    badge: "+234 912 140 8611",
  },
  {
    icon: <ShieldCheckIcon style={{ width: 22, height: 22, color: "#C9A96E" }} />,
    title: "Host Accountability",
    body: "Every host is ID-verified and signs our guest protection agreement. Any listing that receives sustained complaints is suspended, automatically.",
    badge: "ID-Verified Hosts",
  },
];

const stats = [
  { value: "500+", label: "Verified Properties" },
  { value: "4.9★", label: "Average Rating" },
  { value: "₦0", label: "Hidden Fees" },
  { value: "24/7", label: "Local Support" },
];

export default function WhyChooseUs() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section
      className="wcu-section"
      style={{
        background: "var(--wcu-bg)",
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        padding: "clamp(48px, 8vw, 80px) max(16px, env(safe-area-inset-left, 0px))",
      }}
    >
      <style>{css}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(36px, 6vw, 56px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 20, height: 1, background: "var(--wcu-gold)" }} />
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: ".26em",
              color: "var(--wcu-gold)", textTransform: "uppercase",
            }}>Why Eden</p>
            <div style={{ width: 20, height: 1, background: "var(--wcu-gold)" }} />
          </div>
          <h2 style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "clamp(28px, 6vw, 44px)",
            fontWeight: 500, color: "var(--wcu-text)",
            lineHeight: 1.1, letterSpacing: "-.01em",
            marginBottom: 14,
          }}>
            Built for Nigeria,<br />
            <em style={{ fontStyle: "italic", color: "var(--wcu-gold)" }}>Trusted by Nigerians</em>
          </h2>
          <div className="wcu-divider" />
          <p style={{
            color: "var(--wcu-sub)", fontSize: "clamp(13px, 2vw, 14px)",
            lineHeight: 1.75, maxWidth: 440, margin: "16px auto 0",
          }}>
            We started Eden because booking a quality short-let in Nigeria was unreliable.
            Here's exactly what we do differently.
          </p>
        </div>

        {/* Cards grid */}
        <div className="wcu-grid">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="wcu-card"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                animation: `wcu-fadeUp .45s ease ${i * 60}ms both`,
                borderColor: hovered === i ? "var(--wcu-gold-border)" : undefined,
                boxShadow: hovered === i ? "0 10px 36px rgba(0,0,0,0.09)" : undefined,
                transform: hovered === i ? "translateY(-3px)" : undefined,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div className="wcu-icon-wrap">{f.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: 18, fontWeight: 600,
                    color: "var(--wcu-text)", lineHeight: 1.2, marginBottom: 4,
                  }}>{f.title}</h3>
                  <span className="wcu-badge">{f.badge}</span>
                </div>
              </div>
              <p style={{
                color: "var(--wcu-sub)", fontSize: 13, lineHeight: 1.75,
              }}>{f.body}</p>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="wcu-stat-row">
          {stats.map((s) => (
            <div key={s.label} className="wcu-stat-item">
              <p style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 600,
                color: "var(--wcu-gold)", lineHeight: 1, marginBottom: 5,
              }}>{s.value}</p>
              <p style={{
                fontSize: 10, fontWeight: 600, letterSpacing: ".18em",
                textTransform: "uppercase", color: "var(--wcu-muted)",
              }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}