import { FiRefreshCw } from 'react-icons/fi';
import { useDeskResource, amount } from '../Reception/desk';

type EarningsData = {
  visible: boolean;
  mode: 'salary' | 'commission' | 'hybrid';
  barberName?: string;
  period?: { start: string; end: string; label: string };
  periodType?: string;
  commissionRate?: number;
  paidServices?: number;
  commissionServices?: number;
  legacyServices?: number;
  serviceSales?: number;
  commissionEarned?: number;
  salaryIncluded?: boolean;
  salaryAmount?: number | null;
  currency?: string;
  lastUpdated?: string;
  lastPaidAt?: string | null;
  lastPaidPeriod?: { start: string; end: string } | null;
};

const dateLabel = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};

export default function Earnings() {
  const earnings = useDeskResource<EarningsData>('/barber/earnings', 30000);
  if (earnings.loading && !earnings.data) return <section className="barber-earnings-card admin-module-card"><p className="admin-inline-state">Loading your pay…</p></section>;
  if (earnings.error || !earnings.data || !earnings.data.visible) return null;
  const data = earnings.data;
  const currency = data.currency || 'ETB';
  return <section className="barber-earnings-card admin-module-card" aria-label="Your earnings">
    <div className="barber-earnings-heading"><div><p className="admin-card-kicker">YOUR PAY</p><h3>Your earnings</h3><p>This is your pay estimate for the time chosen by the owner.</p></div><button className="admin-secondary-button" onClick={earnings.refresh} aria-label="Refresh earnings"><FiRefreshCw /> Refresh</button></div>
    <div className="barber-earnings-period"><span>{data.period?.label || `${dateLabel(data.period?.start)} – ${dateLabel(data.period?.end)}`}</span><small>{data.periodType || 'Period'} · {data.mode === 'hybrid' ? 'Salary + percentage' : 'Percentage pay'}</small></div>
    <div className="barber-earnings-grid">
      <div><span>Service sales</span><strong>{amount(data.serviceSales || 0, currency)}</strong><small>{data.paidServices || 0} paid services</small></div>
      <div><span>Your percentage</span><strong>{Number(data.commissionRate || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}%</strong><small>Set by the owner</small></div>
      <div className="is-highlight"><span>Your percentage pay</span><strong>{amount(data.commissionEarned || 0, currency)}</strong><small>{data.commissionServices || 0} services in this time</small></div>
      {data.salaryIncluded && <div><span>Monthly salary</span><strong>{amount(data.salaryAmount || 0, currency)}</strong><small>The owner chose to show this</small></div>}
    </div>
    {!!data.legacyServices && <p className="barber-earnings-note">{data.legacyServices} older paid {data.legacyServices === 1 ? 'service has' : 'services have'} no pay rule saved, so it is not included here.</p>}
    {data.lastPaidAt && <p className="barber-earnings-note">This amount started again when the owner marked your last pay as paid on {new Date(data.lastPaidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. New paid services show here automatically.</p>}
    <p className="barber-earnings-footnote">The owner pays you separately. Last pay rule change: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}.</p>
  </section>;
}
