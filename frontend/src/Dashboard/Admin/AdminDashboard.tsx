// src/pages/AdminDashboard.tsx
import React from "react";
import UserManagement from "../../Components/Admin/UserManagement";
import ServicesManagement from "../../Components/Admin/ServicesManagement";
import Reports from "../../Components/Admin/Reports";
import AdminNavbar from "../../Components/Admin/AdminNavbar";

const AdminDashboard: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <AdminNavbar />

      <div className="flex flex-1 pt-20">
        {/* Sidebar (fixed) */}
        <aside className="fixed top-20 left-0 h-[calc(100vh-5rem)] w-64 bg-yellow-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
          <nav className="space-y-4">
            <a href="#users" className="block hover:text-gray-200">Users</a>
            <a href="#services" className="block hover:text-gray-200">Services</a>
            <a href="#reports" className="block hover:text-gray-200">Reports</a>
            <a href="#dayoff" className="block hover:text-gray-200">Day‑off Requests</a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-gray-100 ml-64">
          <section id="users" className="mb-12">
            <UserManagement />
          </section>
          <section id="services" className="mb-12">
            <ServicesManagement />
          </section>
          <section id="reports" className="mb-12">
            <Reports />
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
