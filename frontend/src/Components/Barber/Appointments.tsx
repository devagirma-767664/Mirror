import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchBarberAppointments,
  startSession,
  closeSession,
} from "../../features/barbers/barbersThunks"; // ✅ use barbersThunks

const Appointments: React.FC = () => {
  const dispatch = useAppDispatch();
  const { appointments, loading, error } = useAppSelector((state) => state.barbers); // ✅ use barbers slice
  const [query, setQuery] = useState("");
  const [activeAppt, setActiveAppt] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // ✅ Fetch appointments for logged-in barber (no barberId needed)
  useEffect(() => {
    dispatch(fetchBarberAppointments());
  }, [dispatch]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeAppt) {
      timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activeAppt]);

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

  // ✅ Only apply search filter (backend already filters by barberId and excludes Completed)
  const filtered = appointments.filter(
    (appt) =>
      appt.status !== "Completed" && 
      (appt.customer_name.toLowerCase().includes(query.toLowerCase()) ||
      appt.customer_phone.includes(query))
  );

  const handleStart = (id: string) => {
    dispatch(startSession(id));
    setActiveAppt(id);
    setElapsed(0);
  };

  const handleClose = (id: string) => {
    dispatch(closeSession(id)).then(() => {
      setActiveAppt(null);
      setElapsed(0);
    });
  };

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-yellow-600 mb-6">My Appointments</h2>

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
              <th className="p-3 text-sm font-semibold text-left">Time</th>
              <th className="p-3 text-sm font-semibold text-left">Status</th>
              <th className="p-3 text-sm font-semibold text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && !error && (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-4">
                  No appointments found.
                </td>
              </tr>
            )}
            {filtered.map((appt, idx) => (
              <tr key={appt.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="p-3 text-sm">{appt.customer_name}</td>
                <td className="p-3 text-sm">{appt.service_name}</td>
                <td className="p-3 text-sm">{formatDateTime(appt.start_time)}</td>
                <td className="p-3 text-sm">{appt.status}</td>
                <td className="p-3 text-sm">
                  <button
                    disabled={appt.status !== "Arrived"}
                    onClick={() => handleStart(appt.id)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                      appt.status === "Arrived"
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    Start
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Popup */}
      {activeAppt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-8 w-[30rem]">
            <h3 className="text-lg font-bold mb-4">Session in Progress</h3>
            <p className="text-2xl font-mono text-center mb-6">{formatElapsed(elapsed)}</p>
            <button
              onClick={() => handleClose(activeAppt)}
              className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600"
            >
              End Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
