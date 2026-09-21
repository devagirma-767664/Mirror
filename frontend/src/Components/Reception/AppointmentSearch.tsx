import React, { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiPhone, FiRefreshCw, FiSearch } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { checkInAppointment, fetchAppointments } from "../../features/appointments/appointmentsThunks";

const formatDateTime = (value: unknown) => {
  if (!value) return "Time not set";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "Time not set" : new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
};

const AppointmentSearch: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list, loading, error } = useAppSelector((state) => state.appointments);
  const appointments = list || [];
  const [query, setQuery] = useState("");
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchAppointments());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return appointments.filter((appointment: any) => {
      if (appointment.status === "Completed" || appointment.status === "Cancelled") return false;
      if (!normalized) return true;
      return `${appointment.customer_name || ""} ${appointment.customer_phone || ""} ${appointment.barber_name || ""} ${appointment.service_name || ""}`.toLowerCase().includes(normalized);
    });
  }, [appointments, query]);

  const handleCheckIn = async (id: string | number) => {
    try {
      await dispatch(checkInAppointment(String(id))).unwrap();
      await dispatch(fetchAppointments());
      setCheckInSuccess(true);
    } catch {
      // The appointments slice keeps the server error visible in the page.
    }
  };

  return (
    <section className="reception-module-view">
      <header className="admin-module-header"><div><p className="admin-eyebrow">BOOKINGS</p><h2 className="admin-module-title">Customers who arrived</h2><p className="admin-module-subtitle">Find the booking and send the customer to their stylist.</p></div><button className="admin-secondary-button" onClick={() => dispatch(fetchAppointments())}><FiRefreshCw /> <span>Refresh</span></button></header>
      <section className="admin-module-card">
        <div className="admin-module-toolbar"><div><p className="admin-card-kicker">TODAY’S BOOKINGS</p><h3>{filtered.length} customers waiting</h3></div><label className="admin-search-box"><FiSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, phone, or stylist" /></label></div>
        {loading && <div className="admin-inline-state">Loading bookings…</div>}
        {error && <div className="admin-inline-error">{typeof error === "string" ? error : "Could not load bookings."}</div>}
        {!loading && !filtered.length && <div className="admin-empty-state">No bookings match your search.</div>}
        <div className="reception-appointment-list">{filtered.map((appointment: any) => <article className="reception-appointment-card" key={appointment.id}><div className="reception-appointment-time"><FiClock /><strong>{formatDateTime(appointment.start_time)}</strong></div><div className="reception-appointment-main"><strong>{appointment.customer_name || "Walk-in customer"}</strong><span><FiPhone /> {appointment.customer_phone || "No phone added"}</span><small>{appointment.service_name || "Service"} · {appointment.barber_name || "No stylist chosen"}</small></div><span className={`admin-status-pill ${appointment.status === "Booked" ? "is-pending" : "is-paid"}`}>{appointment.status === 'Booked' ? 'Booked' : 'Sent to stylist'}</span><button disabled={appointment.status !== "Booked"} onClick={() => handleCheckIn(appointment.id)} className={`reception-checkin-button ${appointment.status === "Booked" ? "is-ready" : "is-disabled"}`}><FiCheckCircle /> {appointment.status === "Booked" ? "Mark here" : "Sent"}</button></article>)}</div>
      </section>
      {checkInSuccess && <div className="reception-modal-backdrop"><div className="reception-modal"><span className="reception-success-icon"><FiCheckCircle /></span><h3>Customer sent to stylist</h3><p>Take payment when the customer returns after service.</p><button className="admin-primary-button" onClick={() => setCheckInSuccess(false)}>Done</button></div></div>}
    </section>
  );
};

export default AppointmentSearch;
