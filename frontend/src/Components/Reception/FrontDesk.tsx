import { useState } from 'react';
import { FiPlus, FiCreditCard, FiCheck, FiClock, FiScissors } from 'react-icons/fi';
import api from '../../api/axios';
import Checkout from './Checkout';
import DeskModal from './DeskModal';
import {useDeskResource,type Board,type Visit,type Service,type FinanceSettings,type Daily,amount,visitName,dateTime,methodName,errorText} from './desk';

export default function FrontDesk({assignOpen,setAssignOpen,onPayments,onClosing,onStock}:{assignOpen:boolean;setAssignOpen:(value:boolean)=>void;onPayments:()=>void;onClosing:()=>void;onStock:()=>void}) {
  const board=useDeskResource<Board>('/receptionist/desk');
  const services=useDeskResource<Service[]>('/services',30000);
  const finance=useDeskResource<FinanceSettings>('/receptionist/finance');
  const daily=useDeskResource<Daily>('/receptionist/daily');
  const stock=useDeskResource<Array<{id:number;low_stock:boolean}>>('/receptionist/inventory',30000);
  const [barberId,setBarberId]=useState('');
  const [nickname,setNickname]=useState('');
  const [selectedIds,setSelectedIds]=useState<number[]>([]);
  const [checkout,setCheckout]=useState<Visit|null>(null);
  const [cancel,setCancel]=useState<Visit|null>(null);
  const [reason,setReason]=useState('Customer left before service');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const currency=finance.data?.currency||'ETB';
  const refresh=async()=>{await Promise.all([board.refresh(),daily.refresh()]);};
  const run=async(action:()=>Promise<unknown>,message:string,done?:()=>void)=>{
    setBusy(true);setError('');setSuccess('');try{await action();done?.();setSuccess(message);await refresh();}catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const closeAssign=()=>{setAssignOpen(false);setBarberId('');setNickname('');setSelectedIds([]);setError('');};
  const openAssign=(id='')=>{setBarberId(id);setNickname('');setSelectedIds([]);setError('');setAssignOpen(true);};
  const lowStock=stock.data?.filter(s=>s.low_stock).length||0;
  return <div className="desk-module">
    {(error||board.error||finance.error||daily.error)&&!assignOpen&&!checkout&&!cancel&&<div className="admin-inline-error" role="alert">{error||board.error||finance.error||daily.error}</div>}
    {success&&<div className="desk-success" role="status"><FiCheck/> {success}</div>}
    {daily.data?.closing&&<div className="desk-notice">Today is closed. If another customer comes, the owner can open the day again in Payment settings.</div>}
    {finance.data&&!finance.data.accounts.length&&<div className="desk-notice">The owner needs to add Cash, bank, or Telebirr before you take a payment.</div>}
    <div className="desk-today-strip"><span><b>{board.data?.visits.length||0}</b> customers in line</span><button className="admin-inline-link" onClick={onPayments}>Payments <FiCreditCard/></button><span><FiClock/> Refreshes itself</span></div>
    {Number(daily.data?.pending.count)>0&&<div className="desk-notice">{daily.data!.pending.count} customers are waiting to pay. <button className="admin-inline-link" onClick={onPayments}>Take payment</button></div>}
    <section><div className="desk-section-heading"><div><p className="admin-card-kicker">SEND → TAKE PAYMENT</p><h2>Stylist list</h2></div><button className="admin-secondary-button" disabled={!!daily.data?.closing} onClick={()=>openAssign()}><FiPlus/> Walk-in</button></div>
      <p className="desk-help">Send each customer to their stylist. Take payment when they come back after service.</p>
      {board.loading&&<div className="admin-inline-state">Loading customers…</div>}
      <div className="desk-barber-grid">{board.data?.barbers.map(barber=>{
        const visits=board.data!.visits.filter(v=>v.barber_id===barber.id).sort((a,b)=>new Date(a.start_time).getTime()-new Date(b.start_time).getTime()||a.id-b.id);
        const status=barber.desk_status==='break'?'On break':barber.desk_status==='away'?'Away':'Available';
        return <article className="desk-barber-card" key={barber.id}><div className="desk-barber-heading"><span className="desk-barber-avatar">{barber.name.slice(0,1)}</span><div><h3>{barber.name}</h3><span className={`desk-presence ${status==='Available'?'is-free':''}`}>{status} · {visits.length} in line</span></div><select className="desk-presence-select" aria-label={`${barber.name} availability`} disabled={busy} value={barber.desk_status} onChange={e=>run(()=>api.put(`/receptionist/desk/barbers/${barber.id}`,{status:e.target.value}),`${barber.name}'s availability updated.`)}><option value="available">Available</option><option value="break">On break</option><option value="away">Away</option></select></div>
          <div className="desk-waiting-list">{visits.map((v,i)=><div className="desk-waiting-row desk-assigned-row" key={v.id}><span className="desk-queue-number" title="Place in line">{i+1}</span><div><strong>{visitName(v)}</strong><small>{v.service_name}</small><small>Sent {dateTime(v.start_time)}</small></div><div className="desk-assigned-actions"><button className="admin-primary-button" disabled={busy||!!daily.data?.closing} aria-label={`Collect payment for ${visitName(v)}`} onClick={()=>{setCheckout(v);setSuccess('');}}><FiCreditCard/> Take payment</button><button className="admin-inline-link" disabled={busy||!!daily.data?.closing} aria-label={`Cancel ${visitName(v)}`} onClick={()=>{setCancel(v);setReason('Customer left before service');setError('');}}>Cancel customer</button></div></div>)}</div>
          {!visits.length&&<div className="desk-chair-empty"><FiScissors/><span>{barber.desk_status==='available'?'Ready for the next customer':'No customers assigned'}</span></div>}
          <button className="desk-add-to-barber" disabled={busy||barber.desk_status==='away'||!!daily.data?.closing} onClick={()=>openAssign(String(barber.id))}><FiPlus/> Add customer</button>
        </article>;
      })}</div>{board.data&&!board.data.barbers.length&&<div className="admin-empty-state">The owner needs to add a stylist before you can send customers.</div>}
    </section>
    <section className="admin-module-card"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">MONEY TODAY</p><h3>{daily.data?amount(daily.data.collected,currency):'Loading…'}</h3></div><button className="admin-inline-link" onClick={onClosing}>Close day</button></div><div className="desk-method-totals">{daily.data?.methods.map(m=><div key={m.method}><span>{methodName(m.method)}</span><strong>{amount(m.collected,currency)}</strong></div>)}</div></section>
    {lowStock>0&&<button className="desk-stock-alert" onClick={onStock}>{lowStock} stock items need attention <span>See stock →</span></button>}
    {assignOpen&&<DeskModal title="Add walk-in customer" busy={busy} onClose={closeAssign}><form className="desk-form" onSubmit={e=>{e.preventDefault();run(()=>api.post('/receptionist/desk/visits',{barberId:Number(barberId),nickname,serviceIds:selectedIds}),'Customer added to the stylist list.',closeAssign);}}><label className="admin-field">Choose stylist<select className="admin-input" required value={barberId} onChange={e=>setBarberId(e.target.value)}><option value="">Choose a stylist</option>{board.data?.barbers.filter(b=>b.desk_status!=='away').map(b=><option key={b.id} value={b.id}>{b.name} · {board.data?.visits.filter(v=>v.barber_id===b.id).length} assigned{b.desk_status==='break'?' · On break':''}</option>)}</select></label><label className="admin-field">Short name <small>Optional — you do not need customer details</small><input className="admin-input" maxLength={100} value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Only if it helps you know the customer"/></label><details className="desk-optional-services"><summary>Choose services now <small>Optional</small></summary><fieldset className="desk-service-picker"><legend>Services</legend><div>{services.data?.map(s=><label className={`desk-service-option ${selectedIds.includes(s.id)?'is-selected':''}`} key={s.id}><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={e=>setSelectedIds(e.target.checked?[...selectedIds,s.id]:selectedIds.filter(id=>id!==s.id))}/><span>{s.name}</span><strong>{amount(s.price,currency)}</strong></label>)}</div>{services.loading&&<p>Loading services…</p>}{services.error&&<p className="desk-warning">{services.error}</p>}</fieldset></details><p className="desk-help">Mirror gives the customer a number. You can choose services when they pay.</p>{error&&<div className="admin-inline-error" role="alert">{error}</div>}<button className="admin-primary-button desk-full" disabled={busy||!barberId||!!board.error||!!daily.data?.closing}>{busy?'Adding…':'Send to stylist'}</button></form></DeskModal>}
    {checkout&&<Checkout target={{visit:checkout}} onClose={()=>setCheckout(null)} onPaid={()=>{void refresh();}}/>}
    {cancel&&<DeskModal title={`Cancel ${visitName(cancel)}`} busy={busy} onClose={()=>setCancel(null)}><form className="desk-form" onSubmit={e=>{e.preventDefault();run(()=>api.put(`/receptionist/desk/visits/${cancel.id}/cancel`,{reason}),'Customer cancelled. No payment was added.',()=>setCancel(null));}}><p className="desk-help">Use this only when the customer leaves before the service. This stays in today’s report.</p><label className="admin-field">Reason<input className="admin-input" maxLength={220} value={reason} onChange={e=>setReason(e.target.value)}/></label>{error&&<div className="admin-inline-error" role="alert">{error}</div>}<button disabled={busy} className="admin-primary-button">{busy?'Cancelling…':'Confirm cancellation'}</button></form></DeskModal>}
  </div>;
}
