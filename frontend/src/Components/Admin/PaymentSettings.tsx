import { useState } from 'react';
import { FiPlus, FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import api from '../../api/axios';
import { useDeskResource, type FinanceSettings, type Daily, amount, methodName, errorText } from '../Reception/desk';
import DeskModal from '../Reception/DeskModal';
import ClosingDetails from './ClosingDetails';

type Closing={id:number;business_date:string;reopened_at:string|null;snapshot:Daily;notes:string};
export default function PaymentSettings() {
  const settings=useDeskResource<FinanceSettings>('/admin/finance');
  const closings=useDeskResource<Closing[]>('/admin/finance/closings');
  const [form,setForm]=useState({name:'',method:'cash',reference:''});
  const [show,setShow]=useState(false);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const [busy,setBusy]=useState(false);
  const [reopen,setReopen]=useState<Closing|null>(null);
  const [reason,setReason]=useState('');
  const save=async(action:()=>Promise<unknown>,message:string,done?:()=>void)=>{
    setBusy(true);setError('');setSuccess('');
    try {await action();done?.();setSuccess(message);await Promise.all([settings.refresh(),closings.refresh()]);}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  return <section className="admin-module-view desk-module">
    <header className="admin-module-header"><div><p className="admin-eyebrow">HOW YOU RECEIVE MONEY</p><h2 className="admin-module-title">Payment accounts and VAT</h2><p className="admin-module-subtitle">Choose where reception records cash, bank, and Telebirr payments.</p></div><button className="admin-primary-button" onClick={()=>{setShow(true);setError('');}}><FiPlus/> Add account</button></header>
    {(error||settings.error||closings.error)&&!show&&!reopen&&<div className="admin-inline-error" role="alert">{error||settings.error||closings.error}</div>}
    {success&&<div className="desk-success" role="status"><FiCheckCircle/> {success}</div>}
    {settings.loading&&<p>Loading collection settings…</p>}
    <section className="admin-module-card"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">RECEPTION USES THESE</p><h3>Payment methods</h3></div></div><div className="desk-account-list">{settings.data?.accounts.map(a=><article className="desk-account-row" key={a.id}><span className="reception-action-icon indigo"><FiCreditCard/></span><div><strong>{a.method==='cash'?'Cash':a.name}</strong><span>{methodName(a.method)}{a.method!=='cash'&&a.reference?` · ${a.reference}`:''}</span><small>{a.active?'Can be used for payments':'Turned off · old payments stay in reports'}</small></div><button disabled={busy} className="admin-secondary-button" onClick={()=>save(()=>api.put(`/admin/finance/accounts/${a.id}`,{active:!a.active}),a.active?'Payment method turned off. Old payments stay saved.':'Payment method turned on.')}>{a.active?'Turn off':'Turn on'}</button></article>)}</div>{settings.data&&!settings.data.accounts.length&&<div className="admin-empty-state">Turn on Cash or add a bank or Telebirr account before reception takes the first payment.</div>}</section>
    <section className="admin-module-card desk-vat-card"><div><p className="admin-card-kicker">VAT WHEN TAKING PAYMENT</p><h3>Optional 15% VAT · off by default</h3><p>Reception can tick “Add 15% VAT” when taking a payment. Receipts and daily totals show service money and VAT separately.</p></div></section>
    <section className="admin-module-card"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">OWNER CONTROL</p><h3>Recent daily closings</h3></div></div>{closings.data?.map(c=><details className="owner-closing-review" key={c.id}><summary><span><strong>{c.business_date}</strong><small>{amount(c.snapshot.collected,c.snapshot.currency)} collected · {c.reopened_at?'Reopened':'Closed'}</small></span><span className="owner-badge">View totals</span></summary><ClosingDetails snapshot={c.snapshot}/><p className="owner-note">Handover: {c.notes||'No handover note'}</p>{!c.reopened_at&&<button className="admin-secondary-button" onClick={()=>{setReopen(c);setReason('');setError('');}}>Reopen day</button>}</details>)}{!closings.loading&&!closings.data?.length&&<div className="admin-empty-state">Reception’s saved daily closings will appear here.</div>}</section>
    {show&&<DeskModal title={form.method==='cash'?'Enable cash payments':'Add a payment account'} busy={busy} onClose={()=>setShow(false)}><form onSubmit={e=>{e.preventDefault();save(()=>api.post('/admin/finance/accounts',form),'Payment method saved.',()=>{setShow(false);setForm({name:'',method:'cash',reference:''});});}} className="desk-form"><label className="admin-field">Payment method<select className="admin-input" value={form.method} onChange={e=>setForm({...form,method:e.target.value})}><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="telebirr">Telebirr</option></select></label>{form.method==='cash'?<div className="desk-notice">Cash uses one shared cash record. You do not need an account name, account number, or phone number.</div>:<><label className="admin-field">Account name<input className="admin-input" required maxLength={100} placeholder={form.method==='telebirr'?'e.g. Shop Telebirr':'e.g. CBE shop account'} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label className="admin-field">{form.method==='telebirr'?'Telebirr phone or merchant number':'Bank account number'}<input className="admin-input" required maxLength={100} value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})}/></label></>}<p className="desk-help">Reception chooses the payment method after money arrives. Bank transfer and Telebirr use these details when closing the day.</p>{error&&<div className="admin-inline-error" role="alert">{error}</div>}<button disabled={busy} className="admin-primary-button">{busy?'Saving…':form.method==='cash'?'Enable Cash':'Create account'}</button></form></DeskModal>}
    {reopen&&<DeskModal title={`Reopen ${reopen.business_date}`} busy={busy} onClose={()=>setReopen(null)}><form className="desk-form" onSubmit={e=>{e.preventDefault();save(()=>api.post(`/admin/finance/closings/${reopen.id}/reopen`,{reason}),'Day reopened. The previous closing is retained in history.',()=>setReopen(null));}}><p className="desk-help">This allows reception to record changes and close the day again. The previous closing remains in history.</p><label className="admin-field">Reason<textarea className="admin-input" required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label>{error&&<div className="admin-inline-error">{error}</div>}<button className="admin-primary-button" disabled={busy}>Reopen day</button></form></DeskModal>}
  </section>;
}
