import {useEffect,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {FiPlus,FiCheckCircle} from 'react-icons/fi';
import api from '../../api/axios';
import {useDeskResource,amount,errorText,methodName} from '../../Components/Reception/desk';
import {type PlatformAccount,type SubscriptionRequest,subscriptionDate} from '../../config/subscription';
import DeskModal from '../../Components/Reception/DeskModal';
export default function PlatformBilling({onChange}:{onChange:()=>void}){
  const [params,setParams]=useSearchParams();
  const requestId=params.get('request');
  const [opening,setOpening]=useState(false);
  const closeReview=()=>{setReview(null);setParams({view:'billing'},{replace:true});};
  const resource=useDeskResource<{accounts:PlatformAccount[];requests:SubscriptionRequest[]}>('/platform/billing');
  const [showAccount,setShowAccount]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
  const [form,setForm]=useState({name:'',method:'bank_transfer',reference:'',accountHolder:''});
  const [review,setReview]=useState<SubscriptionRequest|null>(null),[verified,setVerified]=useState(false),[note,setNote]=useState(''),[receiptUrl,setReceiptUrl]=useState('');
  const save=async(fn:()=>Promise<unknown>,message:string)=>{setBusy(true);setError('');try{await fn();setShowAccount(false);closeReview();setSuccess(message);await resource.refresh();onChange();}catch(e){setError(errorText(e));}finally{setBusy(false);}};
  useEffect(()=>{let current=true;
    setReview(null);setVerified(false);setNote('');setError('');
    if(!requestId){setOpening(false);return;}
    setOpening(true);
    api.get<SubscriptionRequest>('/platform/billing/requests/'+encodeURIComponent(requestId)).then(({data})=>{if(current)setReview(data);}).catch(e=>{if(current)setError(errorText(e));}).finally(()=>{if(current)setOpening(false);});
    return()=>{current=false;};
  },[requestId]);
  useEffect(()=>{
    let active=true;
    let objectUrl='';
    setReceiptUrl('');
    if(!review?.id||!review.receipt_available)return()=>{};
    api.get(`/platform/billing/requests/${review.id}/receipt`,{responseType:'blob'}).then(({data})=>{
      objectUrl=URL.createObjectURL(data);
      if(active)setReceiptUrl(objectUrl); else URL.revokeObjectURL(objectUrl);
    }).catch(e=>{if(active)setError(errorText(e));});
    return()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[review?.id,review?.receipt_available]);
  return <section className="desk-module"><header className="admin-module-header"><div><p className="admin-eyebrow">PACKAGE PAYMENTS</p><h2 className="admin-module-title">Payments to check</h2><p className="admin-module-subtitle">Add Mirror payment accounts. Check each owner’s payment screenshot before you approve the package.</p></div><button className="admin-primary-button" onClick={()=>{setShowAccount(true);setError('');setForm({name:'',method:'bank_transfer',reference:'',accountHolder:''});}}><FiPlus/> Add Mirror account</button></header>
    {(resource.error||error)&&!showAccount&&!review&&<div className="admin-inline-error" role="alert">{error||resource.error}</div>}{opening&&<p role="status">Opening payment submission…</p>}{success&&<div className="desk-success" role="status"><FiCheckCircle/>{success}</div>}
    <section className="admin-module-card"><h3>Mirror payment accounts</h3><p className="desk-help">Owners send package payments to these accounts. Each shop has separate accounts for customer payments.</p><div className="desk-account-list">{resource.data?.accounts.map(a=><article className="desk-account-row" key={a.id}><div><strong>{a.name}</strong><span>{methodName(a.method)} · {a.reference}</span><small>{a.account_holder} · {a.active?'Owners can use this':'Turned off'}</small></div><button className="admin-secondary-button" disabled={busy} onClick={()=>save(()=>api.put(`/platform/billing/accounts/${a.id}`,{active:!a.active}),'Payment account saved.')}>{a.active?'Turn off':'Turn on'}</button></article>)}</div>{!resource.loading&&!resource.data?.accounts.length&&<p className="admin-empty-state">Add a bank or Telebirr account so owners can pay after the free trial.</p>}</section>
    <section className="admin-module-card"><h3>Owner payments</h3><div className="saas-package-history">{resource.data?.requests.map(r=><article key={r.id}><div><strong>{r.shop_name} · {r.plan_name}</strong><small>{r.owner_email} · {subscriptionDate(r.requested_at)}</small><small>{amount(r.amount,r.currency)} · {r.payment_account_name}</small><small>{r.receipt_available?'Payment screenshot added':'Older request without a screenshot'}</small></div><span className={`admin-status-pill ${r.status==='approved'?'is-paid':'is-pending'}`}>{r.status}</span>{r.status==='pending'&&<button className="admin-primary-button" onClick={()=>setParams({view:'billing',request:String(r.id)})}>Check payment</button>}{r.review_note&&<p>{r.review_note}</p>}</article>)}</div>{!resource.loading&&!resource.data?.requests.length&&<p className="admin-empty-state">Owner payments will show here.</p>}</section>
    {showAccount&&<DeskModal title="Add Mirror payment account" busy={busy} onClose={()=>setShowAccount(false)}><form className="desk-form" onSubmit={e=>{e.preventDefault();void save(()=>api.post('/platform/billing/accounts',form),'Mirror payment account added.');}}><label className="admin-field">Payment method<select className="admin-input" value={form.method} onChange={e=>setForm({...form,method:e.target.value})}><option value="bank_transfer">Bank transfer</option><option value="telebirr">Telebirr</option></select></label><label className="admin-field">Account name<input className="admin-input" required maxLength={100} placeholder="e.g. Mirror CBE account" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label className="admin-field">Account holder<input className="admin-input" required maxLength={140} value={form.accountHolder} onChange={e=>setForm({...form,accountHolder:e.target.value})}/></label><label className="admin-field">Bank account or Telebirr number<input className="admin-input" required maxLength={100} value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})}/></label><p className="desk-help">Shop owners see these details when they pay for a package.</p>{error&&<p className="admin-inline-error" role="alert">{error}</p>}<button className="admin-primary-button" disabled={busy}>{busy?'Saving…':'Add account'}</button></form></DeskModal>}
    {review&&<DeskModal title="Check package payment" busy={busy} onClose={closeReview}><div className="desk-form"><div className="saas-payment-destination"><strong>{review.shop_name}</strong><span>{review.plan_name} · {amount(review.amount,review.currency)}</span><span>{review.payment_account_name} · {review.payment_destination}</span></div>{review.receipt_available?<div className="platform-receipt-preview">{receiptUrl?<><img src={receiptUrl} alt="Payment screenshot"/><a href={receiptUrl} target="_blank" rel="noreferrer">Open full screenshot</a></>:<span>Loading screenshot…</span>}</div>:<div className="desk-notice">This older request has no payment screenshot.</div>}{review.status!=='pending'?<div className="desk-notice" role="status">This payment is already {review.status}.{review.review_note&&<p>{review.review_note}</p>}</div>:<><label className="desk-checkbox"><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/> I checked this amount in the receiving account.</label><label className="admin-field">Note <small>Required if you reject the payment</small><textarea className="admin-input" maxLength={500} value={note} onChange={e=>setNote(e.target.value)}/></label>{error&&<p className="admin-inline-error" role="alert">{error}</p>}<button className="admin-primary-button" disabled={busy||!verified} onClick={()=>save(()=>api.put(`/platform/billing/requests/${review.id}`,{decision:'approve',paymentVerified:verified,note}),'Payment approved. The package is active for one month.')}><FiCheckCircle/> Approve package</button><button className="admin-secondary-button" disabled={busy||!note.trim()} onClick={()=>save(()=>api.put(`/platform/billing/requests/${review.id}`,{decision:'reject',note}),'Payment rejected. The owner can read your note and send a new screenshot.')}>Reject payment</button></>}</div></DeskModal>}
  </section>;
}
