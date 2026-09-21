import { useEffect, useRef, useState } from 'react';
import { FiGrid, FiUsers, FiPackage, FiBarChart2, FiDollarSign, FiCalendar, FiSend, FiStar, FiMenu, FiX, FiLogOut, FiScissors, FiMoreHorizontal, FiBell, FiUser, FiTrendingDown } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logoutUser } from '../../features/auth/authThunks';
import UserManagement from '../../Components/Admin/UserManagement';
import ServicesManagement from '../../Components/Admin/ServicesManagement';
import DayoffRequests from '../../Components/Admin/DayoffRequests';
import PackageManagement from '../../Components/Admin/PackageManagement';
import PaymentSettings from '../../Components/Admin/PaymentSettings';
import CompensationSettings from '../../Components/Admin/CompensationSettings';
import OwnerOverview from '../../Components/Admin/OwnerOverview';
import OwnerFinancialReport from '../../Components/Admin/OwnerFinancialReport';
import OwnerStock from '../../Components/Admin/OwnerStock';
import TelegramSettings from '../../Components/Admin/TelegramSettings';
import Payroll from '../../Components/Admin/Payroll';
import PlatformMessages from '../../Components/Admin/PlatformMessages';
import ProfileSettings from '../../Components/ProfileSettings';
import Expenses from '../../Components/Reception/Expenses';
import NotificationsBell from '../../Components/NotificationsBell';
import '../../styles/owner.css';

const navigation=[
  {id:'overview',label:'Overview',icon:FiGrid},
  {id:'reports',label:'Money reports',icon:FiBarChart2},
  {id:'team',label:'Team',icon:FiUsers},
  {id:'services',label:'Services',icon:FiScissors},
  {id:'stock',label:'Stock',icon:FiPackage},
  {id:'compensation',label:'Stylist pay',icon:FiDollarSign},
  {id:'payroll',label:'Payroll',icon:FiCalendar},
  {id:'finance',label:'Payments & closings',icon:FiDollarSign},
  {id:'expenses',label:'Expenses',icon:FiTrendingDown},
  {id:'requests',label:'Leave requests',icon:FiCalendar},
  {id:'telegram',label:'Telegram updates',icon:FiSend},
  {id:'messages',label:'Platform messages',icon:FiBell},
  {id:'profile',label:'My profile',icon:FiUser},
  {id:'package',label:'Your package',icon:FiStar},
] as const;
type View=typeof navigation[number]['id'];
export default function AdminDashboard(){
  const dispatch=useAppDispatch(),navigate=useNavigate();
  const user=useAppSelector(state=>state.auth.user);
  const [searchParams,setSearchParams]=useSearchParams();
  const visibleNavigation=navigation;
  const view:View=visibleNavigation.find(item=>item.id===searchParams.get('view'))?.id||'overview';
  const [sidebar,setSidebar]=useState(false);
  const sidebarRef=useRef<HTMLElement>(null);
  const select=(next:View)=>{setSearchParams(current=>{const params=new URLSearchParams(current);params.set('view',next);return params;});setSidebar(false);window.scrollTo({top:0,behavior:'instant'});};
  useEffect(()=>{setSidebar(false);},[view]);
  useEffect(()=>{
    if(!sidebar)return;
    const previous=document.activeElement as HTMLElement|null;
    const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    sidebarRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const keydown=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();setSidebar(false);}
      if(event.key==='Tab'){
        const buttons=Array.from(sidebarRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')||[]);
        const first=buttons[0],last=buttons[buttons.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    const desktop=window.matchMedia('(min-width:1024px)');
    const resize=()=>{if(desktop.matches)setSidebar(false);};
    document.addEventListener('keydown',keydown);desktop.addEventListener('change',resize);
    return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',keydown);desktop.removeEventListener('change',resize);previous?.focus();};
  },[sidebar]);
  const logout=async()=>{await dispatch(logoutUser());navigate('/login');};
  return <div className="admin-workspace owner-workspace">
    <header className="owner-mobile-header"><button aria-label="Open owner navigation" aria-expanded={sidebar} aria-controls="owner-navigation" onClick={()=>setSidebar(true)}><FiMenu/></button><div className="owner-brand"><img src="/mirror.svg" alt=""/>Mirror</div><div className="owner-mobile-actions"><NotificationsBell/><span className="owner-user-initial">{user?.name?.slice(0,1)||'O'}</span></div></header>
    {sidebar&&<button className="admin-sidebar-backdrop" aria-label="Close owner navigation" onClick={()=>setSidebar(false)}/>}
    <aside id="owner-navigation" ref={sidebarRef} className={`admin-sidebar ${sidebar?'is-open':''}`}><div className="owner-sidebar-brand"><div className="owner-brand"><img src="/mirror.svg" alt=""/>Mirror</div><button className="admin-icon-button admin-sidebar-close" aria-label="Close owner navigation" onClick={()=>setSidebar(false)}><FiX/></button></div><div className="owner-shop-label"><span>OWNER WORKSPACE</span><strong>{user?.shop?.name||'Your salon or shop'}</strong></div>
      <nav className="admin-sidebar-nav" aria-label="Owner menu">{visibleNavigation.map(item=><button className={`admin-nav-item ${view===item.id?'is-active':''}`} aria-current={view===item.id?'page':undefined} key={item.id} onClick={()=>select(item.id)}><span className="admin-nav-icon"><item.icon/></span><span>{item.label}</span></button>)}</nav>
      <div className="admin-sidebar-footer"><div className="admin-user-mini"><span className="owner-user-initial">{user?.name?.slice(0,1)||'O'}</span><div><strong>{user?.name||'Shop owner'}</strong><span>Owner / administrator</span></div></div><button className="admin-logout-link" onClick={logout}><FiLogOut/> Sign out</button></div>
    </aside>
    <main className="admin-main owner-main"><div className="owner-topbar"><div><p>{view==='overview'?'YOUR SHOP THIS WEEK':'SHOP OWNER PAGE'}</p><h1>{view==='overview'?`Hello, ${user?.name?.split(' ')[0]||'owner'}`:visibleNavigation.find(n=>n.id===view)?.label}</h1></div><div className="owner-topbar-right"><NotificationsBell/><button className="admin-secondary-button" onClick={()=>select(view==='reports'?'telegram':'reports')}>{view==='reports'?<FiSend/>:<FiBarChart2/>}{view==='reports'?'Telegram':'See reports'}</button></div></div>
      {view==='overview'&&<OwnerOverview open={select}/>}
      {view==='reports'&&<OwnerFinancialReport/>}
      {view==='stock'&&<OwnerStock/>}
      {view==='telegram'&&<TelegramSettings/>}
      {['team','services','compensation','payroll','finance','expenses','requests','package','messages','profile'].includes(view)&&<section className="admin-module-view admin-legacy-module">{view==='team'&&<UserManagement/>}{view==='services'&&<ServicesManagement/>}{view==='compensation'&&<CompensationSettings/>}{view==='payroll'&&<Payroll/>}{view==='finance'&&<PaymentSettings/>}{view==='expenses'&&<Expenses workspace="admin"/>}{view==='requests'&&<DayoffRequests/>}{view==='package'&&<PackageManagement/>}{view==='messages'&&<PlatformMessages/>}{view==='profile'&&<ProfileSettings/>}</section>}
    </main>
    <nav className="owner-bottom-nav" aria-label="Owner mobile navigation">{visibleNavigation.slice(0,3).map(item=><button className={view===item.id?'is-active':''} aria-current={view===item.id?'page':undefined} key={item.id} onClick={()=>select(item.id)}><item.icon/><span>{item.id==='reports'?'Reports':item.label}</span></button>)}<button className={!['overview','reports','team'].includes(view)?'is-active':''} onClick={()=>setSidebar(true)} aria-label="More owner pages" aria-expanded={sidebar} aria-controls="owner-navigation"><FiMoreHorizontal/><span>More</span></button></nav>
  </div>;
}
