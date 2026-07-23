// src/Components/Receptionist/AppointmentSearch.tsx
import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchAppointments, checkInAppointment } from "../../features/appointments/appointmentsThunks";

const AppointmentSearch: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list, loading, error } = useAppSelector((state) => state.appointments);
  const [query, setQuery] = useState("");
  const [checkInSuccess, setCheckInSuccess] = useState(false); // ✅ new state

  useEffect(() => {
    dispatch(fetchAppointments());
  }, [dispatch]);

  const filtered = list.filter(
    (appt) =>
      appt.status !== "Completed" &&
      (appt.customer_name.toLowerCase().includes(query.toLowerCase()) ||
        appt.customer_phone.includes(query))
  );

  const formatDateTime = (isoString: string) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleCheckIn = async (id: number) => {
    await dispatch(checkInAppointment(id));
    setCheckInSuccess(true); // ✅ show popup
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-yellow-600 mb-6">Check‑In Customers</h2>

      {/* Search Bar */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-2 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border pl-10 pr-4 py-2 rounded w-full text-sm focus:ring-2 focus:ring-yellow-500"
        />
      </div>

      {loading && <p className="text-gray-500">Loading appointments...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-yellow-100 text-gray-700">
            <tr>
              <th className="p-3 text-sm font-semibold text-left">Customer</th>
              <th className="p-3 text-sm font-semibold text-left">Service</th>
              <th className="p-3 text-sm font-semibold text-left">Barber</th>
              <th className="p-3 text-sm font-semibold text-left">Time</th>
              <th className="p-3 text-sm font-semibold text-left">Status</th>
              <th className="p-3 text-sm font-semibold text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && !error && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-4">
                  No appointments found.
                </td>
              </tr>
            )}
            {filtered.map((appt, idx) => (
              <tr
                key={appt.id}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="p-3 text-sm text-left">{appt.customer_name}</td>
                <td className="p-3 text-sm text-left">{appt.service_name}</td>
                <td className="p-3 text-sm text-left">{appt.barber_name}</td>
                <td className="p-3 text-sm text-left">{formatDateTime(appt.start_time)}</td>
                <td className="p-3 text-sm text-left">{appt.status}</td>
                <td className="p-3 text-sm text-left">
                  <button
                    disabled={appt.status !== "Booked"}
                    onClick={() => handleCheckIn(appt.id)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                      appt.status === "Booked"
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    Check In
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Success Popup */}
      {checkInSuccess && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-80 p-8 rounded-xl shadow-2xl text-center">
            <div className="text-green-600 text-7xl mb-4">✔️</div>
            <h3 className="text-2xl font-bold mb-2 text-green-700">Check‑In Successful</h3>
            <p className="text-gray-600 mb-6">The customer has been checked in successfully.</p>
            <button
              onClick={() => setCheckInSuccess(false)}
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

export default AppointmentSearch;
