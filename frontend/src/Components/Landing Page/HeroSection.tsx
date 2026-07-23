import React from "react";

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-32">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/assets/images/barber4.png" // replace with your picture
          alt="Barber Background"
          className="w-full h-full object-cover object-left" // focus image on left side
        />
        {/* Gradient overlay for smooth left fade */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent" />
      </div>

      {/* Content over background, aligned left */}
      <div className="relative z-10 max-w-4xl px-10 md:px-20 text-left">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight">
          Find The Best{" "}
          <span className="text-yellow-600 italic">Barber Shop</span> <br />
          <span className="text-yellow-600">For You</span>
        </h2>

        <p className="text-base md:text-lg text-gray-800 max-w-md mt-6">
          Step into elegance — where precision meets artistry. Our barbers craft
          timeless looks with modern techniques, ensuring every cut reflects
          your personality and confidence.
        </p>

        {/* Single CTA Button */}
        <div className="mt-8">
          <a
            href="/booking"
            className="bg-yellow-600 text-white px-12 py-5 rounded-lg shadow-lg hover:bg-yellow-700 transition font-semibold text-lg"
          >
            Book Appointment
          </a>
        </div>

        {/* Stats */}
        <div className="flex gap-12 mt-12 text-gray-900 font-medium">
          <div>
            <p className="text-2xl font-bold text-yellow-600">+20</p>
            <p>Years of Experience</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">+80</p>
            <p>Professional Experts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">+20K</p>
            <p>Happy Customers</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
