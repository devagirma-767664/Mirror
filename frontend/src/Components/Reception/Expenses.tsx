import { useState } from 'react';
import { FiPlus, FiTrendingDown } from 'react-icons/fi';
import api from '../../api/axios';
import DeskModal from './DeskModal';
import {useDeskResource,type FinanceSettings,amount,methodName,errorText} from './desk';
type Expense={id:number;category:string;description:string;amount:number|string;expense_date:string;recorded_by_name:string;payment_account_name?:string;payment_method?:string};
type Props={workspace?:'receptionist'|'admin'};
export default function Expenses({workspace='receptionist'}:Props) {
  const ownerView=workspace==='admin';
  const records=useDeskResource<Expense[]>(`/${workspace}/expenses`);
  const finance=useDeskResource<FinanceSettings>(`/${workspace}/finance`);
  const [show,setShow]=useState(false);
  const [form,setForm]=useState({category:'Supplies',description:'',amount:'',expenseDate:'',accountId:''});
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  const [success,setSuccess]=useState('');
  const currency=finance.data?.currency||'ETB';
  const save=async()=>{
    setBusy(true);setError('');try{await api.post(`/${workspace}/expenses`,form);setShow(false);setSuccess('Expense saved.');await records.refresh();}catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  return <section className="reception-module-view desk-module"><header className="admin-module-header"><div><p className="admin-eyebrow">MONEY OUT</p><h2 className="admin-module-title">Shop expenses</h2><p className="admin-module-subtitle">{ownerView?'Owner and reception expenses show in one list. Paid salaries are also added here.':'Add what the shop paid for and choose where the money came from.'}</p></div><button className="admin-primary-button" disabled={!finance.data} onClick={()=>{setForm({category:'Supplies',description:'',amount:'',expenseDate:finance.data!.today,accountId:''});setError('');setShow(true);}}><FiPlus/> Add expense</button></header>
    {success&&<div className="desk-success" role="status">{success}</div>}{(records.error||finance.error)&&<div className="admin-inline-error">{records.error||finance.error}</div>}
    <section className="admin-module-card"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">EXPENSE LOG</p><h3>Recent spending</h3></div></div>{records.loading&&<p>Loading expenses…</p>}{records.data?.map(e=><article className="desk-expense-row" key={e.id}><span className="reception-action-icon orange"><FiTrendingDown/></span><div><strong>{e.description}</strong><span>{e.category} · {e.recorded_by_name||'Reception'}</span><small>{String(e.expense_date).slice(0,10)} · {e.payment_account_name?`${methodName(e.payment_method||'unknown')} / ${e.payment_account_name}`:'Legacy entry — payment account not recorded'}</small></div><strong>{amount(e.amount,currency)}</strong></article>)}{!records.loading&&!records.data?.length&&<div className="admin-empty-state">No shop expenses recorded yet.</div>}</section>
    {show&&<DeskModal title="Add shop expense" busy={busy} onClose={()=>setShow(false)}><form className="desk-form" onSubmit={e=>{e.preventDefault();save();}}><label className="admin-field">Type<select className="admin-input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{['Supplies','Utilities','Cleaning','Maintenance','Rent','Other'].map(v=><option key={v}>{v}</option>)}</select></label><label className="admin-field">What did you pay for?<input className="admin-input" required maxLength={220} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label className="admin-field">Amount ({currency})<input className="admin-input" required type="number" inputMode="decimal" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label><label className="admin-field">Money came from<select className="admin-input" required value={form.accountId} onChange={e=>setForm({...form,accountId:e.target.value})}><option value="">Choose where you paid from</option>{finance.data?.accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {methodName(a.method)}</option>)}</select></label>{finance.data&&!finance.data.accounts.length&&<p className="desk-warning">The owner needs to add a payment account first.</p>}<label className="admin-field">Date<input className="admin-input" required type="date" max={finance.data?.today} value={form.expenseDate} onChange={e=>setForm({...form,expenseDate:e.target.value})}/></label><p className="desk-help">Cash expenses reduce the cash expected when you close the day.{ownerView?' Use Payroll for staff salary payments. They appear here as Salary.':''}</p>{error&&<div className="admin-inline-error" role="alert">{error}</div>}<button disabled={busy||!form.accountId} className="admin-primary-button">{busy?'Saving…':'Save expense'}</button></form></DeskModal>}
  </section>;
}
