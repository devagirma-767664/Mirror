// src/components/barber/BarberNavbar.tsx
import React from "react";
import { useAppDispatch } from "../../app/hooks";
import { logoutUser } from "../../features/auth/authThunks";
import { useNavigate } from "react-router-dom";

const BarberNavbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-yellow-600 shadow-md z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo with Icon */}
        <div className="flex items-center gap-2">
          <img src="/mirror.svg" alt="" className="h-9 w-9" />
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
            Mirror
          </h1>
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex gap-8 text-white font-medium">
          <li>
            <a href="#appointments" className="hover:text-gray-200 transition">
              Appointments
            </a>
          </li>
          <li>
            <a href="#earnings" className="hover:text-gray-200 transition">
              My earnings
            </a>
          </li>
          <li>
            <a href="#dayoff" className="hover:text-gray-200 transition">
              Day‑Off Requests
            </a>
          </li>
        </ul>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-5 py-2 rounded-lg shadow hover:bg-red-600 transition font-medium"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default BarberNavbar;
