// src/pages/ReceptionistDashboard.tsx
import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchAppointments } from "../../features/appointments/appointmentsThunks";
import AppointmentSearch from "../../Components/Reception/AppointmentSearch";
import WalkInRegistration from "../../Components/Reception/WalkInRegistration";
import Billing from "../../Components/Reception/Billing";
import ReceptionistNavbar from "../../Components/Reception/ReceptionistNavbar";
import ReceptionistSidebar from "../../Components/Reception/ReceptionistSidebar";

const ReceptionistDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchAppointments());
  }, [dispatch]);

  if (!user) {
    return <p className="p-8 text-red-500">No receptionist logged in.</p>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ReceptionistNavbar />
      <div className="flex flex-1 pt-20">
        {/* Sidebar + Main content */}
         <ReceptionistSidebar />
        <main className="flex-1 p-8 bg-gray-100 ml-64">
          <section id="checkin" className="mb-12">
            <AppointmentSearch />
          </section>
          <section id="walkins" className="mb-12">
            <WalkInRegistration />
          </section>
          <section id="billing">
            <Billing />
          </section>
        </main>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
