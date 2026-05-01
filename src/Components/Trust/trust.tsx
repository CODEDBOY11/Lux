import { FaHome, FaCreditCard, FaStar } from "react-icons/fa";

const features = [
  {
    icon: <FaHome size={22} color="#C9A96E" />,
    number: "01",
    title: "Handpicked Properties",
    text: "Carefully selected luxury stays curated for an unmatched experience.",
  },
  {
    icon: <FaCreditCard size={22} color="#C9A96E" />,
    number: "02",
    title: "Secure Payments",
    text: "Safe, reliable transactions designed to give you complete peace of mind.",
  },
  {
    icon: <FaStar size={22} color="#C9A96E" />,
    number: "03",
    title: "Trusted Reviews",
    text: "Authentic guest feedback to help you choose with confidence.",
  },
];

export default function WhyChooseUs() {
  return (
    <section
      className="bg-transparent py-20 px-10"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-5xl mx-auto text-center">
        <span className="inline-block text-[11px] font-medium tracking-[0.18em] uppercase text-[#C9A96E] mb-3">
          Our Promise
        </span>
        <h2
          className="text-4xl font-semibold text-gray-900 leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Why Choose Us
        </h2>
        <p className="mt-3 text-sm text-gray-400 font-light max-w-sm mx-auto leading-relaxed">
          Experience comfort, luxury and seamless booking — crafted for the
          discerning traveller.
        </p>
        <div className="w-10 h-[1.5px] bg-[#C9A96E] mx-auto mt-7 mb-14 rounded-full" />

        <div className="grid grid-cols-1 md:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="group flex flex-col items-center text-center px-9 py-10 relative hover:bg-[#fdfaf5] transition-colors duration-300"
              style={{
                borderRight:
                  i < features.length - 1 ? "0.5px solid #e8e0d0" : "none",
              }}
            >
              <div className="relative w-[60px] h-[60px] rounded-full border border-[#e8d8b8] bg-[#faf6ef] flex items-center justify-center mb-5 transition-all duration-300 group-hover:border-[#C9A96E] group-hover:bg-[#f5ede0]">
                {f.icon}
                <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-[#C9A96E] text-white text-[9px] font-medium flex items-center justify-center">
                  {f.number}
                </span>
              </div>
              <h3
                className="text-[19px] font-semibold text-gray-900 mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {f.title}
              </h3>
              <p className="text-[13px] text-gray-400 font-light leading-[1.75] max-w-[200px]">
                {f.text}
              </p>
              <div className="mt-4 h-px bg-[#C9A96E] w-6 opacity-0 group-hover:opacity-100 group-hover:w-9 transition-all duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
