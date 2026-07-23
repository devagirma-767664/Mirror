// src/components/admin/DayOffRequests.tsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";

const DayOffRequests: React.FC = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const res = await axiosInstance.get("/admin/dayoff");
      setRequests(res.data);
    };
    fetchRequests();
  }, []);

  const handleDecision = async (id: string, status: string) => {
    await axiosInstance.put(`/admin/dayoff/${id}`, { status });
    setRequests((prev) =>
      prev.map((req: any) =>
        req.id === id ? { ...req, status } : req
      )
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-yellow-600 mb-4">Day‑off Requests</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">Barber</th>
            <th className="p-2">Date</th>
            <th className="p-2">Reason</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req: any) => (
            <tr key={req.id} className="border-b">
              <td className="p-2">{req.barberName}</td>
              <td className="p-2">{req.date}</td>
              <td className="p-2">{req.reason}</td>
              <td className="p-2">{req.status}</td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => handleDecision(req.id, "approved")}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDecision(req.id, "denied")}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Deny
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DayOffRequests;
