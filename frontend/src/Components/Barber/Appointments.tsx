import { FiScissors } from 'react-icons/fi';
import {useDeskResource,type Visit,visitName,dateTime} from '../Reception/desk';

export default function Appointments() {
  const board=useDeskResource<Visit[]>('/barber/appointments');
  return <section className="barber-module-view desk-module"><div className="barber-page-intro"><div><p className="admin-eyebrow">YOUR CHAIR</p><h2>Your customers</h2><p>Focus on the service. Reception sends customers to you and collects payment.</p></div></div>{board.error&&<div className="admin-inline-error">{board.error}</div>}{board.loading&&<p>Loading your customers…</p>}<section className="admin-module-card">{board.data?.map(v=><article className="desk-expense-row" key={v.id}><span className="reception-action-icon indigo"><FiScissors/></span><div><strong>{visitName(v)}</strong><span>{v.service_name}</span><small>{dateTime(v.start_time)}</small></div><span className="admin-status-pill">{v.status==='Booked'?'Booked':'Sent to you'}</span></article>)}{board.data&&!board.data.length&&<div className="admin-empty-state">No customers sent to you yet.</div>}</section></section>;
}
