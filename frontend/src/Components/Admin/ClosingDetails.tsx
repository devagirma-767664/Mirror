import { amount, methodName, type Daily } from '../Reception/desk';

export default function ClosingDetails({snapshot:r}:{snapshot:Daily}) {
  const money=(value:number|string|null|undefined)=>amount(value,r.currency||'ETB');
  return <div className="owner-closing-details">
    <dl className="owner-closing-totals">
      <div><dt>Service sales</dt><dd>{money(r.services)}</dd></div>
      <div><dt>VAT collected</dt><dd>{money(r.vat)}</dd></div>
      <div><dt>Customer payments</dt><dd>{money(r.collected)}</dd></div>
      <div><dt>Expenses paid</dt><dd>{money(r.expenses)}</dd></div>
    </dl>
    <div className="owner-method-pills">{r.methods?.map(m=><span key={m.method}>{methodName(m.method)}<b>{money(m.collected)}</b></span>)}</div>
    <div className="owner-closing-accounts">{r.accounts?.map((a,index)=><section key={`${a.id}-${index}`}>
      <header><strong>{a.name}</strong><span>{methodName(a.method)}</span></header>
      <dl className="owner-statement"><div><dt>Received</dt><dd>{money(a.collected)}</dd></div><div><dt>Expenses paid</dt><dd>{money(a.expenses)}</dd></div>
        {a.method==='cash'&&<><div><dt>Opening cash</dt><dd>{money(a.opening)}</dd></div><div><dt>Expected cash</dt><dd>{a.expected_cash==null?'Not recorded':money(a.expected_cash)}</dd></div><div><dt>Counted cash</dt><dd>{a.counted==null?'Not recorded':money(a.counted)}</dd></div><div className={a.difference?'owner-warning':''}><dt>Cash difference</dt><dd>{a.difference==null?'Not recorded':money(a.difference)}</dd></div></>}
      </dl>
    </section>)}</div>
    <p className="owner-note">These are the totals saved by reception at closing. Received amounts show payments recorded into each account.</p>
  </div>;
}
