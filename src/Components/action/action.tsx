import { FaArrowRight, FaStar } from "react-icons/fa";
import Action from "../../assets/action-bg.png";

const testimonials = [
  {
    initials: "SM",
    name: "Sarah M.",
    location: "Lagos, Nigeria",
    quote:
      "Absolutely amazing experience. The booking was seamless and the stay exceeded every expectation I had.",
  },
  {
    initials: "DK",
    name: "Daniel K.",
    location: "Abuja, Nigeria",
    quote:
      "Luxury at its finest. Everything was exactly as described — worth every penny.",
  },
  {
    initials: "AT",
    name: "Aisha T.",
    location: "Port Harcourt, Nigeria",
    quote:
      "Smooth process and beautiful properties. I'll be booking again without hesitation.",
  },
];

const Stars = () => (
  <div className="flex gap-1 mb-4">
    {[...Array(5)].map((_, i) => (
      <FaStar key={i} size={11} color="#C9A96E" />
    ))}
  </div>
);

export default function TestimonialsCTA() {
  return (
    <section
      className="relative py-24 px-10 overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background */}
      <img
        src={Action}
        className="absolute inset-0 w-full h-full object-cover"
        alt=""
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 to-black/75" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center text-white">
        {/* Header */}
        <span className="inline-block text-[11px] font-medium tracking-[0.18em] uppercase text-[#C9A96E] mb-3">
          Guest Experiences
        </span>
        <h2
          className="text-4xl font-semibold leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          What Our Guests Say
        </h2>
        <div className="w-10 h-[1.5px] bg-[#C9A96E] mx-auto mt-5 mb-12 rounded-full" />

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group flex flex-col justify-between text-left p-7 rounded-2xl border backdrop-blur-md transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.07)",
                borderColor: "rgba(201,169,110,0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.borderColor = "rgba(201,169,110,0.55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.borderColor = "rgba(201,169,110,0.25)";
              }}
            >
              <div>
                <Stars />
                <p className="text-[13px] text-white/80 leading-[1.8] font-light italic">
                  "{t.quote}"
                </p>
              </div>
              <div
                className="flex items-center gap-2.5 mt-5 pt-4"
                style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)" }}
              >
                <div
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-medium text-[#C9A96E] flex-shrink-0 border"
                  style={{
                    background: "rgba(201,169,110,0.2)",
                    borderColor: "rgba(201,169,110,0.4)",
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-white leading-tight">
                    {t.name}
                  </p>
                  <p className="text-[11px] text-white/45 mt-0.5">
                    {t.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20">
          <h3
            className="text-[30px] font-semibold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Ready to Find Your Perfect Stay?
          </h3>
          <p className="text-sm text-white/55 font-light mt-2">
            Start exploring luxury stays tailored just for you
          </p>
          <button className="inline-flex items-center gap-2 mt-7 bg-[#C9A96E] text-[#1a1a1a] px-8 py-3.5 rounded-full text-[13px] font-medium tracking-wide transition-transform duration-200 hover:scale-[1.04] hover:bg-[#d4b87e]">
            Get Started
            <FaArrowRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
}
