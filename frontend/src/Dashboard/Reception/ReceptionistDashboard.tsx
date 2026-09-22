import { useState,type ReactNode } from 'react';
import { FiGrid,FiCreditCard,FiBox,FiMoreHorizontal,FiLogOut,FiMenu,FiX,FiPlus,FiCalendar,FiTrendingDown,FiCheckCircle,FiUser,FiLock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch,useAppSelector } from '../../app/hooks';
import { logoutUser } from '../../features/auth/authThunks';
import FrontDesk from '../../Components/Reception/FrontDesk';
import Billing from '../../Components/Reception/Billing';
import Inventory from '../../Components/Reception/Inventory';
import Expenses from '../../Components/Reception/Expenses';
import DailyClosing from '../../Components/Reception/DailyClosing';
import AppointmentSearch from '../../Components/Reception/AppointmentSearch';
import ProfileSettings from '../../Components/ProfileSettings';
import NotificationsBell from '../../Components/NotificationsBell';

type View='today'|'payments'|'stock'|'more'|'expenses'|'closing'|'bookings'|'profile';
type NavItem={id:View;label:string;icon:ReactNode;description?:string;disabled?:boolean};
type ExtraItem=Required<Pick<NavItem,'id'|'label'|'icon'|'description'>>&Pick<NavItem,'disabled'>;
const mainNav:NavItem[]=[{id:'today',label:'Today',icon:<FiGrid/>},{id:'payments',label:'Payments',icon:<FiCreditCard/>},{id:'stock',label:'Stock',icon:<FiBox/>},{id:'more',label:'More',icon:<FiMoreHorizontal/>}];
export default function ReceptionistDashboard() {
  const user=useAppSelector(s=>s.auth.user);
  const dispatch=useAppDispatch();const navigate=useNavigate();
  const [view,setView]=useState<View>('today');
  const [sidebar,setSidebar]=useState(false);
  const [assign,setAssign]=useState(false);
  const bookingEnabled=!!user?.features?.onlineBooking;
  const planName=user?.shop?.planName||'your current package';
  const extra:ExtraItem[]=[{id:'expenses',label:'Expenses',icon:<FiTrendingDown/>,description:'Add shop spending and choose where it was paid from'},{id:'closing',label:'Close day',icon:<FiCheckCircle/>,description:'Check money, count cash, and save the day'},{id:'profile',label:'My profile',icon:<FiUser/>,description:'Change your name, photo, or password'},{id:'bookings',label:'Bookings',icon:<FiCalendar/>,description:bookingEnabled?'Mark booked customers as here':`Not included in ${planName}. Mirror Max has online booking.`,disabled:!bookingEnabled}];
  const select=(next:View)=>{setView(next);setSidebar(false);window.scrollTo({top:0,behavior:'smooth'});};
  const logout=async()=>{await dispatch(logoutUser());navigate('/login');};
  const active=(id:View)=>id===view||(id==='more'&&['expenses','closing','bookings','profile'].includes(view));
  return <div className="reception-workspace reception-desk-v2">
    <header className="reception-mobile-header"><button className="admin-icon-button" aria-label="Open navigation" onClick={()=>setSidebar(true)}><FiMenu/></button><div className="reception-brand"><img className="reception-brand-mark" src="/mirror.svg" alt=""/><span>Mirror</span></div><div className="reception-mobile-actions"><NotificationsBell/><span className="desk-user-avatar" aria-label={user?.name}>{user?.name?.slice(0,1)||'R'}</span></div></header>
    {sidebar&&<button className="reception-sidebar-backdrop" aria-label="Close navigation" onClick={()=>setSidebar(false)}/>}
    <aside className={`reception-sidebar ${sidebar?'is-open':''}`}><div className="reception-sidebar-top"><div className="reception-brand"><img className="reception-brand-mark" src="/mirror.svg" alt=""/><span>Mirror</span></div><button className="admin-icon-button reception-sidebar-close" aria-label="Close navigation" onClick={()=>setSidebar(false)}><FiX/></button></div><div className="reception-workspace-label"><span>MY PAGE</span><strong>Front desk</strong></div><nav className="reception-sidebar-nav" aria-label="Reception navigation">{[...mainNav.slice(0,3),...extra].map(item=><button key={item.id} className={`${view===item.id?'is-active':''}${item.disabled?' is-locked':''}`} onClick={()=>select(item.id)}><span>{item.disabled?<FiLock/>:item.icon}</span><span>{item.label}</span></button>)}</nav><div className="reception-sidebar-footer"><div className="reception-user-mini"><span>{user?.name?.slice(0,1)||'R'}</span><div><strong>{user?.name||'Reception'}</strong><small>{user?.shop?.name||'Your shop'}</small></div></div><button className="reception-logout" onClick={logout}><FiLogOut/> Sign out</button></div></aside>
    <main className="reception-main"><div className="reception-topbar"><div><p className="admin-eyebrow">{user?.shop?.name||'FRONT DESK'}</p><h1>{view==='today'?'Today in the shop':[...mainNav,...extra].find(i=>i.id===view)?.label}</h1></div><div className="reception-topbar-actions"><NotificationsBell/><button className="admin-primary-button" onClick={()=>{select('today');setAssign(true);}}><FiPlus/> Add walk-in</button></div></div>
      {view==='today'&&<FrontDesk assignOpen={assign} setAssignOpen={setAssign} onPayments={()=>select('payments')} onClosing={()=>select('closing')} onStock={()=>select('stock')}/>}
      {view==='payments'&&<Billing/>}{view==='stock'&&<Inventory/>}{view==='expenses'&&<Expenses/>}{view==='closing'&&<DailyClosing/>}{view==='bookings'&&(bookingEnabled?<AppointmentSearch/>:<section className="owner-card desk-module desk-locked-feature"><p className="admin-eyebrow">ONLINE BOOKING</p><h2>Not included in {planName}</h2><p>Online booking is available with Mirror Max. Ask the shop owner to choose Mirror Max if your shop needs it.</p></section>)}{view==='profile'&&<ProfileSettings/>}
      {view==='more'&&<section className="desk-more-grid">{extra.map(item=><button className={`admin-module-card desk-more-card${item.disabled?' is-locked':''}`} key={item.id} onClick={()=>select(item.id)}><span className="reception-action-icon indigo">{item.disabled?<FiLock/>:item.icon}</span><strong>{item.label}</strong><span>{item.description}</span></button>)}<button className="admin-secondary-button" onClick={logout}><FiLogOut/> Sign out</button></section>}
    </main><nav className="reception-bottom-nav" aria-label="Reception mobile navigation">{mainNav.map(item=><button key={item.id} className={active(item.id)?'is-active':''} onClick={()=>select(item.id)}>{item.icon}<span>{item.label}</span></button>)}</nav>
  </div>;
}
