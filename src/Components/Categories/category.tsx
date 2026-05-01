import Apa from "../../assets/apartment.jpg";
import Beach from "../../assets/beach.jpg";
import pool from "../../assets/pool.jpg";

const category = () => {
  return (
    <div>
      <section className="bg-[#F9FAFB] py-20 px-10">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-[#C9A96E] font-playfair">
            Browse by Category
          </h2>

          <div className="w-64 h-px bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent mx-auto mt-2"></div>

          <p className="mt-2 text-gray-500 text-sm font-inter">
            Find the perfect stay based on your lifestyle
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
              <img src={Apa} className="w-full h-56 object-cover" />

              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60 group-hover:from-black/30 group-hover:via-black/40 group-hover:to-black/70 transition"></div>

              <div className="absolute inset-0 flex items-end justify-start p-6">
                <h3 className="text-white text-2xl font-semibold font-playfair drop-shadow-lg">
                  Luxury Villas
                </h3>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
              <img src={Beach} className="w-full h-56 object-cover" />

              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60 group-hover:from-black/30 group-hover:via-black/40 group-hover:to-black/70 transition"></div>

              <div className="absolute inset-0 flex items-end justify-start p-6">
                <h3 className="text-white text-2xl font-semibold font-playfair drop-shadow-lg">
                  Beach Front
                </h3>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
              <img src={Apa} className="w-full h-56 object-cover" />

              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60 group-hover:from-black/30 group-hover:via-black/40 group-hover:to-black/70 transition"></div>

              <div className="absolute inset-0 flex items-end justify-start p-6">
                <h3 className="text-white text-2xl font-semibold font-playfair drop-shadow-lg">
                  City Apartment
                </h3>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
              <img src={pool} className="w-full h-56 object-cover" />

              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60 group-hover:from-black/30 group-hover:via-black/40 group-hover:to-black/70 transition"></div>

              <div className="absolute inset-0 flex items-end justify-start p-6">
                <h3 className="text-white text-2xl font-semibold font-playfair drop-shadow-lg">
                  Business Travel
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default category;
