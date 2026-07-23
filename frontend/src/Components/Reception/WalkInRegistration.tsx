// src/Components/Receptionist/WalkInRegistration.tsx
import React, { useState, useEffect } from "react";
import { useAppDispatch } from "../../app/hooks";
import { assignWalkIn } from "../../features/appointments/appointmentsThunks";
import axiosInstance from "../../api/axios";
import { fetchBills } from "../../features/bills/billsThuks";

interface Barber {
  id: string;
  name: string;
  profile_picture?: string | null;
}

interface Service {
  id: string;
  name: string;
  image?: string;
}

const WalkInRegistration: React.FC = () => {
  const dispatch = useAppDispatch();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [name, setName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [barberId, setBarberId] = useState("");
  const [successPopup, setSuccessPopup] = useState(false);

  // ✅ Fetch barbers and services on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const barberRes = await axiosInstance.get("/barber/barbers");
        setBarbers(barberRes.data);

        const serviceRes = await axiosInstance.get("/services");
        setServices(serviceRes.data);
      } catch (err) {
        console.error("Failed to fetch barbers/services", err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(assignWalkIn({ customerName: name, serviceId, barberId }));

    dispatch(fetchBills());

    setName("");
    setServiceId("");
    setBarberId("");
    setSuccessPopup(true); 
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-yellow-600 mb-6">Assign Walk‑In</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Name
          </label>
          <input
            type="text"
            placeholder="Enter customer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border px-3 py-2 rounded text-sm w-full max-w-md focus:ring-2 focus:ring-yellow-500"
            required
          />
        </div>

        {/* Service Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose Service
          </label>
          <div className="grid grid-cols-2 gap-4">
            {services.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className={`p-4 rounded-lg border text-sm transition ${
                  serviceId === s.id
                    ? "bg-yellow-100 border-yellow-500"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-300"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Barber Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign Barber
          </label>
          <div className="grid grid-cols-2 gap-4">
            {barbers.map((b) => (
              <button
                type="button"
                key={b.id}
                onClick={() => setBarberId(b.id)}
                className={`p-4 rounded-lg border text-sm transition ${
                  barberId === b.id
                    ? "bg-yellow-100 border-yellow-500"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-300"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-yellow-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 transition"
          >
            Assign Walk‑In
          </button>
        </div>
      </form>

      {/* ✅ Success Popup */}
      {successPopup && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-96 p-8 rounded-xl shadow-2xl text-center">
            <div className="text-green-600 text-7xl mb-4">✔️</div>
            <h3 className="text-2xl font-bold mb-2 text-green-700">Walk‑In Assigned</h3>
            <p className="text-gray-600 mb-6">
              The customer has been successfully assigned to a barber.
            </p>
            <button
              onClick={() => setSuccessPopup(false)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalkInRegistration;
