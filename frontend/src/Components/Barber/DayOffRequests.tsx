import React, { useMemo, useState } from "react";
import { FiCalendar, FiCheckCircle, FiClock, FiSend } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { requestDayOff } from "../../features/barbers/barbersThunks";

const formatDate = (value: unknown, fallback = "Date pending") => {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
};

interface DayOffRequest { id?: string | number; date?: string; request_date?: string; reason?: string; status?: string; }
const DayOffRequests: React.FC<{ barberId: string }> = ({ barberId }) => {
  const dispatch = useAppDispatch();
  const barber = useAppSelector((state) => state.barbers.list.find((item) => String(item.id) === String(barberId)));
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState<DayOffRequest[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const existingRequests = useMemo(() => ((barber?.dayOffRequests || []) as DayOffRequest[]), [barber?.dayOffRequests]);
  const allRequests = [...requests, ...existingRequests.filter((existing) => !requests.some((request) => String(request.id) === String(existing.id)))];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await dispatch(requestDayOff({ barberId, date, reason })).unwrap();
      setRequests((current) => [{ ...(response || {}), date: response?.request_date || date, reason, status: response?.status || "Pending" }, ...current]);
      setDate("");
      setReason("");
    } catch (err: any) {
      setError(err?.error || err?.message || String(err) || "Could not submit the request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="barber-module-view">
      <div className="barber-page-intro"><div><p className="admin-eyebrow">TIME OFF</p><h2>Ask for a day off</h2><p>Send your request to the owner here.</p></div></div>
      <div className="barber-dayoff-layout">
        <section className="admin-module-card barber-dayoff-form"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">NEW REQUEST</p><h3>Which day do you need off?</h3></div><span className="barber-form-badge"><FiCalendar /> Owner checks this</span></div><form onSubmit={handleSubmit}><label className="barber-field"><span>Date</span><input className="admin-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className="barber-field"><span>Reason</span><textarea className="admin-input barber-textarea" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Write a short reason" rows={4} required /></label>{error && <div className="admin-inline-error">{error}</div>}<button className="admin-primary-button" type="submit" disabled={saving}><FiSend /> {saving ? "Sending…" : "Send request"}</button></form></section>
        <section className="admin-module-card barber-dayoff-list"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">MY REQUESTS</p><h3>Days off</h3></div><span className="admin-toolbar-note">{allRequests.length} total</span></div>{allRequests.map((request, index) => <article className="barber-dayoff-row" key={request.id || `${request.date}-${index}`}><span className="barber-dayoff-icon"><FiClock /></span><div><strong>{formatDate(request.date || request.request_date)}</strong><small>{request.reason || "No reason added"}</small></div><span className={`admin-status-pill ${String(request.status || "Pending").toLowerCase() === "approved" ? "is-paid" : String(request.status || "Pending").toLowerCase() === "rejected" ? "is-cancelled" : "is-pending"}`}>{request.status || "Pending"}</span></article>)}{!allRequests.length && <div className="barber-empty-panel"><FiCheckCircle /><strong>No requests yet</strong><span>Your day-off requests show here.</span></div>}</section>
      </div>
    </section>
  );
};

export default DayOffRequests;
