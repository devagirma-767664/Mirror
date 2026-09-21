import React, { useEffect, useMemo, useState } from "react";
import { FiClock, FiDollarSign, FiEdit3, FiHash, FiPackage, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { addService, deleteService, fetchServices, updateService } from "../../features/services/servicesThunks";
import { amount } from '../Reception/desk';

type ServiceRecord = {
  id: string | number;
  name: string;
  price: number | string;
  duration: number | string;
  description?: string;
  image_url?: string | null;
};

const ServicesManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const currency = useAppSelector(state => state.auth.user?.shop?.currency) || 'ETB';
  const money = (value: number | string) => amount(value, currency);
  const { list, loading, error } = useAppSelector((state) => state.services);
  const services = (list || []) as ServiceRecord[];
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [duration, setDuration] = useState(30);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  const summary = useMemo(() => ({
    total: services.length,
    average: services.length ? services.reduce((sum, service) => sum + Number(service.price || 0), 0) / services.length : 0,
    shortest: services.length ? Math.min(...services.map((service) => Number(service.duration || 0))) : 0,
    longest: services.length ? Math.max(...services.map((service) => Number(service.duration || 0))) : 0,
  }), [services]);

  const resetForm = () => {
    setName("");
    setPrice(0);
    setDuration(30);
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editId) {
        await dispatch(updateService({ id: editId, name, price, duration })).unwrap();
      } else {
        await dispatch(addService({ name, price, duration })).unwrap();
      }
      resetForm();
    } catch {
      // The slice keeps the server error visible above the list.
    }
  };

  const handleEdit = (service: ServiceRecord) => {
    setEditId(String(service.id));
    setName(service.name);
    setPrice(Number(service.price || 0));
    setDuration(Number(service.duration || 30));
    setShowForm(true);
  };

  return (
    <section className="admin-module-view">
      <header className="admin-module-header">
        <div>
          <p className="admin-eyebrow">YOUR SERVICES</p>
          <h2 className="admin-module-title">Services and prices</h2>
          <p className="admin-module-subtitle">Add the services you offer and the price for each one.</p>
        </div>
        <button className="admin-primary-button" onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}>
          {showForm ? <FiX /> : <FiPlus />} <span>{showForm ? "Close form" : "Add service"}</span>
        </button>
      </header>

      <div className="admin-module-stats">
        <div className="admin-stat-mini"><span className="admin-stat-mini-icon indigo"><FiPackage /></span><div><small>Services</small><strong>{summary.total}</strong></div></div>
        <div className="admin-stat-mini"><span className="admin-stat-mini-icon purple"><FiDollarSign /></span><div><small>Average price</small><strong>{money(summary.average)}</strong></div></div>
        <div className="admin-stat-mini"><span className="admin-stat-mini-icon orange"><FiClock /></span><div><small>Quickest service</small><strong>{summary.shortest || 0}<em> min</em></strong></div></div>
        <div className="admin-stat-mini"><span className="admin-stat-mini-icon green"><FiHash /></span><div><small>Longest service</small><strong>{summary.longest || 0}<em> min</em></strong></div></div>
      </div>

      {showForm && (
        <form className="admin-form-panel" onSubmit={handleSubmit}>
          <div className="admin-form-heading"><div><p className="admin-card-kicker">{editId ? "EDIT SERVICE" : "NEW SERVICE"}</p><h3>{editId ? "Change a service" : "Add a service"}</h3></div><span className="admin-form-note">You can change prices any time.</span></div>
          <div className="admin-form-grid admin-form-grid-three">
            <label className="admin-field"><span>Service name</span><input className="admin-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Classic haircut" required /></label>
            <label className="admin-field"><span>Price ({currency})</span><input className="admin-input" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(Number(event.target.value))} required /></label>
            <label className="admin-field"><span>Duration</span><div className="admin-input-with-icon"><FiClock /><input className="admin-input" type="number" min="5" step="5" value={duration} onChange={(event) => setDuration(Number(event.target.value))} required /></div></label>
          </div>
          {error && <div className="admin-inline-error" role="alert">{String(error)}</div>}
          <div className="admin-form-actions"><button type="button" className="admin-secondary-button" disabled={loading} onClick={resetForm}>Cancel</button><button type="submit" disabled={loading} className="admin-primary-button">{editId ? <FiEdit3 /> : <FiPlus />} {loading ? 'Saving…' : editId ? "Save changes" : "Add service"}</button></div>
        </form>
      )}

      <section className="admin-module-card">
        <div className="admin-module-toolbar"><div><p className="admin-card-kicker">CURRENT SERVICES</p><h3>Services customers can choose</h3></div><span className="admin-toolbar-note">{services.length} services</span></div>
        {loading && <div className="admin-inline-state">Loading services…</div>}
        {error && <div className="admin-inline-error">{typeof error === "string" ? error : "Unable to load services."}</div>}
        {!loading && !services.length && <div className="admin-empty-state">Add your first service here.</div>}
        <div className="admin-service-list">
          {services.map((service) => (
            <div className="admin-service-row" key={service.id}>
              <div className="admin-service-icon"><FiScissorsMark /></div>
              <div className="admin-service-main"><strong>{service.name}</strong><span>{service.description || "Available for customers to choose."}</span></div>
              <div className="admin-service-detail"><small>Price</small><strong>{money(service.price)}</strong></div>
              <div className="admin-service-detail"><small>Duration</small><strong>{service.duration} min</strong></div>
              <div className="admin-row-actions"><button className="admin-quiet-icon" title={`Edit ${service.name}`} onClick={() => handleEdit(service)}><FiEdit3 /></button><button className="admin-danger-icon" title={`Remove ${service.name}`} onClick={() => dispatch(deleteService(String(service.id)))}><FiTrash2 /></button></div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
};

const FiScissorsMark = () => <span className="admin-service-glyph">✂</span>;

export default ServicesManagement;
