import { useState } from 'react';
import { FiCreditCard, FiSearch } from 'react-icons/fi';
import Checkout, { type CheckoutTarget } from './Checkout';
import {useDeskResource,type Bill,type Board,type FinanceSettings,amount,visitName,dateTime,methodName} from './desk';

export default function Billing() {
  const bills=useDeskResource<Bill[]>('/receptionist/bills');
  const board=useDeskResource<Board>('/receptionist/desk');
  const finance=useDeskResource<FinanceSettings>('/receptionist/finance');
  const [selected,setSelected]=useState<CheckoutTarget|null>(null);
  const [tab,setTab]=useState('ready');
  const [query,setQuery]=useState('');
  const currency=finance.data?.currency||'ETB';
  const billed=new Set(bills.data?.map(b=>b.appointment_id)||[]);
  const ready:CheckoutTarget[]=[...(board.data?.visits.filter(v=>!billed.has(v.id)).map(visit=>({visit}))||[]),...(bills.data?.filter(b=>!b.paid).map(bill=>({bill}))||[])];
  const rows:CheckoutTarget[]=tab==='ready'?ready:(bills.data||[]).filter(b=>b.paid).map(bill=>({bill}));
  const filtered=rows.filter(target=>{const item=target.bill||target.visit;return !query||[visitName(item),item.barber_name,item.service_name,target.bill?.payment_account_name].some(v=>v?.toLowerCase().includes(query.toLowerCase()));});
  const loading=bills.loading||board.loading;
  const error=bills.error||board.error||finance.error;
  const refresh=()=>{void bills.refresh();void board.refresh();};
  return <section className="reception-module-view desk-module">
    <header className="admin-module-header"><div><p className="admin-eyebrow">TAKE PAYMENT</p><h2 className="admin-module-title">Payments</h2><p className="admin-module-subtitle">Choose the customer, check the services, then take payment.</p></div></header>
    {error&&<div className="admin-inline-error" role="alert">{error} <button className="admin-inline-link" onClick={()=>{refresh();void finance.refresh();}}>Retry</button></div>}
    <div className="desk-payment-filters"><div className="desk-tabs"><button className={tab==='ready'?'is-active':''} onClick={()=>setTab('ready')}>Ready to pay <b>{ready.length}</b></button><button className={tab==='paid'?'is-active':''} onClick={()=>setTab('paid')}>Paid today</button></div><label className="admin-search-box"><FiSearch/><input aria-label="Find payment" placeholder="Customer, stylist, service, or account" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
    <section className="admin-module-card desk-payments-card"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">{tab==='ready'?'ASSIGNED CUSTOMERS':'COLLECTED PAYMENTS'}</p><h3>{tab==='ready'?`Ready to pay · ${ready.length}`:'Payment history'}</h3></div></div>
      {tab==='ready'&&<p className="desk-help">These customers are waiting or getting service. Take payment only when they come back to reception.</p>}
      {loading&&<div className="admin-inline-state">Loading payments…</div>}
      <div className="desk-payment-list">{filtered.map(target=>{const item=target.bill||target.visit;const bill=target.bill;const subtotal=bill?bill.subtotal??Number(bill.total)-Number(bill.tax||0):target.visit!.service_price;return <article className="desk-payment-row" key={bill?`bill-${bill.id}`:`visit-${item.id}`}><span className="reception-action-icon orange"><FiCreditCard/></span><div><strong>{visitName(item)} · {item.barber_name}</strong><span>{item.service_name}</span><small>{bill?.paid?`${methodName(bill.payment_method||'unknown')} · ${bill.payment_account_name||'Account not recorded'}`:dateTime(bill?bill.generated_at:target.visit!.start_time)}</small></div><strong>{bill?.paid?amount(bill.total,currency):subtotal!=null?amount(subtotal,currency):'Confirm services'}</strong><button className={bill?.paid?'admin-secondary-button':'admin-primary-button'} onClick={()=>setSelected(target)}>{bill?.paid?'Receipt':'Collect payment'}</button></article>;})}</div>
      {!loading&&!error&&!filtered.length&&<div className="admin-empty-state">{query?'No payments match your search.':tab==='ready'?'No customer is waiting to pay. Add a customer from the stylist list.':'Payments taken today will show here.'}</div>}
    </section>
    {selected&&<Checkout target={selected} onClose={()=>setSelected(null)} onPaid={refresh}/>}
  </section>;
}
