import React from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const InsideOurShopSection: React.FC = () => {
  return (
    <section
      id="inside-shop"
      className="py-16 bg-gradient-to-r from-gray-900 via-gray-800 to-black relative z-10"
    >
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        
        {/* Text Content */}
        <div className="text-left space-y-6">
          <h3 className="text-4xl font-extrabold text-white drop-shadow-lg">
            Inside <span className="text-yellow-600">Our Studio</span>
          </h3>
          <p className="text-gray-300 text-lg">
            Step into Mirror and experience a modern styling space designed
            for comfort and style. From comfortable styling chairs to a welcoming
            lounge, every detail reflects our commitment to quality.
          </p>
          <ul className="space-y-3 text-gray-300">
            <li>💺 Comfortable, high-end styling chairs</li>
            <li>🪞 Clean and stylish interiors</li>
            <li>✂️ Professional tools and equipment</li>
            <li>🎶 Relaxing atmosphere with music</li>
          </ul>
        </div>

        {/* Carousel Showcase */}
        <div className="rounded-xl overflow-hidden shadow-lg">
          <Carousel
            showThumbs={false}
            infiniteLoop
            autoPlay
            interval={4000}
            showStatus={false}
            className="rounded-xl"
          >
            <div>
              <img src="/assets/images/barber12.png" alt="Barber chair" />
            </div>
            <div>
              <img src="/assets/images/barber13.png" alt="Interior view" />
            </div>
            <div>
              <img src="/assets/images/barber4.png" alt="Tools and setup" />
            </div>
            <div>
              <img src="/assets/images/barber14.png" alt="Waiting lounge" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default InsideOurShopSection;
