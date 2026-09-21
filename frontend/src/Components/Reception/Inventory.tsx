import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiBox, FiMinus, FiPlus, FiRefreshCw, FiTrendingUp, FiX } from "react-icons/fi";
import { useAppSelector } from "../../app/hooks";
import axiosInstance from "../../api/axios";
import DeskModal from "./DeskModal";
import { errorText } from "./desk";

type InventoryItem = { id: number; name: string; sku?: string; category: string; quantity: number | string; reorder_level: number | string; unit: string; unit_cost: number | string; supplier?: string; low_stock?: boolean; stock_value?: number | string };
const blankItem = { name: "", sku: "", category: "Supplies", quantity: 0, reorderLevel: 5, unit: "items", unitCost: 0, supplier: "" };

const Inventory: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const currency = user?.shop?.currency || "ETB";
  const plusAlerts = true;
  const [adjustment, setAdjustment] = useState<InventoryItem | null>(null);
  const [movement, setMovement] = useState({ kind: "Stock received", quantity: "" });
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [form, setForm] = useState(blankItem);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const money = (value: number | string) => `${currency} ${Number(value || 0).toFixed(2)}`;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const response = await axiosInstance.get("/receptionist/inventory"); setItems(response.data || []); }
    catch (requestError: any) { setError(typeof requestError === "string" ? requestError : "Unable to load inventory."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => ({ low: items.filter((item) => item.low_stock).length, value: items.reduce((sum, item) => sum + Number(item.stock_value || 0), 0) }), [items]);
  const createItem = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    try { await axiosInstance.post("/receptionist/inventory", form); setForm(blankItem); setShowForm(false); await load(); }
    catch (requestError: any) { setError(typeof requestError === "string" ? requestError : "Unable to add inventory item."); }
  };
  const adjust = async (item: InventoryItem, quantityChange: number) => {
    setError(null); setBusy(true);
    try { await axiosInstance.post(`/receptionist/inventory/${item.id}/adjust`, { quantityChange, reason: movement.kind }); setAdjustment(null); await load(); }
    catch (requestError: unknown) { setError(errorText(requestError)); }
    finally { setBusy(false); }
  };

  return <section className="reception-module-view desk-module">
    <header className="admin-module-header"><div><p className="admin-eyebrow">SHOP SUPPLIES</p><h2 className="admin-module-title">Stock</h2><p className="admin-module-subtitle">Add towels, products, blades, and other shop supplies here.</p></div><button className="admin-primary-button" onClick={() => setShowForm((value) => !value)}>{showForm ? <FiX /> : <FiPlus />} {showForm ? "Close" : "Add item"}</button></header>
    <div className="admin-module-stats"><div className="admin-stat-mini"><span className="admin-stat-mini-icon indigo"><FiBox /></span><div><small>Stock items</small><strong>{items.length}</strong></div></div><div className="admin-stat-mini"><span className="admin-stat-mini-icon orange"><FiAlertTriangle /></span><div><small>Low stock</small><strong>{plusAlerts ? summary.low : "Plus"}</strong></div></div><div className="admin-stat-mini"><span className="admin-stat-mini-icon green"><FiTrendingUp /></span><div><small>Stock value</small><strong>{money(summary.value)}</strong></div></div></div>
    {!plusAlerts && <div className="reception-plan-note"><FiAlertTriangle /><span><strong>Mirror Plus or Max</strong> adds automatic low-stock alerts and supplier visibility.</span></div>}
    {showForm && <form className="admin-form-panel" onSubmit={createItem}><div className="admin-form-heading"><div><p className="admin-card-kicker">NEW STOCK ITEM</p><h3>Add an item to track</h3></div></div><div className="admin-form-grid admin-form-grid-three"><label className="admin-field"><span>Item name</span><input className="admin-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label className="admin-field"><span>Type</span><select className="admin-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Supplies</option><option>Retail</option><option>Cleaning</option><option>Equipment</option></select></label><label className="admin-field"><span>How many now?</span><input className="admin-input" type="number" min="0" step="0.01" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} /></label><label className="admin-field"><span>Buy more when it reaches</span><input className="admin-input" type="number" min="0" step="0.01" value={form.reorderLevel} onChange={(event) => setForm({ ...form, reorderLevel: Number(event.target.value) })} /></label><label className="admin-field"><span>Unit</span><input className="admin-input" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /></label><label className="admin-field"><span>Cost for one unit</span><input className="admin-input" type="number" min="0" step="0.01" value={form.unitCost} onChange={(event) => setForm({ ...form, unitCost: Number(event.target.value) })} /></label></div><div className="admin-form-actions"><button className="admin-primary-button" type="submit"><FiPlus /> Add item</button></div></form>}
    {error && <div className="admin-inline-error">{error}</div>}
    <section className="admin-module-card"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">CURRENT STOCK</p><h3>Reception inventory</h3></div><button className="admin-inline-link" onClick={load}><FiRefreshCw /> Refresh</button></div>{loading && <div className="admin-inline-state">Loading inventory…</div>}<div className="reception-stock-list">{items.map((item) => <article className="reception-stock-row" key={item.id}><span className={`reception-stock-icon ${item.low_stock && plusAlerts ? "is-low" : ""}`}><FiBox /></span><div><strong>{item.name}</strong><span>{item.category}{item.supplier && plusAlerts ? ` · ${item.supplier}` : ""}</span></div><div className="reception-stock-quantity"><strong>{Number(item.quantity)} {item.unit}</strong><small>{money(item.stock_value || 0)} value</small></div>{item.low_stock && plusAlerts && <span className="admin-status-pill is-pending">Low stock</span>}<div className="reception-stock-actions"><button disabled={busy} onClick={() => { setAdjustment(item); setMovement({ kind: "Stock used", quantity: "" }); setError(null); }} aria-label={`Use one ${item.name}`}><FiMinus /></button><button disabled={busy} onClick={() => { setAdjustment(item); setMovement({ kind: "Stock received", quantity: "" }); setError(null); }} aria-label={`Add one ${item.name}`}><FiPlus /></button></div></article>)}{!loading && !items.length && <div className="admin-empty-state">Add the first item to start tracking shop supplies.</div>}</div></section>
    {adjustment && <DeskModal title={`Update stock · ${adjustment.name}`} busy={busy} onClose={() => setAdjustment(null)}><form className="desk-form" onSubmit={event => { event.preventDefault(); adjust(adjustment, Number(movement.quantity) * (movement.kind === "Stock received" ? 1 : -1)); }}><label className="admin-field">Stock movement<select className="admin-input" value={movement.kind} onChange={e => setMovement({ ...movement, kind: e.target.value })}><option>Stock received</option><option>Stock used</option><option>Damaged or wasted</option></select></label><label className="admin-field">Quantity ({adjustment.unit})<input className="admin-input" type="number" required min="0.01" step="0.01" value={movement.quantity} onChange={e => setMovement({ ...movement, quantity: e.target.value })} /></label><p className="desk-help">Current stock: {Number(adjustment.quantity)} {adjustment.unit}. Record any purchase payment separately in Expenses.</p>{error && <div className="admin-inline-error">{error}</div>}<button className="admin-primary-button" disabled={busy}>{busy ? "Saving…" : "Save stock movement"}</button></form></DeskModal>}
  </section>;
};

export default Inventory;
