import React from "react";

const MeetFounderSection: React.FC = () => {
  return (
    <section
      id="meet-founder"
      className="py-20 bg-gradient-to-r from-gray-900 via-gray-800 to-black relative z-10"
    >
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Founder Image */}
        <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500">
          <img
            src="/assets/images/barber11.png" // replace with Daniel's picture
            alt="Founder Daniel"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text Content */}
        <div className="text-left space-y-6">
          <h3 className="text-4xl font-extrabold text-white drop-shadow-lg">
            Meet <span className="text-yellow-600">The Founder</span>
          </h3>
          <h4 className="text-2xl font-semibold text-yellow-500">
            Daniel — Senior Barber
          </h4>
          <p className="text-gray-300 text-lg leading-relaxed">
            With over <span className="text-yellow-400 font-bold">20 years of experience</span>, 
            Daniel has mastered the art of grooming. His journey began with a passion 
            for precision and style, and today he leads BarberBook with a vision of 
            excellence and elegance. Every cut, every detail, reflects his dedication 
            to timeless craftsmanship and modern artistry.
          </p>
          <p className="text-gray-400 italic">
            “A great haircut is more than style — it’s confidence, character, and class.”
          </p>
        </div>
      </div>
    </section>
  );
};

export default MeetFounderSection;
