import React from "react";

const LocationSection: React.FC = () => {
  return (
    <section
      id="location"
      className="py-16 bg-gradient-to-r from-gray-900 via-gray-800 to-black relative z-10"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Title */}
        <h3 className="text-4xl font-extrabold mb-10 text-center text-white drop-shadow-lg">
          Find <span className="text-yellow-600">Us</span>
        </h3>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
          {/* Address Card */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl shadow-lg p-8 text-left border border-white/20 flex flex-col justify-center hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
            <h4 className="text-3xl font-semibold text-yellow-500 mb-4">
              Get in Touch
            </h4>
            <p className="text-gray-300 mb-2">📍 Morning Star Mall</p>
            <p className="text-gray-300 mb-2">Addis Ababa, Ethiopia</p>
            <p className="text-gray-300 mb-2">Open: Mon – Sat, 9 AM – 8 PM</p>
            <p className="text-gray-300 mb-6">Phone: +251 900 000 000</p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="tel:+251900000000"
                className="flex-1 text-center bg-yellow-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-yellow-500 transition-all duration-300"
              >
                📞 Call Us
              </a>
              <a
                href="https://wa.me/251900000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-green-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-green-500 transition-all duration-300"
              >
                💬 Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Map Embed */}
          <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500">
            <iframe
              title="Mirror Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1785.6439331769302!2d38.78645012396633!3d8.996841328768163!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b850257a12975%3A0xe2468e96cfb05b5b!2sMorning%20Star%20Mall!5e1!3m2!1sen!2set!4v1783607472304!5m2!1sen!2set"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "300px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
