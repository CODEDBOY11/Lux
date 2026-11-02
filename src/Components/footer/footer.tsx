import { Link } from "react-router-dom";

const css = `
  .eden-footer {
    --ft-bg: #0E0C0A;
    --ft-surface: #1A1714;
    --ft-border: rgba(255,255,255,0.07);
    --ft-text: rgba(255,255,255,0.85);
    --ft-muted: rgba(255,255,255,0.38);
    --ft-dim: rgba(255,255,255,0.18);
    --ft-gold: #C9A96E;
    --ft-gold-dim: rgba(201,169,110,0.10);
    --ft-gold-border: rgba(201,169,110,0.22);
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    background: var(--ft-bg);
    color: var(--ft-muted);
  }
  .ft-social-btn {
    width: 34px; height: 34px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--ft-border);
    color: var(--ft-dim);
    cursor: pointer; transition: border-color .18s, color .18s, background .18s;
    background: none; text-decoration: none; font-size: 13px;
  }
  .ft-social-btn:hover {
    border-color: var(--ft-gold);
    color: var(--ft-gold);
    background: var(--ft-gold-dim);
  }
  .ft-link {
    color: var(--ft-muted); font-size: 13px; font-weight: 300;
    text-decoration: none; transition: color .18s; display: block;
    padding: 2px 0;
  }
  .ft-link:hover { color: rgba(255,255,255,0.85); }
  .ft-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 36px;
    padding: clamp(40px, 6vw, 64px) max(20px, env(safe-area-inset-left, 0px));
    max-width: 1200px;
    margin: 0 auto;
  }
  @media (min-width: 640px) {
    .ft-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 1024px) {
    .ft-grid { grid-template-columns: 1.8fr 1fr 1fr 1.3fr; gap: 48px; }
  }
  .ft-contact-item {
    display: flex; align-items: flex-start; gap: 10px;
  }
  .ft-contact-icon {
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: var(--ft-gold-dim);
    border: 1px solid var(--ft-gold-border);
    color: var(--ft-gold); font-size: 12px;
  }
  .ft-bottom {
    border-top: 1px solid var(--ft-border);
    padding: 18px max(20px, env(safe-area-inset-left, 0px));
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
    max-width: 1200px; margin: 0 auto;
  }
  .ft-bottom-links {
    display: flex; gap: 20px; flex-wrap: wrap;
  }
  .ft-bottom-link {
    font-size: 12px; color: var(--ft-dim); font-weight: 300;
    text-decoration: none; transition: color .18s;
  }
  .ft-bottom-link:hover { color: rgba(255,255,255,0.55); }
  .ft-whatsapp-chip {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(37,211,102,0.10);
    border: 1px solid rgba(37,211,102,0.22);
    color: #25D366; border-radius: 99px;
    padding: 5px 12px; font-size: 11px; font-weight: 600;
    margin-top: 8px; text-decoration: none;
    transition: background .18s;
  }
  .ft-whatsapp-chip:hover { background: rgba(37,211,102,0.18); }
`;

const exploreLinks = [
  { label: "Luxury Villas", href: "#" },
  { label: "Beachfront Stays", href: "#" },
  { label: "City Apartments", href: "#" },
  { label: "Business Travel", href: "#" },
  { label: "Abuja Properties", href: "#" },
  { label: "Lagos Island", href: "#" },
];

const companyLinks = [
  { label: "About Us", href: "#" },
  { label: "How It Works", href: "#" },
  { label: "List a Property", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Blog", href: "#" },
];

const socialLinks = [
  { label: "Instagram", icon: "IG", href: "#" },
  { label: "X / Twitter", icon: "X", href: "#" },
  { label: "Facebook", icon: "f", href: "#" },
  { label: "TikTok", icon: "TT", href: "#" },
];

export default function Footer() {
  return (
    <footer className="eden-footer">
      <style>{css}</style>

      <div className="ft-grid">
        {/* Brand column */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <span style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,.9)",
              letterSpacing: "-.01em",
            }}>
              EDEN<span style={{ color: "#C9A96E" }}>.</span>
            </span>
          </div>
          <p style={{
            fontSize: 13, color: "var(--ft-muted)", lineHeight: 1.85,
            fontWeight: 300, maxWidth: 260, marginBottom: 20,
          }}>
            Nigeria's home for verified luxury short-lets and hotels.
            Every stay inspected. Every price in Naira. Real support when you need it.
          </p>

          {/* WhatsApp chip */}
          <a className="ft-whatsapp-chip" href="https://wa.me/2349121408611" target="_blank" rel="noreferrer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp Support
          </a>

          {/* Social icons */}
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            {socialLinks.map((s) => (
              <a key={s.label} href={s.href} className="ft-social-btn" aria-label={s.label}>
                <span style={{ fontSize: 10, fontWeight: 700 }}>{s.icon}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div>
          <h3 style={{
            fontSize: 10, fontWeight: 700, letterSpacing: ".2em",
            textTransform: "uppercase", color: "var(--ft-gold)", marginBottom: 18,
          }}>Explore</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {exploreLinks.map((l) => (
              <a key={l.label} href={l.href} className="ft-link">{l.label}</a>
            ))}
          </div>
        </div>

        {/* Company */}
        <div>
          <h3 style={{
            fontSize: 10, fontWeight: 700, letterSpacing: ".2em",
            textTransform: "uppercase", color: "var(--ft-gold)", marginBottom: 18,
          }}>Company</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {companyLinks.map((l) => (
              <a key={l.label} href={l.href} className="ft-link">{l.label}</a>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 style={{
            fontSize: 10, fontWeight: 700, letterSpacing: ".2em",
            textTransform: "uppercase", color: "var(--ft-gold)", marginBottom: 18,
          }}>Contact</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "✉", label: "Email", value: "hello@edenng.com" },
              { icon: "☎", label: "Phone", value: "+234 912 140 8611" },
              { icon: "📍", label: "Location", value: "Lagos, Nigeria" },
            ].map((item) => (
              <div key={item.label} className="ft-contact-item">
                <div className="ft-contact-icon">{item.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: 9, color: "var(--ft-dim)", textTransform: "uppercase",
                    letterSpacing: ".14em", marginBottom: 3, fontWeight: 500,
                  }}>{item.label}</p>
                  <p style={{ fontSize: 13, color: "var(--ft-muted)", fontWeight: 300 }}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}

            {/* Trust badge */}
            <div style={{
              marginTop: 8, padding: "10px 14px", borderRadius: 10,
              background: "var(--ft-gold-dim)", border: "1px solid var(--ft-gold-border)",
            }}>
              <p style={{ fontSize: 10, color: "var(--ft-gold)", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 3 }}>
                🔒 Secured by Paystack
              </p>
              <p style={{ fontSize: 11, color: "var(--ft-muted)", fontWeight: 300, lineHeight: 1.5 }}>
                All payments are protected. Your money is only released after check-in.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid var(--ft-border)" }}>
        <div className="ft-bottom">
          <p style={{ fontSize: 12, color: "var(--ft-dim)", fontWeight: 300 }}>
            © {new Date().getFullYear()} Eden. All rights reserved. Made with ♥ in Nigeria.
          </p>
          <div className="ft-bottom-links">
            <Link to="/privacy" className="ft-bottom-link">Privacy Policy</Link>
            <Link to="/terms" className="ft-bottom-link">Terms of Use</Link>
            <a href="#" className="ft-bottom-link">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}