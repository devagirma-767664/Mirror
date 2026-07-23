// AppRoutes.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./Dashboard/Public/pages/LandingPage";
import LoginPage from "./Dashboard/Public/pages/LoginPage";
import AdminDashboard from "./Dashboard/Admin/AdminDashboard";
import BookingPage from "./Dashboard/Public/pages/BookingPage";
import BarberDashboard from "./Dashboard/Barber/BarberDashboard";
import ReceptionistDashboard from "./Dashboard/Reception/ReceptionistDashboard";

const AppRoutes: React.FC = () => {
  return (
    <Routes>

      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/admin" element={<AdminDashboard />} />

      <Route path="/booking" element={<BookingPage />} /> 

      <Route path="/barber" element={<BarberDashboard />} />

      <Route path="/receptionist" element={<ReceptionistDashboard />} />


    </Routes>
  );
};

export default AppRoutes;
