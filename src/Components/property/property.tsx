import {
  FaStar,
  FaHeart,
  FaArrowRight,
  FaBed,
  FaBath,
  FaWifi,
  FaMountain,
  FaCity,
} from "react-icons/fa";
import Pool from "../../assets/pool.jpg";
const Property = () => {
  return (
    <section className="bg-[#F9FAFB] py-20 px-10">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 font-playfair">
              Featured Stays
            </h2>
            <p className="mt-1 text-gray-500 font-inter">
              Handpicked luxury spaces for you
            </p>
          </div>
          <a
            href="#"
            className="flex items-center gap-2 text-[#C9A96E] font-medium hover:underline"
          >
            View All <FaArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {/* CARD 1 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300">
            {/* IMAGE */}
            <div className="relative">
              <img
                src={Pool}
                alt="Luxury Beach Villa"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/50"></div>

              {/* TOP BADGE */}
              <div className="absolute top-3 left-3 bg-[#C9A96E] text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 h-8">
                <FaStar className="w-4 h-4" /> Top Rated
              </div>

              {/* HEART ICON */}
              <div className="absolute top-3 right-3 bg-white/80 backdrop-blur p-2 rounded-full cursor-pointer">
                <FaHeart className="text-[#C9A96E] w-4 h-4" />
              </div>
            </div>

            {/* CONTENT */}
            <div className="p-4">
              {/* TITLE */}
              <h3 className="text-base font-semibold text-gray-900">
                Luxury Beach Villa
              </h3>

              {/* LOCATION */}
              <p className="text-xs text-gray-500 mt-1">Lagos, Nigeria</p>

              {/* PRICE */}
              <p className="mt-3 text-sm font-semibold text-gray-900">
                ₦ 120,000{" "}
                <span className="text-gray-400 font-normal">/ night</span>
              </p>

              {/* AMENITIES */}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FaBed className="w-4 h-4" /> 2 beds
                </span>
                <span className="flex items-center gap-1">
                  <FaBath className="w-4 h-4" /> 2 baths
                </span>
                <span className="flex items-center gap-1">
                  <FaWifi className="w-4 h-4" /> WiFi
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300">
            {/* IMAGE */}
            <div className="relative">
              <img
                src={Pool}
                alt="Mountain Cabin"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/50"></div>

              {/* TOP BADGE */}
              <div className="absolute top-3 left-3 bg-[#C9A96E] text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 h-8">
                <FaStar className="w-4 h-4" /> Top Rated
              </div>

              {/* HEART ICON */}
              <div className="absolute top-3 right-3 bg-white/80 backdrop-blur p-2 rounded-full cursor-pointer">
                <FaHeart className="text-[#C9A96E] w-4 h-4" />
              </div>
            </div>

            {/* CONTENT */}
            <div className="p-4">
              {/* TITLE */}
              <h3 className="text-base font-semibold text-gray-900">
                Mountain Cabin
              </h3>

              {/* LOCATION */}
              <p className="text-xs text-gray-500 mt-1">Abuja, Nigeria</p>

              {/* PRICE */}
              <p className="mt-3 text-sm font-semibold text-gray-900">
                ₦ 95,000{" "}
                <span className="text-gray-400 font-normal">/ night</span>
              </p>

              {/* AMENITIES */}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FaBed className="w-4 h-4" /> 1 bed
                </span>
                <span className="flex items-center gap-1">
                  <FaBath className="w-4 h-4" /> 1 bath
                </span>
                <span className="flex items-center gap-1">
                  <FaMountain className="w-4 h-4" /> Mountain View
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300">
            {/* IMAGE */}
            <div className="relative">
              <img
                src={Pool}
                alt="City Apartment"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/50"></div>

              {/* TOP BADGE */}
              <div className="absolute top-3 left-3 bg-[#C9A96E] text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 h-8">
                <FaStar className="w-4 h-4" /> Top Rated
              </div>

              {/* HEART ICON */}
              <div className="absolute top-3 right-3 bg-white/80 backdrop-blur p-2 rounded-full cursor-pointer">
                <FaHeart className="text-[#C9A96E] w-4 h-4" />
              </div>
            </div>

            {/* CONTENT */}
            <div className="p-4">
              {/* TITLE */}
              <h3 className="text-base font-semibold text-gray-900">
                City Apartment
              </h3>

              {/* LOCATION */}
              <p className="text-xs text-gray-500 mt-1">
                Port Harcourt, Nigeria
              </p>

              {/* PRICE */}
              <p className="mt-3 text-sm font-semibold text-gray-900">
                ₦ 80,000{" "}
                <span className="text-gray-400 font-normal">/ night</span>
              </p>

              {/* AMENITIES */}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FaBed className="w-4 h-4" /> 3 beds
                </span>
                <span className="flex items-center gap-1">
                  <FaBath className="w-4 h-4" /> 2 baths
                </span>
                <span className="flex items-center gap-1">
                  <FaCity className="w-4 h-4" /> City Center
                </span>
              </div>
            </div>
          </div>

          {/* COPY CARD 5 MORE TIMES */}
        </div>
      </div>
    </section>
  );
};

export default Property;
