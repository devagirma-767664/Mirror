import React, { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiPlus, FiScissors, FiUsers, FiX } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { assignWalkIn, fetchAppointments } from "../../features/appointments/appointmentsThunks";
import axiosInstance from "../../api/axios";

type Barber = { id: string; name: string; profile_picture?: string | null };
type Service = { id: string; name: string; price?: number | string; duration?: number | string };

const WalkInRegistration: React.FC = () => {
  const dispatch = useAppDispatch();
  const currency = useAppSelector((state) => state.auth.user?.shop?.currency || "ETB");
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [barberId, setBarberId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignedBarberName, setAssignedBarberName] = useState<string | null>(null);
  const money = (value: number | string) => `${currency} ${Number(value || 0).toFixed(2)}`;

  useEffect(() => {
    Promise.all([axiosInstance.get("/barber/barbers"), axiosInstance.get("/services")])
      .then(([barberResponse, serviceResponse]) => { setBarbers(barberResponse.data || []); setServices(serviceResponse.data || []); })
      .catch((requestError) => setError(typeof requestError === "string" ? requestError : "Unable to load stylists and services."))
      .finally(() => setLoading(false));
  }, []);

  const selectedBarber = useMemo(() => barbers.find((barber) => String(barber.id) === barberId), [barberId, barbers]);
  const selectedService = useMemo(() => services.find((service) => String(service.id) === serviceId), [serviceId, services]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
      if (!barberId || !serviceId) return setError("Choose the customer’s stylist and service.");
    setSubmitting(true);
    setError(null);
    try {
      await dispatch(assignWalkIn({ customerName: "Walk-in customer", serviceId, barberId })).unwrap();
      await dispatch(fetchAppointments());
      setAssignedBarberName(selectedBarber?.name || "the selected stylist");
      setBarberId("");
      setServiceId("");
    } catch (requestError: any) {
      setError(typeof requestError === "string" ? requestError : "Unable to assign this walk-in.");
    } finally { setSubmitting(false); }
  };

  return (
    <section className="reception-module-view">
      <header className="admin-module-header"><div><p className="admin-eyebrow">WALK-IN DESK</p><h2 className="admin-module-title">Send a customer to their stylist</h2><p className="admin-module-subtitle">No customer form is needed. Choose their regular stylist, select the service, and assign.</p></div><span className="reception-step-badge"><FiUsers /> Fast assignment</span></header>
      <form className="reception-walkin-layout" onSubmit={handleSubmit}>
        <section className="admin-module-card"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">STEP 1</p><h3>Who is their stylist?</h3></div><span className="admin-toolbar-note">{selectedBarber?.name || "Required"}</span></div>{loading && <div className="admin-inline-state">Loading stylists…</div>}<div className="reception-choice-grid">{barbers.map((barber) => <button type="button" className={`reception-choice-card ${barberId === String(barber.id) ? "is-selected" : ""}`} key={barber.id} onClick={() => setBarberId(String(barber.id))}><span className="reception-barber-avatar">{barber.name?.slice(0, 1)}</span><span><strong>{barber.name}</strong><small>Assign customer to this chair</small></span>{barberId === String(barber.id) && <FiCheckCircle className="reception-choice-check" />}</button>)}</div></section>
        <section className="admin-module-card"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">STEP 2</p><h3>What service do they need?</h3></div><span className="admin-toolbar-note">{selectedService ? `${money(selectedService.price || 0)} · ${selectedService.duration || 0} min` : "Required"}</span></div>{loading && <div className="admin-inline-state">Loading services…</div>}<div className="reception-choice-grid">{services.map((service) => <button type="button" className={`reception-choice-card ${serviceId === String(service.id) ? "is-selected" : ""}`} key={service.id} onClick={() => setServiceId(String(service.id))}><span className="reception-choice-icon"><FiScissors /></span><span><strong>{service.name}</strong><small>{money(service.price || 0)} · {service.duration || 0} min</small></span>{serviceId === String(service.id) && <FiCheckCircle className="reception-choice-check" />}</button>)}</div></section>
        <section className="reception-walkin-summary"><div><p className="admin-card-kicker">READY TO ASSIGN</p><h3>{selectedBarber?.name || "Choose a stylist"}</h3><p>{selectedService ? `${selectedService.name} · customer pays after service` : "Then choose the service"}</p></div><button type="submit" className="admin-primary-button" disabled={submitting || !serviceId || !barberId}>{submitting ? "Assigning…" : <><FiPlus /> Send to stylist</>}</button></section>
      </form>
      {error && <div className="admin-inline-error">{error}</div>}
      {assignedBarberName && <div className="reception-modal-backdrop"><div className="reception-modal"><span className="reception-success-icon"><FiCheckCircle /></span><h3>Customer assigned</h3><p>The walk-in is now on {assignedBarberName}’s board. Collect payment when the customer returns after their service.</p><button className="admin-primary-button" onClick={() => setAssignedBarberName(null)}>Done</button><button className="reception-modal-close" onClick={() => setAssignedBarberName(null)} aria-label="Close"><FiX /></button></div></div>}
    </section>
  );
};

export default WalkInRegistration;
