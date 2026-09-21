import React from "react";
import { Link, useParams } from "react-router-dom";

const Navbar: React.FC = () => {
  const { shopSlug } = useParams();
  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <img src="/mirror.svg" alt="" className="h-9 w-9" />
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-yellow-600 tracking-wide">
            Mirror
          </h1>
        </div>

        <ul className="hidden md:flex gap-8 text-gray-700 font-medium">
          <li><a href="#services" className="hover:text-yellow-600 transition">Services</a></li>
          <li><a href="#barbers" className="hover:text-yellow-600 transition">Stylists</a></li>
          <li><a href="#gallery" className="hover:text-yellow-600 transition">Gallery</a></li>
        </ul>

        <Link to={shopSlug ? `/s/${shopSlug}/booking` : "/booking"} className="shrink-0 text-sm bg-yellow-600 text-white px-4 py-2 rounded-lg shadow hover:bg-yellow-700 transition font-medium">Book now</Link>
      </div>
    </nav>
  );
};

export default Navbar;
