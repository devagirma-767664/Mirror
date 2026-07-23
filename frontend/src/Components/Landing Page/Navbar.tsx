import React from "react";
import { GiScissors } from "react-icons/gi"; // scissors icon
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo with Icon */}
        <div className="flex items-center gap-2">
          <GiScissors className="text-yellow-600 text-3xl" />
          <h1 className="text-2xl font-serif font-bold text-yellow-600 tracking-wide">
            BarberBook
          </h1>
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex gap-8 text-gray-700 font-medium">
          <li>
            <a href="#services" className="hover:text-yellow-600 transition">
              Services
            </a>
          </li>
          <li>
            <a href="#barbers" className="hover:text-yellow-600 transition">
              Barbers
            </a>
          </li>
          <li>
            <a href="#gallery" className="hover:text-yellow-600 transition">
              Gallery
            </a>
          </li>
        </ul>

        {/* Staff Login Button */}
        <Link
          to="/login" // ✅ use Link instead of <a>
          className="bg-yellow-600 text-white px-5 py-2 rounded-lg shadow hover:bg-yellow-700 transition font-medium"
        >
          Staff Login
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
