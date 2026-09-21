import React from "react";

interface BookingCTAProps {
  ctaText: string;
}

const BookingCTA: React.FC<BookingCTAProps> = ({ ctaText }) => {
  return (
    <section className="py-20 bg-gradient-to-br from-yellow-700 via-gray-900 to-black text-center relative z-10">
      <div className="max-w-4xl mx-auto px-6">
        <h3 className="text-3xl md:text-5xl font-extrabold mb-6 text-white drop-shadow-lg">
          Ready for a <span className="text-yellow-400">Fresh Look?</span>
        </h3>
        <p className="text-xl md:text-lg mb-10 text-gray-200">
          Book your appointment today and let our stylists give you the style you deserve.
        </p>
        <a
          href="/booking"
          className="bg-yellow-600 text-white px-12 py-5 rounded-lg shadow-lg hover:bg-yellow-500 transition font-bold tracking-wide text-lg md:text-xl"
        >
          {ctaText}
        </a>
      </div>
    </section>
  );
};

export default BookingCTA;
