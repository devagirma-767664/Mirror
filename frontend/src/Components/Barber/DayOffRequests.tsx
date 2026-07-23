// src/components/barber/DayOffRequests.tsx
import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { requestDayOff } from "../../features/barbers/barbersThunks";

const DayOffRequests: React.FC<{ barberId: string }> = ({ barberId }) => {
  const dispatch = useAppDispatch();
  const { list } = useAppSelector((state) => state.barbers);
  const barber = list.find((b) => b.id === barberId);

  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(requestDayOff({ barberId, date, reason }));
    setDate("");
    setReason("");
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* ✅ Consistent with admin dashboard */}
      <h2 className="text-xl font-bold text-yellow-600 mb-4">Day‑Off Requests</h2>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border px-4 py-2 rounded w-full"
          required
        />
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason"
          className="border px-4 py-2 rounded w-full"
          required
        />
        <button
          type="submit"
          className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700 transition"
        >
          Submit Request
        </button>
      </form>

      <ul>
        {barber?.dayOffRequests?.map((req) => (
          <li key={req.id} className="border-b py-2">
            {req.date} — {req.reason} ({req.status})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DayOffRequests;
