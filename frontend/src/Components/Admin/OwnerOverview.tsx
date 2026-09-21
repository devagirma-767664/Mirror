import { FiArrowDownRight, FiArrowUpRight, FiArrowRight, FiCheckCircle, FiDollarSign, FiPackage, FiScissors, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { useDeskResource } from '../Reception/desk';
import type { OwnerReport } from './owner';
import { cash, change, dayLabel, periodLabel } from './owner';
import { RevenueChart, CollectionChart, VisitsChart, TeamChart, BarberPerformance } from './OwnerCharts';
type View='reports'|'stock'|'requests'|'finance'|'team'|'telegram';
export default function OwnerOverview({open}:{open:(view:View)=>void}){
  const resource=useDeskResource<OwnerReport>('/admin/owner/report?period=weekly',30000);
  const r=resource.data;
  if(!r)return <div className={resource.error?'admin-inline-error':'owner-loading'} role="status">{resource.error||'Loading your shop summary…'}{resource.error&&<button onClick={resource.refresh}>Try again</button>}</div>;
  const differences=r.closings.filter(c=>c.differences.some(d=>d.difference!==0));
  const notClosed=r.daily.filter(d=>(d.collected||d.expenses||d.completed)&&!r.closings.some(c=>c.day===d.day));
  const todayClosed=r.closings.some(c=>c.day===r.shop.today);
  const busyDay=[...r.daily].sort((a,b)=>b.completed-a.completed)[0];
  return <div className="owner-stack">
    {resource.error&&<div className="admin-inline-error" role="alert">Update failed. Showing the last loaded report. {resource.error}</div>}
    <section className="owner-welcome"><div><p>YOUR SHOP THIS WEEK</p><h2>See your week clearly.</h2><span>{periodLabel(r)} · Monday to Sunday</span></div><span className="owner-live"><i/>{todayClosed?'Today is closed':'Today is still open'}</span></section>
    <div className="owner-kpis">
      <article><span className="owner-kpi-icon purple"><FiDollarSign/></span><p>Service sales</p><strong>{cash(r.totals.sales,r.shop.currency)}</strong><small className={r.totals.sales>=r.previous.sales?'owner-positive':'owner-muted'}>{r.totals.sales>=r.previous.sales?<FiArrowUpRight/>:<FiArrowDownRight/>}{change(r.totals.sales,r.previous.sales)} <span>vs previous Monday–Sunday week</span></small></article>
      <article><span className="owner-kpi-icon green"><FiScissors/></span><p>Customers paid</p><strong>{r.totals.customers}</strong><small>Average payment {cash(r.totals.averageTicket,r.shop.currency)}</small></article>
      <article><span className="owner-kpi-icon amber"><FiTrendingUp/></span><p>Shop expenses</p><strong>{cash(r.totals.expenses,r.shop.currency)}</strong><small>{r.categories.length} types of expenses</small></article>
      <article><span className="owner-kpi-icon blue"><FiUsers/></span><p>Sales after expenses</p><strong>{cash(r.totals.operatingBalance,r.shop.currency)}</strong><small>Only recorded expenses are included</small></article>
    </div>
    <div className="owner-two-col"><section className="owner-card"><div className="owner-card-head"><div><p>MONEY THIS WEEK</p><h3>Sales and expenses</h3></div><span className="owner-unit">{r.shop.currency} · VAT not included</span></div><div className="owner-legend"><span><i className="purple"/>Service sales</span><span><i className="amber"/>Expenses</span></div><RevenueChart report={r}/><button className="owner-text-button" onClick={()=>open('reports')}>See money reports <FiArrowRight/></button></section>
      <section className="owner-card"><div className="owner-card-head"><div><p>MONEY RECEIVED</p><h3>How customers paid</h3></div></div><CollectionChart report={r}/><p className="owner-note">This shows payments recorded in Mirror. It is not the full bank balance.</p></section></div>
    <section className="owner-attention"><div><span className="owner-kpi-icon amber"><FiCheckCircle/></span><div><p>CHECK THESE</p><h3>Keep the shop running well</h3></div></div><div className="owner-attention-grid">
      <button onClick={()=>open('stock')}><strong>{r.stock.length}</strong><span>Items to restock</span><FiArrowRight/></button>
      <button onClick={()=>open('requests')}><strong>{r.requests}</strong><span>Leave requests to review</span><FiArrowRight/></button>
      <button onClick={()=>open('finance')}><strong>{differences.length}</strong><span>Days with cash differences</span><FiArrowRight/></button>
      <button onClick={()=>open('reports')}><strong>{notClosed.length}</strong><span>Open days not closed</span><FiArrowRight/></button>
    </div></section>
    <div className="owner-equal-col"><section className="owner-card"><div className="owner-card-head"><div><p>DAILY WORK</p><h3>Customers</h3></div><FiScissors/></div><div className="owner-legend"><span><i className="green"/>Served</span><span><i className="amber"/>Cancelled</span></div><VisitsChart report={r}/><p className="owner-note">{busyDay?.completed?`${dayLabel(busyDay.day,true)} was busiest, with ${busyDay.completed} customers served.`:'Served customers will show here.'}</p></section>
      <section className="owner-card"><div className="owner-card-head"><div><p>YOUR TEAM</p><h3>Stylists working each day</h3></div><FiUsers/></div><TeamChart report={r}/><div className="owner-team-totals">{r.team.map(t=><span key={t.role}><b>{t.count}</b> {t.role==='receptionist'?'reception':t.role==='admin'?'owners':'stylists'}</span>)}</div><p className="owner-note">This shows who served customers. It is not an attendance list.</p></section></div>
    <div className="owner-two-col"><section className="owner-card"><div className="owner-card-head"><div><p>STYLIST PERFORMANCE</p><h3>Contribution to shop sales</h3></div><button className="owner-text-button" onClick={()=>open('team')}>Team <FiArrowRight/></button></div><BarberPerformance report={r}/></section>
      <section className="owner-card"><div className="owner-card-head"><div><p>SERVICE MIX</p><h3>What customers chose</h3></div><FiPackage/></div><div className="owner-services">{r.services.slice(0,5).map(s=><div key={s.name}><span><strong>{s.name}</strong><small>{s.count} services</small></span><b>{cash(s.sales,r.shop.currency)}</b><div className="owner-bar-track"><span style={{width:`${r.totals.sales?100*s.sales/r.totals.sales:0}%`}}/></div></div>)}</div>{!r.services.length&&<p className="owner-empty">Service demand appears after checkout.</p>}</section></div>
    <section className="owner-telegram-banner"><div><p>TELEGRAM UPDATE</p><h3>Get your day in one short message.</h3><span>Customers, income, expenses, and low stock after reception closes the day.</span></div><button className="admin-primary-button" onClick={()=>open('telegram')}>Set up Telegram <FiArrowRight/></button></section>
  </div>;
}
