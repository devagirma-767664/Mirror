import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-br from-black via-gray-900 to-gray-950 text-gray-300 py-16 relative z-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Brand / About */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl shadow-lg p-6 transform hover:-translate-y-2 transition-all duration-300">
          <h4 className="text-2xl font-bold text-yellow-500 mb-4">BarberBook</h4>
          <p className="text-gray-400 leading-relaxed">
            Elevating grooming into an art form. Precision, style, and confidence —
            all in one place.
          </p>
        </div>

        {/* Contact Info */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl shadow-lg p-6 transform hover:-translate-y-2 transition-all duration-300">
          <h4 className="text-xl font-semibold text-yellow-500 mb-4">Contact Us</h4>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              📍 <span>Morning Star Mall, Addis Ababa, Ethiopia</span>
            </li>
            <li className="flex items-center gap-2">
              📞 <a href="tel:+251900000000" className="hover:text-yellow-400">+251 900 000 000</a>
            </li>
            <li className="flex items-center gap-2">
              💬 <a href="https://wa.me/251900000000" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400">Chat on WhatsApp</a>
            </li>
            <li className="flex items-center gap-2">
              ✉️ <a href="mailto:info@barberbook.com" className="hover:text-yellow-400">info@barberbook.com</a>
            </li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl shadow-lg p-6 transform hover:-translate-y-2 transition-all duration-300">
          <h4 className="text-xl font-semibold text-yellow-500 mb-4">Quick Links</h4>
          <ul className="space-y-3">
            <li><a href="#services" className="hover:text-yellow-400">Services</a></li>
            <li><a href="#inside-shop" className="hover:text-yellow-400">Inside Our Studio</a></li>
            <li><a href="#why-choose-us" className="hover:text-yellow-400">Why Choose Us</a></li>
            <li><a href="#location" className="hover:text-yellow-400">Find Us</a></li>
            <li><a href="/book" className="hover:text-yellow-400">Book Appointment</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-12 border-t border-gray-700 pt-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} BarberBook. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
