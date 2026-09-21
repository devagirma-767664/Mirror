// src/components/admin/AdminNavbar.tsx
import React from "react";
import { useAppDispatch } from "../../app/hooks";
import { logoutUser } from "../../features/auth/authThunks";
import { useNavigate } from "react-router-dom";

const AdminNavbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser()); // clears Redux + localStorage
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo with Icon */}
        <div className="flex items-center gap-2">
          <img src="/mirror.svg" alt="" className="h-9 w-9" />
          <h1 className="text-2xl font-serif font-bold text-yellow-600 tracking-wide">
            Mirror
          </h1>
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex gap-8 text-gray-700 font-medium">
          <li>
            <a href="#users" className="hover:text-yellow-600 transition">
              Users
            </a>
          </li>
          <li>
            <a href="#reports" className="hover:text-yellow-600 transition">
              Reports
            </a>
          </li>
          <li>
            <a href="#dayoff" className="hover:text-yellow-600 transition">
              Day‑off Requests
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

export default AdminNavbar;
