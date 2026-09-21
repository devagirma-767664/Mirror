import { useEffect, useRef, useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import api from '../../api/axios';
import { generatePDF } from '../../utils/pdfUtils';
import DeskModal from './DeskModal';
import { useDeskResource, defaultCashAccount, type Visit, type Bill, type Service, type FinanceSettings, amount, visitName, dateTime, methodName, errorText } from './desk';

export type CheckoutTarget = { visit: Visit; bill?: never } | { bill: Bill; visit?: never };

export default function Checkout({target,onClose,onPaid}:{target:CheckoutTarget;onClose:()=>void;onPaid:()=>void}) {
  const finance=useDeskResource<FinanceSettings>('/receptionist/finance');
  const services=useDeskResource<Service[]>('/services',0);
  const visit=target.visit;
  const quoted=visit?.items?.length?visit.items:visit?.service_id?[{service_id:visit.service_id,name:visit.service_name,price:visit.service_price||0}]:[];
  const [ids,setIds]=useState<number[]>(()=>quoted.map(item=>item.service_id));
  const [receipt,setReceipt]=useState<Bill|null>(target.bill?.paid?target.bill:null);
  const [justPaid,setJustPaid]=useState(false);
  const [addVat,setAddVat]=useState(false);
  const [method,setMethod]=useState('cash');
  const [accountId,setAccountId]=useState('');
  const [cashOverride,setCashOverride]=useState<string|null>(null);
  const [reference,setReference]=useState('');
  const [verified,setVerified]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const confirmation=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(justPaid) confirmation.current?.focus();},[justPaid]);
  const currency=finance.data?.currency||'ETB';
  const customer=receipt||target.bill||visit!;
  const menu=[...(services.data||[])];
  quoted.forEach(item=>{if(!menu.some(s=>s.id===item.service_id)) menu.push({id:item.service_id,name:item.name,price:item.price});});
  const price=(id:number)=>quoted.find(item=>item.service_id===id)?.price??menu.find(s=>s.id===id)?.price??0;
  const lines=receipt?.items?.length?receipt.items:receipt?[{name:receipt.service_name,price:receipt.subtotal??Number(receipt.total)-Number(receipt.tax||0)}]:visit?ids.map(id=>({name:quoted.find(s=>s.service_id===id)?.name||menu.find(s=>s.id===id)?.name||'Service',price:price(id)})):target.bill!.items?.length?target.bill!.items:[{name:target.bill!.service_name,price:target.bill!.subtotal??Number(target.bill!.total)-Number(target.bill!.tax||0)}];
  const subtotal=receipt?Number(receipt.subtotal??Number(receipt.total)-Number(receipt.tax||0)):visit?lines.reduce((sum,line)=>sum+Math.round(Number(line.price)*100),0)/100:Number(target.bill!.subtotal??Number(target.bill!.total)-Number(target.bill!.tax||0));
  const tax=receipt?Number(receipt.tax||0):addVat?Math.round(Math.round(subtotal*100)*0.15)/100:0;
  const total=receipt?Number(receipt.total):(Math.round(subtotal*100)+Math.round(tax*100))/100;
  const cash=cashOverride??String(total);
  const accounts=finance.data?.accounts.filter(a=>a.method===method)||[];
  const selectedAccountId=method==='cash'?String(defaultCashAccount(accounts)?.id||''):accountId;
  const pay=async()=>{
    if(busy||receipt) return;
    setBusy(true);setError('');
    try {
      const response=await api.put<Bill>(visit?`/receptionist/desk/visits/${visit.id}/pay`:`/receptionist/bills/${target.bill!.id}/pay`,{
        ...(visit?{serviceIds:ids}:{}),accountId:Number(selectedAccountId),cashReceived:cash,transactionReference:method==='cash'?'':reference,paymentVerified:verified,addVat,expectedTotal:total,
      });
      setReceipt(response.data);setJustPaid(true);onPaid();
    } catch(e){setError(errorText(e));} finally{setBusy(false);}
  };
  return <DeskModal title={receipt?'Payment recorded':'Collect payment'} busy={busy} onClose={onClose}>
    <form className="desk-form" onSubmit={e=>{e.preventDefault();void pay();}}>
      {justPaid&&<div className="desk-payment-success" role="status" tabIndex={-1} ref={confirmation}>
        <svg className="desk-success-tick" viewBox="0 0 72 72" aria-hidden="true"><circle className="desk-tick-circle" cx="36" cy="36" r="31"/><path className="desk-tick-check" d="M21 36l10 10 21-23"/></svg>
        <h3>Payment saved</h3><strong>{amount(total,currency)}</strong><p>{receipt?.payment_method==='cash'?'Cash payment saved.':`Saved in ${receipt?.payment_account_name}.`} This sale is added to {customer.barber_name}’s earnings.</p>
      </div>}
      <div className="desk-visit-summary"><strong>{visitName(customer)} · {customer.barber_name}</strong><span>{receipt?'This sale is added to':'This sale will be added to'} {customer.barber_name}’s earnings</span></div>
      {receipt?<>
        <div className="desk-bill-lines">{lines.map((item,i)=><div key={i}><span>{item.name}</span><strong>{amount(item.price,currency)}</strong></div>)}{tax>0&&<div><span>VAT ({receipt.vat_rate||15}%)</span><strong>{amount(tax,currency)}</strong></div>}<div className="desk-bill-total"><strong>Total paid</strong><strong>{amount(total,currency)}</strong></div></div>
        <p className="desk-help">{methodName(receipt.payment_method||'unknown')}{receipt.payment_method!=='cash'&&` · ${receipt.payment_account_name||'Account not recorded'}`}<br/>{dateTime(receipt.payment_recorded_at||receipt.paid_at)}{receipt.transaction_reference?` · Reference ${receipt.transaction_reference}`:''}</p>
        {receipt.payment_method==='cash'&&receipt.cash_received!=null&&<div className="desk-change"><span>Change to return</span><strong>{amount(Number(receipt.cash_received)-total,currency)}</strong></div>}
        <div className="desk-receipt-actions"><button type="button" className="admin-secondary-button" onClick={()=>generatePDF(receipt,{name:finance.data?.name,currency})}><FiDownload/> Receipt</button><button type="button" className="admin-primary-button" onClick={onClose}>Done</button></div>
      </>:<fieldset className="desk-checkout-fields" disabled={busy}>
        {visit?<fieldset className="desk-service-picker"><legend>Services provided</legend><div>{menu.map(s=><label className={`desk-service-option ${ids.includes(s.id)?'is-selected':''}`} key={s.id}><input type="checkbox" checked={ids.includes(s.id)} onChange={e=>{setIds(e.target.checked?[...ids,s.id]:ids.filter(id=>id!==s.id));setVerified(false);}}/><span>{s.name}</span><strong>{amount(price(s.id),currency)}</strong></label>)}</div>{services.loading&&<p>Loading services…</p>}{services.error&&<div className="admin-inline-error" role="alert">{services.error} <button type="button" className="admin-inline-link" onClick={()=>services.refresh()}>Retry</button></div>}{!services.loading&&!menu.length&&<p>Ask admin to add services before collecting payment.</p>}</fieldset>:<div className="desk-bill-lines">{lines.map((item,i)=><div key={i}><span>{item.name}</span><strong>{amount(item.price,currency)}</strong></div>)}</div>}
        <label className={`desk-checkbox desk-vat-option ${addVat?'is-selected':''}`}><input type="checkbox" checked={addVat} onChange={e=>{setAddVat(e.target.checked);setVerified(false);}}/><span><strong>Add 15% VAT</strong><small>Optional. It starts off for every payment.</small></span>{addVat&&<strong>{amount(tax,currency)}</strong>}</label>
        <div className="desk-bill-lines"><div><span>Services</span><strong>{amount(subtotal,currency)}</strong></div>{addVat&&<div><span>VAT (15%)</span><strong>{amount(tax,currency)}</strong></div>}<div className="desk-bill-total"><strong>Total to collect</strong><strong>{amount(total,currency)}</strong></div></div>
        <fieldset className="desk-methods"><legend>Payment method</legend>{['cash','bank_transfer','telebirr'].map(m=><button type="button" key={m} aria-pressed={method===m} className={method===m?'is-active':''} onClick={()=>{setMethod(m);setAccountId('');setVerified(false);setReference('');}}>{methodName(m)}</button>)}</fieldset>
        {method!=='cash'&&<label className="admin-field">Money sent to<select className="admin-input" required value={accountId} onChange={e=>{setAccountId(e.target.value);setVerified(false);}}><option value="">Choose an account</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}{a.reference?` · ${a.reference}`:''}</option>)}</select></label>}
        {!accounts.length&&finance.data&&<div className="desk-notice">{method==='cash'?'Cash is turned off. Ask the owner to turn on Cash in Payment settings.':`No ${methodName(method).toLowerCase()} account is ready. Ask the owner to add one in Payment settings.`}</div>}
        {method==='cash'?<><label className="admin-field">Cash received ({currency})<input className="admin-input" type="number" inputMode="decimal" min={total} step="0.01" required value={cash} onChange={e=>setCashOverride(e.target.value)}/></label><div className="desk-change"><span>Give back</span><strong>{amount(Math.max(0,Number(cash)-total),currency)}</strong></div></>:<><label className="admin-field">Transfer number <small>Optional</small><input className="admin-input" maxLength={100} value={reference} onChange={e=>setReference(e.target.value)}/></label><label className="desk-checkbox"><input type="checkbox" required checked={verified} onChange={e=>setVerified(e.target.checked)}/> I checked that {amount(total,currency)} arrived in this account.</label></>}
        {(error||finance.error)&&<div className="admin-inline-error" role="alert">{error||finance.error}</div>}
        <button className="admin-primary-button desk-full" disabled={busy||!accounts.some(a=>String(a.id)===selectedAccountId)||!!finance.error||!!visit&&(!ids.length||services.loading||!!services.error)}>{busy?'Recording…':`Record ${amount(total,currency)} payment`}</button>
      </fieldset>}
    </form>
  </DeskModal>;
}
