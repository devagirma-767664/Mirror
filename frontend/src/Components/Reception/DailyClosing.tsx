import { useState } from 'react';
import { FiCheckCircle, FiLock, FiSave } from 'react-icons/fi';
import api from '../../api/axios';
import DeskModal from './DeskModal';
import {useDeskResource,type Daily,type AccountTotal,amount,methodName,errorText,dateTime} from './desk';

export default function DailyClosing() {
  const [date,setDate]=useState('');
  const daily=useDeskResource<Daily>(`/receptionist/daily${date?`?date=${date}`:''}`);
  const [counts,setCounts]=useState<Record<number,string>>({});
  const [notes,setNotes]=useState('');
  const [verified,setVerified]=useState(false);
  const [openingCash,setOpeningCash]=useState<Record<number,boolean>>({});
  const [editingOpening,setEditingOpening]=useState<Record<number,boolean>>({});
  const [openingAmounts,setOpeningAmounts]=useState<Record<number,string>>({});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [confirm,setConfirm]=useState(false);
  const report=daily.data;
  const cashAccounts=report?.accounts.filter(account=>account.method==='cash'&&!!account.id)??[];
  const hasDigitalCollections=report?.accounts.some(account=>account.method!=='cash'&&Number(account.collected)>0)??false;
  const cashCountsReady=cashAccounts.every(account=>/^\d+(?:\.\d{1,2})?$/.test((counts[account.id]??'').trim()));
  const hasCashDifference=cashAccounts.some(account=>{
    const entered=counts[account.id];
    return entered!==undefined&&entered!==''&&Math.round((Number(entered)-Number(account.expected_cash))*100)!==0;
  });
  const needsNote=hasCashDifference||(report?.accounts.some(account=>!account.id)??false);
  const canReview=!!report&&!busy&&!daily.error&&report.inShop===0&&report.pending.count===0&&report.accounts.length>0&&cashCountsReady&&(!hasDigitalCollections||verified)&&(!needsNote||!!notes.trim());

  const resetForDate=()=>{
    setCounts({});setNotes('');setVerified(false);setOpeningCash({});setEditingOpening({});setOpeningAmounts({});setError('');
  };
  const saveOpening=async(account:AccountTotal)=>{
    const value=(openingAmounts[account.id]??'').trim();
    if(!report||!value){setError('Enter the cash that was in this till at the start of the day.');return;}
    setBusy(true);setError('');
    try {
      await api.put('/receptionist/daily/opening',{date:report.date,accountId:account.id,amount:value});
      setOpeningCash(current=>({...current,[account.id]:true}));
      setEditingOpening(current=>({...current,[account.id]:false}));
      await daily.refresh();
    } catch (exception) { setError(errorText(exception)); }
    finally { setBusy(false); }
  };
  const close=async()=>{
    if(!report)return;
    setBusy(true);setError('');
    try {
      await api.post('/receptionist/daily/close',{date:report.date,cashCounts:counts,notes,digitalVerified:verified});
      setConfirm(false);await daily.refresh();
    } catch (exception) { setError(errorText(exception)); }
    finally { setBusy(false); }
  };

  return <section className="reception-module-view desk-module">
    <header className="admin-module-header"><div><p className="admin-eyebrow">END OF DAY</p><h2 className="admin-module-title">Close today</h2><p className="admin-module-subtitle">Check today’s money, count the cash, then save the day.</p></div><label className="admin-field">Date<input aria-label="Closing date" className="admin-input" type="date" max={report?.today} value={date||report?.date||''} onChange={event=>{setDate(event.target.value);resetForDate();}}/></label></header>
    {(daily.error||error)&&!confirm&&<div role="alert" className="admin-inline-error">{error||daily.error}</div>}
    {daily.loading&&<div className="admin-inline-state">Loading today’s totals…</div>}
    {report&&<>
      {report.autoStarted&&!report.closing&&<div className="desk-notice" role="status">Today is open and ready for payments and expenses.</div>}
      {report.closing&&<div className="desk-success"><FiLock/><div><strong>Day closed by {report.closing.closed_by_name}</strong><span>{dateTime(report.closing.closed_at)} · Daily record saved</span></div></div>}

      <div className="desk-money-grid"><div><span>Money collected</span><strong>{amount(report.collected,report.currency)}</strong></div><div><span>Service sales</span><strong>{amount(report.services,report.currency)}</strong></div><div><span>VAT collected</span><strong>{amount(report.vat,report.currency)}</strong></div><div><span>Expenses paid</span><strong>{amount(report.expenses,report.currency)}</strong></div></div>

      <section className="admin-module-card"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">TODAY’S MONEY</p><h3>Payment methods</h3></div></div><div className="desk-method-totals">{report.methods.map(method=><div key={method.method}><span>{methodName(method.method)}</span><strong>{amount(method.collected,report.currency)}</strong></div>)}</div>{!report.methods.length&&<p className="desk-help">No payments have been collected yet.</p>}</section>

      <section className="admin-module-card"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">CHECK PAYMENTS</p><h3>Where today’s money went</h3></div></div><p className="desk-help">For bank and Telebirr, check these amounts in the account before you close the day.</p><div className="desk-closing-accounts">{report.accounts.map((account,index)=><article className="desk-closing-account" key={`${account.id}-${account.method}-${index}`}><div className="desk-account-heading"><div><strong>{account.name}</strong><span>{methodName(account.method)}{account.reference?` · ${account.reference}`:''}</span></div><span className="admin-status-pill">{account.count} payments</span></div><dl className="desk-account-figures"><div><dt>Received</dt><dd>{amount(account.collected,report.currency)}</dd></div><div><dt>Expenses</dt><dd>{amount(account.expenses,report.currency)}</dd></div><div><dt>Money left</dt><dd>{amount(account.net,report.currency)}</dd></div></dl>
        {account.method==='cash'&&!!account.id&&<div className="desk-cash-count">
          {report.closing?<div className="desk-opening-summary"><span>Opening cash</span><strong>{account.opening_set?amount(account.opening,report.currency):'Not recorded'}</strong></div>:<>
            {!account.opening_set&&!openingCash[account.id]&&<div className="desk-opening-choice"><div><strong>Opening cash <small>Optional</small></strong><span>Was cash already in this till before today’s payments?</span></div><div className="desk-choice-buttons"><button type="button" className={`admin-secondary-button ${openingCash[account.id]?'':'is-selected'}`} onClick={()=>{setOpeningCash(current=>({...current,[account.id]:false}));setOpeningAmounts(current=>({...current,[account.id]:''}));}}>No</button><button type="button" className={`admin-secondary-button ${openingCash[account.id]?'is-selected':''}`} onClick={()=>{setOpeningCash(current=>({...current,[account.id]:true}));setError('');}}>Yes</button></div></div>}
            {account.opening_set&&!editingOpening[account.id]&&<div className="desk-opening-summary"><div><span>Opening cash recorded</span><strong>{amount(account.opening,report.currency)}</strong></div><button type="button" className="admin-inline-link" onClick={()=>{setEditingOpening(current=>({...current,[account.id]:true}));setOpeningAmounts(current=>({...current,[account.id]:String(account.opening)}));setError('');}}>Change</button></div>}
            {(openingCash[account.id]||editingOpening[account.id])&&<div className="desk-opening-entry"><label className="admin-field">Cash at the start of the day ({report.currency})<input autoComplete="off" className="admin-input" required type="number" inputMode="decimal" min="0" step="0.01" placeholder="For example, 500" value={openingAmounts[account.id]??''} onChange={event=>setOpeningAmounts(current=>({...current,[account.id]:event.target.value}))}/></label><p className="desk-help">Enter zero only when you want to record that the till started empty.</p><button type="button" className="admin-secondary-button" disabled={busy} onClick={()=>saveOpening(account)}><FiSave/> Save opening cash</button></div>}
          </>}
          <div className="desk-cash-count-heading"><div><strong>Cash in till now</strong><span>Count the notes and coins in this till.</span></div><div><span>Expected</span><strong>{amount(account.expected_cash,report.currency)}</strong></div></div>
          {report.closing?<div className="desk-change"><span>Counted {amount(account.counted,report.currency)}</span><strong className={account.difference?'desk-warning':''}>Difference {amount(account.difference,report.currency)}</strong></div>:<><label className="admin-field">Cash counted ({report.currency})<input type="number" inputMode="decimal" min="0" step="0.01" className="admin-input" placeholder="Enter cash in till" value={counts[account.id]??''} onChange={event=>setCounts(current=>({...current,[account.id]:event.target.value}))}/></label>{counts[account.id]!==undefined&&counts[account.id]!==''&&<p className="desk-help">Difference: <strong>{amount(Number(counts[account.id])-Number(account.expected_cash),report.currency)}</strong></p>}</>}</div>}
        {!account.id&&<p className="desk-warning">This older payment has no recorded account. Add a short note before closing.</p>}
      </article>)}</div></section>

      <section className="admin-module-card"><div className="admin-module-toolbar"><div><p className="admin-card-kicker">READY TO CLOSE?</p><h3>{report.closing?'Saved daily closing':'Finish the day'}</h3></div></div>
        {!report.closing&&report.pending.count>0&&<div className="desk-notice">{report.pending.count} finished visits still need payment. Collect payment before closing.</div>}
        {!report.closing&&report.inShop>0&&<div className="desk-notice">{report.inShop} assigned visits remain. Collect payment, or cancel customers who left, before closing.</div>}
        {report.closing?<p>{report.closing.notes||'No note was added.'}</p>:<div className="desk-form">
          {cashAccounts.length>0&&!cashCountsReady&&<p className="desk-help">Enter the cash in each till before you review the closing.</p>}
          {hasDigitalCollections&&<label className="desk-checkbox"><input type="checkbox" checked={verified} onChange={event=>setVerified(event.target.checked)}/> I checked bank and Telebirr payments in the receiving accounts.</label>}
          {hasDigitalCollections&&!verified&&<p className="desk-help">Check the digital payments, then tick the box above.</p>}
          <label className="admin-field">Note <small>Optional, unless cash is different from expected.</small><textarea className="admin-input" maxLength={1000} placeholder="Write only if something needs explaining." value={notes} onChange={event=>setNotes(event.target.value)}/></label>
          {needsNote&&!notes.trim()&&<p className="desk-help">Add a short note to explain the cash difference or older payment.</p>}
          {!report.accounts.length&&<p className="desk-warning">Ask admin to add a payment account before closing.</p>}
          <button className="admin-primary-button" disabled={!canReview} onClick={()=>{setConfirm(true);setError('');}}><FiCheckCircle/> Review daily closing</button>
        </div>}
      </section>
    </>}
    {confirm&&report&&<DeskModal title={`Close ${report.date}?`} busy={busy} onClose={()=>setConfirm(false)}><div className="desk-form"><p>Save today’s money record and cash counts.</p><dl className="desk-close-summary"><div><dt>Money collected</dt><dd>{amount(report.collected,report.currency)}</dd></div><div><dt>Expenses paid</dt><dd>{amount(report.expenses,report.currency)}</dd></div><div><dt>Cash tills counted</dt><dd>{cashAccounts.length}</dd></div></dl><p className="desk-help">After closing, payments and expenses stay locked until the owner reopens the day. If Telegram is connected, the owner will receive today’s short report.</p>{error&&<div className="admin-inline-error" role="alert">{error}</div>}<button className="admin-primary-button" disabled={busy} onClick={close}>{busy?'Saving daily closing…':'Confirm and close day'}</button></div></DeskModal>}
  </section>;
}
