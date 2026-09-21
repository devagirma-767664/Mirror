import React, { useEffect, useMemo, useState } from "react";
import { FiActivity, FiCalendar, FiClock, FiDollarSign, FiGrid, FiLogOut, FiMenu, FiUser, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logoutUser } from "../../features/auth/authThunks";
import { fetchBarberAppointments } from "../../features/barbers/barbersThunks";
import Appointments from "../../Components/Barber/Appointments";
import DayOffRequests from "../../Components/Barber/DayOffRequests";
import Earnings from "../../Components/Barber/Earnings";
import ProfileSettings from '../../Components/ProfileSettings';
import NotificationsBell from '../../Components/NotificationsBell';

type BarberView = "overview" | "appointments" | "dayoff" | "earnings" | "profile";
const navigation: Array<{ id: BarberView; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "Today", icon: <FiGrid /> },
  { id: "appointments", label: "My customers", icon: <FiCalendar /> },
  { id: "dayoff", label: "Day off", icon: <FiClock /> },
  { id: "earnings", label: "My earnings", icon: <FiDollarSign /> },
  { id: "profile", label: "My profile", icon: <FiUser /> },
];

const formatDate = (value: unknown, fallback = "—") => {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
};
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "B";

const BarberDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const appointments = useAppSelector((state) => state.barbers.appointments) || [];
  const [view, setView] = useState<BarberView>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    dispatch(fetchBarberAppointments());
  }, [dispatch, navigate, user]);

  const activeAppointments = useMemo(() => (appointments as any[]).filter((appointment) => !["Completed", "Cancelled"].includes(appointment.status)), [appointments]);
  const booked = activeAppointments.filter((appointment) => appointment.status === "Booked").length;
  const arrived = activeAppointments.filter((appointment) => ["Arrived","InProgress"].includes(appointment.status)).length;
  if (!user) return null;

  const selectView = (next: BarberView) => {
    setView(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const logout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <div className="barber-workspace">
      <header className="barber-mobile-header"><button className="admin-icon-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><FiMenu /></button><div className="barber-brand"><img className="barber-brand-mark" src="/mirror.svg" alt=""/><span>Mirror</span></div><NotificationsBell /></header>
      {sidebarOpen && <button className="barber-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <aside className={`barber-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="barber-sidebar-top"><div className="barber-brand"><img className="barber-brand-mark" src="/mirror.svg" alt=""/><span>Mirror</span></div><button className="admin-icon-button barber-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><FiX /></button></div>
        <div className="barber-workspace-label"><span>MY WORK</span><strong>Stylist page</strong></div>
        <nav className="barber-sidebar-nav" aria-label="Stylist navigation">{navigation.map((item) => <button key={item.id} className={view === item.id ? "is-active" : ""} onClick={() => selectView(item.id)}><span>{item.icon}</span><span>{item.label}</span>{item.id === "appointments" && arrived > 0 && <b>{arrived}</b>}</button>)}</nav>
        <div className="barber-sidebar-footer"><div className="barber-user-mini"><span>{initials(user.name || "Stylist")}</span><div><strong>{user.name || "Stylist"}</strong><small>Stylist</small></div></div><button className="barber-logout" onClick={logout}><FiLogOut /> Sign out</button></div>
      </aside>
      <main className="barber-main">
        <div className="barber-topbar"><div><p className="admin-eyebrow">{view === "overview" ? "YOUR DAY" : "STYLIST PAGE"}</p><h1>{view === "overview" ? `Hello, ${user.name?.split(" ")[0] || "there"}` : navigation.find((item) => item.id === view)?.label}</h1></div><div className="barber-topbar-actions"><NotificationsBell/><button className="admin-primary-button" onClick={() => selectView("appointments")}><FiCalendar /><span>My customers</span></button></div></div>
        {view === "overview" && <BarberOverview appointments={activeAppointments} booked={booked} arrived={arrived} setView={selectView} />}
        {view === "appointments" && <Appointments />}
        {view === "dayoff" && <DayOffRequests barberId={String(user.id)} />}
        {view === "earnings" && <section className="barber-module-view"><div className="barber-page-intro"><div><p className="admin-eyebrow">YOUR PAY</p><h2>My earnings</h2><p>See your pay for the time period chosen by the owner.</p></div></div><Earnings /></section>}
        {view === "profile" && <ProfileSettings />}
      </main>
      <nav className="barber-bottom-nav">{navigation.map((item) => <button key={item.id} className={view === item.id ? "is-active" : ""} onClick={() => selectView(item.id)}>{item.icon}<span>{item.label}</span>{item.id === "appointments" && arrived > 0 && <b>{arrived}</b>}</button>)}</nav>
    </div>
  );
};

interface BarberOverviewProps { appointments: any[]; booked: number; arrived: number; setView: (view: BarberView) => void; }
const BarberOverview: React.FC<BarberOverviewProps> = ({ appointments, booked, arrived, setView }) => (
  <section className="barber-module-view">
    <section className="barber-welcome"><div><span>YOUR CHAIR, YOUR DAY</span><h2>Focus on your customers.</h2><p>Reception manages the queue and payments. You focus on the service.</p></div><div className="barber-welcome-icon"><FiActivity /></div></section>
    <section className="admin-kpi-grid"><BarberMetric label="My customers" value={appointments.length} helper="Customers waiting or being served" icon={<FiCalendar />} tone="indigo" /><BarberMetric label="At the shop" value={arrived} helper="Reception collects payment" icon={<FiActivity />} tone="purple" /><BarberMetric label="Booked ahead" value={booked} helper="Customers coming later" icon={<FiClock />} tone="green" /></section><Earnings />
    <section className="barber-overview-grid"><div className="admin-module-card"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">NEXT CUSTOMERS</p><h3>Customers coming next</h3></div><button className="admin-inline-link" onClick={() => setView("appointments")}>See customers <FiCalendar /></button></div><div className="barber-queue-list">{appointments.slice(0, 5).map((appointment) => <div className="barber-queue-row" key={appointment.id}><div className="barber-time-pill">{formatDate(appointment.start_time, "—").split(", ").pop()}</div><div><strong>{appointment.customer_name || "Walk-in customer"}</strong><span>{appointment.service_name || "Service"}</span></div><span className={`admin-status-pill ${appointment.status === "Arrived" ? "is-paid" : appointment.status === "InProgress" ? "is-active" : "is-pending"}`}>{appointment.status === "Booked" ? "Booked" : "Assigned"}</span></div>)}{!appointments.length && <div className="admin-empty-state">Customers waiting for you will show here.</div>}</div></div><div className="admin-module-card barber-quick-card"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">QUICK ACTIONS</p><h3>Keep your chair moving</h3></div></div><button onClick={() => setView("appointments")}><span className="barber-action-icon indigo"><FiCalendar /></span><span><strong>See my customers</strong><small>See customer and service details</small></span></button><button onClick={() => setView("dayoff")}><span className="barber-action-icon purple"><FiClock /></span><span><strong>Ask for a day off</strong><small>Send a request to the owner</small></span></button><button onClick={() => setView("earnings")}><span className="barber-action-icon orange"><FiDollarSign /></span><span><strong>See my earnings</strong><small>Check your percentage pay so far</small></span></button></div></section>
  </section>
);

const BarberMetric: React.FC<{ label: string; value: number; helper: string; icon: React.ReactNode; tone: string }> = ({ label, value, helper, icon, tone }) => <div className="admin-metric-card"><div className={`admin-metric-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{helper}</small></div></div>;
export default BarberDashboard;
