import React, { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiCheck, FiClock, FiRefreshCw, FiUser, FiX, FiXCircle } from "react-icons/fi";
import axiosInstance from "../../api/axios";

type DayOffRequest = {
  id: string | number;
  barber_id?: string | number;
  barber_name?: string;
  barberName?: string;
  request_date?: string;
  date?: string;
  status?: string;
  reason?: string;
  created_at?: string;
};

const safeDate = (value: unknown) => {
  if (!value) return "Date not set";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "Date not set" : new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(date);
};

const DayOffRequests: React.FC = () => {
  const [requests, setRequests] = useState<DayOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/admin/dayoff");
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (requestError: any) {
      setError(typeof requestError === "string" ? requestError : requestError?.response?.data?.error || "Could not load day-off requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const counts = useMemo(() => {
    const status = (request: DayOffRequest) => String(request.status || "pending").toLowerCase();
    return {
      total: requests.length,
      pending: requests.filter((request) => status(request) === "pending").length,
      approved: requests.filter((request) => status(request) === "approved").length,
      rejected: requests.filter((request) => status(request) === "rejected" || status(request) === "denied").length,
    };
  }, [requests]);

  const handleDecision = async (id: string | number, status: "Approved" | "Rejected") => {
    try {
      await axiosInstance.put(`/admin/dayoff/${id}`, { status });
      setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
    } catch (requestError: any) {
      setError(typeof requestError === "string" ? requestError : requestError?.response?.data?.error || "Could not save this request.");
    }
  };

  return (
    <section className="admin-module-view">
      <header className="admin-module-header">
        <div>
          <p className="admin-eyebrow">TIME OFF</p>
          <h2 className="admin-module-title">Staff day-off requests</h2>
          <p className="admin-module-subtitle">Check each request and choose yes or no.</p>
        </div>
        <button className="admin-secondary-button" onClick={loadRequests}><FiRefreshCw /> <span>Refresh</span></button>
      </header>

      <div className="admin-module-stats">
        <div className="admin-stat-mini"><span className="admin-stat-mini-icon indigo"><FiCalendar /></span><div><small>All requests</small><strong>{counts.total}</strong></div></div>
        <div className="admin-stat-mini"><span className="admin-stat-mini-icon orange"><FiClock /></span><div><small>Waiting for you</small><strong>{counts.pending}</strong></div></div>
        <div className="admin-stat-mini"><span className="admin-stat-mini-icon green"><FiCheck /></span><div><small>Approved</small><strong>{counts.approved}</strong></div></div>
        <div className="admin-stat-mini"><span className="admin-stat-mini-icon red"><FiXCircle /></span><div><small>Rejected</small><strong>{counts.rejected}</strong></div></div>
      </div>

      <section className="admin-module-card">
        <div className="admin-module-toolbar"><div><p className="admin-card-kicker">REQUESTS</p><h3>Choose yes or no</h3></div><span className="admin-toolbar-note">{counts.pending} waiting</span></div>
        {loading && <div className="admin-inline-state">Loading requests…</div>}
        {error && <div className="admin-inline-error">{error}</div>}
        {!loading && !requests.length && <div className="admin-empty-state">No day-off requests are waiting.</div>}
        <div className="admin-request-list">
          {requests.map((request) => {
            const status = String(request.status || "Pending");
            const normalized = status.toLowerCase();
            const barberName = request.barber_name || request.barberName || `Stylist #${request.barber_id ?? "—"}`;
            return <article className="admin-request-card" key={request.id}>
              <div className="admin-request-icon"><FiCalendar /></div>
              <div className="admin-request-content"><div className="admin-request-heading"><div><strong>{barberName}</strong><span><FiUser /> Asked for a day off</span></div><span className={`admin-status-pill ${normalized === "approved" ? "is-paid" : normalized === "rejected" || normalized === "denied" ? "is-rejected" : "is-pending"}`}>{status}</span></div><p>{safeDate(request.request_date || request.date)}</p><small>{request.reason || "No reason added."}</small></div>
              {normalized === "pending" && <div className="admin-request-actions"><button className="admin-approve-button" onClick={() => handleDecision(request.id, "Approved")}><FiCheck /> Approve</button><button className="admin-reject-button" onClick={() => handleDecision(request.id, "Rejected")}><FiX /> Deny</button></div>}
            </article>;
          })}
        </div>
      </section>
    </section>
  );
};

export default DayOffRequests;
