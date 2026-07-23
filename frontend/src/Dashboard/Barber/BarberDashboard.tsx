// src/pages/BarberDashboard.tsx
import React, { useEffect } from "react";
import { useAppSelector } from "../../app/hooks";
import { useNavigate } from "react-router-dom";
import BarberNavbar from "../../Components/Barber/BarberNavbar";
import Appointments from "../../Components/Barber/Appointments";

const BarberDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  const barberId = user.id;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <BarberNavbar />

      <div className="flex flex-1 pt-20">
        {/* Sidebar (fixed) */}
        <aside className="fixed top-20 left-0 h-[calc(100vh-5rem)] w-64 bg-yellow-600 text-white p-6">
          {/* Barber Info */}
          <div className="flex flex-col items-center mb-8">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-sm text-gray-200 capitalize">{user.role}</p>
          </div>

          {/* Navigation */}
          <nav className="space-y-4">
            <a href="#appointments" className="block hover:text-gray-200">
              Appointments
            </a>
            <a href="#ratings" className="block hover:text-gray-200">
              Ratings
            </a>
            <a href="#dayoff" className="block hover:text-gray-200">
              Day‑Off Requests
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-gray-100 ml-64">
          <section id="appointments" className="mb-12">
            <Appointments barberId={barberId} />
          </section>
        </main>
      </div>
    </div>
  );
};

export default BarberDashboard;
