import {
  FiGlobe,
  FiFacebook,
  FiInstagram,
  FiTwitter,
  FiMail,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";

const socialLinks = [
  { icon: <FiGlobe size={14} />, label: "Website" },
  { icon: <FiFacebook size={14} />, label: "Facebook" },
  { icon: <FiInstagram size={14} />, label: "Instagram" },
  { icon: <FiTwitter size={14} />, label: "Twitter" },
];

const exploreLinks = [
  "Luxury Villas",
  "Beachfront Stays",
  "City Apartments",
  "Business Travel",
];
const companyLinks = ["About Us", "Careers", "Press", "Blog"];

const contactItems = [
  {
    icon: <FiMail size={13} />,
    label: "Email",
    value: "support@luxstay.com",
  },
  { icon: <FiPhone size={13} />, label: "Phone", value: "+234 912 140 8611" },
  { icon: <FiMapPin size={13} />, label: "Location", value: "Lagos, Nigeria" },
];

export default function Footer() {
  return (
    <footer
      className="bg-[#080808ed] text-gray-400 pt-18 pb-0 px-10"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr] gap-12 ">
          {/* Brand */}
          <div className="m-11">
            <h2
              className="text-[22px] font-semibold text-white mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Zola Bekker<span className="text-[#C9A96E]">.</span>
            </h2>
            <p className="text-[13px] text-white/45 leading-[1.85] font-light mb-6 max-w-[260px]">
              Discover handpicked luxury stays designed for comfort, elegance,
              and unforgettable experiences around the world.
            </p>
            <div className="flex gap-2.5 ">
              {socialLinks.map((s, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label={s.label}
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white/45 transition-all duration-250"
                  style={{ border: "0.5px solid rgba(255,255,255,0.12)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#C9A96E";
                    e.currentTarget.style.color = "#C9A96E";
                    e.currentTarget.style.background = "rgba(201,169,110,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.12)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div className="mt-11">
            <h3 className="text-[11px] font-medium tracking-[0.16em] uppercase text-[#C9A96E] mb-5">
              Explore
            </h3>
            <ul className="flex flex-col gap-[11px]">
              {exploreLinks.map((link, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="text-[13px] text-white/45 font-light hover:text-white transition-colors duration-200 no-underline"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="mt-11">
            <h3 className="text-[11px] font-medium tracking-[0.16em] uppercase text-[#C9A96E] mb-5">
              Company
            </h3>
            <ul className="flex flex-col gap-[11px]">
              {companyLinks.map((link, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="text-[13px] text-white/45 font-light hover:text-white transition-colors duration-200 no-underline"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="mt-11">
            <h3 className="text-[11px] font-medium tracking-[0.16em] uppercase text-[#C9A96E] mb-5">
              Contact
            </h3>
            <ul className="flex flex-col gap-[14px]">
              {contactItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div
                    className="w-[30px] h-[30px] rounded-lg flex items-center justify-center flex-shrink-0 text-[#C9A96E]"
                    style={{
                      background: "rgba(201,169,110,0.08)",
                      border: "0.5px solid rgba(201,169,110,0.2)",
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.1em] mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-[13px] text-white/55 font-light">
                      {item.value}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex items-center justify-between mt-14 py-5"
          style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-[12px] text-white/25 font-light">
            © {new Date().getFullYear()} Zola Bekker. All rights reserved.
          </p>
          <div className="flex gap-5">
            {["Privacy Policy", "Terms of Use", "Cookie Policy"].map(
              (link, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-[12px] text-white/25 font-light hover:text-white/60 transition-colors duration-200 no-underline"
                >
                  {link}
                </a>
              ),
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
