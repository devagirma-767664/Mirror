// src/components/receptionist/ReceptionistSidebar.tsx
import React from "react";

const ReceptionistSidebar: React.FC = () => {
  return (
    <aside className="fixed top-20 left-0 h-[calc(100vh-5rem)] w-64 bg-yellow-600 text-white p-6">
      {/* Receptionist Info */}
      <div className="mb-8">
        <h2 className="text-xl font-bold">Receptionist</h2>
        <p className="text-sm text-gray-200">Front Desk</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-4">
        <a href="#checkin" className="block hover:text-gray-200">
          Check‑In Customers
        </a>
        <a href="#walkins" className="block hover:text-gray-200">
          Walk‑In Registration
        </a>
        <a href="#billing" className="block hover:text-gray-200">
          Billing
        </a>
      </nav>
    </aside>
  );
};

export default ReceptionistSidebar;
