import React, { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiCalendar, FiCheck, FiClock, FiScissors, FiUser } from "react-icons/fi";
import { Link, useLocation, useParams } from "react-router-dom";
import axiosInstance, { API_URL } from "../../../api/axios";
import { useAppDispatch } from "../../../app/hooks";
import { bookAppointment } from "../../../features/appointments/appointmentsThunks";

interface Barber {
  id: string | number;
  name: string;
  profile_picture: string | null;
}

interface Service {
  id: string | number;
  name: string;
  price?: string | number;
  duration?: number;
}

const slots = Array.from({ length: 28 }, (_, index) => {
  const minutes = 8 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

const BookingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { shopSlug } = useParams();
  const location = useLocation();
  const queryShop = new URLSearchParams(location.search).get("shop");
  const homePath = shopSlug ? `/s/${shopSlug}` : queryShop ? `/s/${encodeURIComponent(queryShop)}` : "/";
  const [shop, setShop] = useState<any>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBarber, setSelectedBarber] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const params = shopSlug || queryShop ? { shop: shopSlug || queryShop } : undefined;
    Promise.all([
      axiosInstance.get("/public/shop", { params }),
      axiosInstance.get("/barber/barbers", { params }),
      axiosInstance.get("/services", { params }),
    ])
      .then(([shopResult, barberResult, serviceResult]) => {
        setShop(shopResult.data);
        setBarbers(barberResult.data);
        setServices(serviceResult.data);
      })
      .catch((requestError) => setError(typeof requestError === "string" ? requestError : "Could not load booking details."))
      .finally(() => setLoading(false));
  }, [queryShop, shopSlug]);

  useEffect(() => {
    if (!selectedBarber || !date) {
      setBookedTimes([]);
      return;
    }
    axiosInstance
      .get(`/appointments/barber/${selectedBarber}`)
      .then((response) => {
        const times = response.data
          .map((appointment: any) => new Date(appointment.start_time))
          .filter((appointmentDate: Date) => {
            const localDate = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, "0")}-${String(appointmentDate.getDate()).padStart(2, "0")}`;
            return localDate === date;
          })
          .map((appointmentDate: Date) => `${String(appointmentDate.getHours()).padStart(2, "0")}:${String(appointmentDate.getMinutes()).padStart(2, "0")}`);
        setBookedTimes(times);
      })
      .catch((requestError) => setError(typeof requestError === "string" ? requestError : "Could not load available times."));
  }, [date, selectedBarber]);

  const barber = useMemo(() => barbers.find((item) => String(item.id) === selectedBarber), [barbers, selectedBarber]);
  const service = useMemo(() => services.find((item) => String(item.id) === selectedService), [services, selectedService]);
  const today = new Date();
  const minimumDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await dispatch(bookAppointment({ customerName, customerPhone, barberId: selectedBarber, serviceId: selectedService, startTime: `${date} ${time}` })).unwrap();
      setConfirmed(true);
    } catch (requestError) {
      setError(typeof requestError === "string" ? requestError : "Could not make your booking. Please try another time.");
    } finally {
      setSubmitting(false);
    }
  };

  const picture = (path: string | null) => !path ? null : path.startsWith("http") ? path : `${API_URL}${path}`;

  if (loading) return <div className="public-booking-loading"><img src="/mirror.svg" alt=""/> Opening booking…</div>;

  return (
    <main className="public-booking-page">
      <header className="public-booking-header">
        <Link to={homePath}><FiArrowLeft /> <span>Back to shop</span></Link>
        <div className="public-booking-brand"><span><img src="/mirror.svg" alt=""/></span><strong>{shop?.name || "Mirror"}</strong></div>
        <div className="public-booking-plus">ONLINE BOOKING</div>
      </header>

      <section className="public-booking-shell">
        <div className="public-booking-intro">
          <p>ONLINE BOOKING</p>
          <h1>Book your visit.</h1>
          <span>Choose your stylist, service, date, and time.</span>
        </div>

        <form onSubmit={submit} className="public-booking-form">
          <section className="public-booking-card">
            <div className="public-booking-step"><b>1</b><div><h2>Choose your stylist</h2><p>Choose the person you want.</p></div></div>
            <div className="public-booking-choice-grid">
              {barbers.map((item) => {
                const selected = String(item.id) === selectedBarber;
                return <button type="button" key={item.id} className={`public-booking-choice ${selected ? "is-selected" : ""}`} onClick={() => setSelectedBarber(String(item.id))}>
                  {picture(item.profile_picture) ? <img src={picture(item.profile_picture)!} alt="" /> : <span className="public-booking-avatar"><FiUser /></span>}
                  <strong>{item.name}</strong>{selected && <i><FiCheck /></i>}
                </button>;
              })}
            </div>
          </section>

          <section className="public-booking-card">
            <div className="public-booking-step"><b>2</b><div><h2>Choose a service</h2><p>These are the shop’s current prices.</p></div></div>
            <div className="public-booking-service-list">
              {services.map((item) => {
                const selected = String(item.id) === selectedService;
                return <button type="button" key={item.id} className={`public-booking-service ${selected ? "is-selected" : ""}`} onClick={() => setSelectedService(String(item.id))}>
                  <span><FiScissors /></span><div><strong>{item.name}</strong>{item.duration ? <small>{item.duration} min</small> : null}</div>
                  {item.price !== undefined && <b>{shop?.currency || "ETB"} {Number(item.price).toFixed(0)}</b>}{selected && <i><FiCheck /></i>}
                </button>;
              })}
            </div>
          </section>

          <section className="public-booking-card">
            <div className="public-booking-step"><b>3</b><div><h2>Choose a time</h2><p>Times you cannot choose are already booked.</p></div></div>
            <label className="public-booking-date"><FiCalendar /><input type="date" value={date} min={minimumDate} onChange={(event) => { setDate(event.target.value); setTime(""); }} required /></label>
            {date && selectedBarber ? <div className="public-booking-slots">{slots.map((slot) => {
              const unavailable = bookedTimes.includes(slot);
              return <button type="button" key={slot} disabled={unavailable} className={time === slot ? "is-selected" : ""} onClick={() => setTime(slot)}>{slot}</button>;
            })}</div> : <div className="public-booking-prompt"><FiClock /> Choose a stylist and date to see times.</div>}
          </section>

          <section className="public-booking-card">
            <div className="public-booking-step"><b>4</b><div><h2>Your details</h2><p>The shop uses these details for this booking only.</p></div></div>
            <div className="public-booking-fields">
              <label><span>Full name</span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Your name" required /></label>
              <label><span>Phone number</span><input type="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="09…" required /></label>
            </div>
          </section>

          <aside className="public-booking-summary">
            <div><span><FiUser /></span><p>STYLIST<strong>{barber?.name || "Choose a stylist"}</strong></p></div>
            <div><span><FiScissors /></span><p>SERVICE<strong>{service?.name || "Choose a service"}</strong></p></div>
            <div><span><FiCalendar /></span><p>WHEN<strong>{date && time ? `${date} at ${time}` : "Choose date and time"}</strong></p></div>
            <button type="submit" disabled={!barber || !service || !date || !time || submitting}>{submitting ? "Booking…" : "Confirm booking"} <FiCheck /></button>
          </aside>
          {error && <p className="public-booking-error">{error}</p>}
        </form>
      </section>

      {confirmed && <div className="public-booking-modal" role="dialog" aria-modal="true"><div><span><FiCheck /></span><p>BOOKING SAVED</p><h2>Your visit is booked.</h2><div><strong>{barber?.name}</strong><small>{service?.name} · {date} at {time}</small></div><Link to={homePath}>Back to shop</Link></div></div>}
    </main>
  );
};

export default BookingPage;
