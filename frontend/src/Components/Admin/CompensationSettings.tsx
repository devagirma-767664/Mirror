import { useEffect, useState } from 'react';
import { FiCheckCircle, FiSave } from 'react-icons/fi';
import api from '../../api/axios';
import { useDeskResource, errorText } from '../Reception/desk';
import { useAppSelector } from '../../app/hooks';

type Setting = {
  barberId: number;
  barberName: string;
  mode: 'salary' | 'commission' | 'hybrid';
  commissionRate: number;
  salaryAmount: number;
  showSalaryToBarber: boolean;
  payDay:number;
  periodType: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  periodAnchor: string;
  customStart: string | null;
  customEnd: string | null;
  effectiveFrom: string;
};
type Draft = Omit<Setting, 'barberId' | 'barberName'>;
const today = () => new Date().toISOString().slice(0, 10);
const draftFor = (setting: Setting): Draft => ({ mode: setting.mode, commissionRate: setting.commissionRate, salaryAmount: setting.salaryAmount, showSalaryToBarber: setting.showSalaryToBarber, payDay:setting.payDay || 30, periodType: setting.periodType, periodAnchor: setting.periodAnchor || today(), customStart: setting.customStart, customEnd: setting.customEnd, effectiveFrom: setting.effectiveFrom || today() });

export default function CompensationSettings() {
  const currency = useAppSelector(state => state.auth.user?.shop?.currency) || 'ETB';
  const resource = useDeskResource<Setting[]>('/admin/compensation', 30000);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { if (resource.data) setDrafts(current => Object.fromEntries(resource.data!.map(setting => [setting.barberId, current[setting.barberId] || draftFor(setting)]))); }, [resource.data]);
  const update = (id: number, key: keyof Draft, value: string | boolean) => setDrafts(current => ({ ...current, [id]: { ...current[id], [key]: value } }));
  const save = async (id: number) => {
    setSaving(id); setError(''); setSuccess('');
    try {
      const draft=drafts[id];
      const response=await api.put<Setting>(`/admin/compensation/${id}`, {...draft, ...(draft.mode==='salary'?{periodType:'monthly',customStart:null,customEnd:null}:{})});
      setDrafts(current=>({...current,[id]:draftFor(response.data)}));
      setSuccess('Pay rules saved. New payments will use this rule.'); await resource.refresh();
    }
    catch (requestError) { setError(errorText(requestError)); }
    finally { setSaving(null); }
  };
  return <section className="admin-module-view desk-module">
    <header className="admin-module-header"><div><p className="admin-eyebrow">STYLIST PAY</p><h2 className="admin-module-title">How staff are paid</h2><p className="admin-module-subtitle">Choose monthly salary, a percentage of service sales, or both. Stylists only see their own pay.</p></div></header>
    {(error || resource.error) && <div className="admin-inline-error" role="alert">{error || resource.error}</div>}
    {success && <div className="desk-success" role="status"><FiCheckCircle /> {success}</div>}
    {resource.loading && !resource.data && <p>Loading stylist pay rules…</p>}
    <div className="admin-compensation-list">{resource.data?.map(setting => { const draft = drafts[setting.barberId] || draftFor(setting); const variable = draft.mode !== 'salary'; const fixed = draft.mode !== 'commission'; return <form className="admin-compensation-card admin-module-card" key={setting.barberId} onSubmit={event=>{event.preventDefault();void save(setting.barberId);}}>
      <div className="admin-compensation-card-heading"><div><p className="admin-card-kicker">STYLIST</p><h3>{setting.barberName}</h3></div><span className="admin-status-pill is-active">{draft.mode === 'hybrid' ? 'Salary + percentage' : draft.mode === 'commission' ? 'Percentage' : 'Salary only'}</span></div>
      <fieldset className="owner-form-fields" disabled={saving!==null}>
      <div className="admin-compensation-grid">
        <label className="admin-field">How to pay<select className="admin-input" value={draft.mode} onChange={event => update(setting.barberId, 'mode', event.target.value)}><option value="salary">Monthly salary only</option><option value="commission">Percentage of service sales</option><option value="hybrid">Salary + percentage</option></select></label>
        {variable && <label className="admin-field">Percentage of service sales (%)<input className="admin-input" required type="number" min="0" max="100" step="0.01" value={draft.commissionRate} onChange={event => update(setting.barberId, 'commissionRate', event.target.value)} /></label>}
        {fixed && <label className="admin-field">Monthly salary ({currency})<input className="admin-input" required type="number" min="0" max="999999999" step="0.01" value={draft.salaryAmount} onChange={event => update(setting.barberId, 'salaryAmount', event.target.value)} /></label>}
        <label className="admin-field">Pay on Ethiopian day<select className="admin-input" value={draft.payDay} onChange={event=>update(setting.barberId,'payDay',event.target.value)}>{Array.from({length:30},(_,i)=>i+1).map(day=><option value={day} key={day}>Day {day}</option>)}</select><small>Payroll uses this day in the Ethiopian calendar.</small></label>
        {variable && <label className="admin-field">Show earnings for<select className="admin-input" value={draft.periodType} onChange={event => update(setting.barberId, 'periodType', event.target.value)}><option value="weekly">Each week</option><option value="biweekly">Every 2 weeks</option><option value="monthly">Each month</option><option value="custom">Chosen dates</option></select></label>}
        {variable && draft.periodType !== 'monthly' && draft.periodType !== 'custom' && <label className="admin-field">Period starts on<input className="admin-input" required type="date" value={draft.periodAnchor} onChange={event => update(setting.barberId, 'periodAnchor', event.target.value)} /></label>}
        {variable && draft.periodType === 'custom' && <><label className="admin-field">Custom start<input className="admin-input" required type="date" value={draft.customStart || ''} onChange={event => update(setting.barberId, 'customStart', event.target.value)} /></label><label className="admin-field">Custom end<input className="admin-input" required type="date" min={draft.customStart||undefined} value={draft.customEnd || ''} onChange={event => update(setting.barberId, 'customEnd', event.target.value)} /></label></>}
      </div>
      {draft.mode === 'hybrid' && <label className="desk-checkbox admin-compensation-checkbox"><input type="checkbox" checked={draft.showSalaryToBarber} onChange={event => update(setting.barberId, 'showSalaryToBarber', event.target.checked)} /> Show the monthly salary on the stylist page</label>}
      {draft.mode === 'salary' && <p className="desk-help">Stylists paid only by salary do not need an earnings card. Their pay stays on this page.</p>}
      {variable && <p className="desk-help">The percentage uses service money paid at reception. VAT is not included. New payments use the new rule. Past pay stays the same.</p>}
      <div className="admin-compensation-actions"><button type="submit" className="admin-primary-button" disabled={saving !== null || !drafts[setting.barberId]}><FiSave /> {saving === setting.barberId ? 'Saving…' : 'Save pay rule'}</button></div>
      </fieldset>
    </form>; })}</div>
    {!resource.loading && resource.data && !resource.data.length && <div className="admin-empty-state">Add a stylist account first, then set their pay rule here.</div>}
  </section>;
}
