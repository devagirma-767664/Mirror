import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Link,Navigate,useLocation} from 'react-router-dom';
import {FiClock,FiLogOut} from 'react-icons/fi';
import api from '../api/axios';
import {useAppDispatch,useAppSelector} from '../app/hooks';
import {refreshUser,setSession} from '../features/auth/authSlice';
import {logoutUser} from '../features/auth/authThunks';
import PackageManagement from './Admin/PackageManagement';
export default function WorkspaceAccess({children}:{children:ReactNode}) {
  const dispatch=useAppDispatch(),location=useLocation();
  const {user,token}=useAppSelector(s=>s.auth);
  const [loading,setLoading]=useState(true),[error,setError]=useState('');
  const lastActivity=useRef(Date.now());
  useEffect(()=>{
    let active=true;
    const check=async()=>{try{const r=await api.get('/auth/me');if(active){dispatch(refreshUser(r.data.user));setError('');}}catch(e){if(active)setError(typeof e==='string'?e:'Could not open your page.');}finally{if(active)setLoading(false);}};
    const expired=()=>{void dispatch(logoutUser());};
    const focus=()=>{if(document.visibilityState==='visible')void check();};
    void check();const timer=window.setInterval(focus,30000);
    window.addEventListener('focus',focus);window.addEventListener('subscription-required',check);window.addEventListener('session-expired',expired);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',focus);window.removeEventListener('subscription-required',check);window.removeEventListener('session-expired',expired);};
  },[dispatch,token,user?.id]);
  useEffect(()=>{
    if(!user||!token)return;
    const idleLimit=60*60*1000;
    let idleTimer=0;
    let refreshTimer=0;
    const signOutForInactivity=()=>{void dispatch(logoutUser());};
    const resetIdleTimer=()=>{
      lastActivity.current=Date.now();
      window.clearTimeout(idleTimer);
      idleTimer=window.setTimeout(signOutForInactivity,idleLimit);
    };
    const refreshSession=async()=>{
      if(Date.now()-lastActivity.current>=idleLimit)return;
      try{const response=await api.post('/auth/refresh');dispatch(setSession(response.data));}
      catch{/* A rejected refresh raises the shared session-expired event. */}
    };
    const activityEvents:['pointerdown','keydown','touchstart','scroll']=['pointerdown','keydown','touchstart','scroll'];
    activityEvents.forEach(event=>window.addEventListener(event,resetIdleTimer,{passive:true}));
    resetIdleTimer();
    refreshTimer=window.setInterval(refreshSession,15*60*1000);
    return()=>{window.clearTimeout(idleTimer);window.clearInterval(refreshTimer);activityEvents.forEach(event=>window.removeEventListener(event,resetIdleTimer));};
  },[dispatch,token,user?.id]);
  if(loading)return <main className="saas-access-state">Opening your page…</main>;
  if(error)return <main className="saas-access-state"><p role="alert">{error}</p><button onClick={()=>window.location.reload()}>Try again</button><button onClick={()=>dispatch(logoutUser())}>Sign in again</button></main>;
  if(!user)return <Navigate to="/login" replace/>;
  if(user.role==='platform_admin')return <>{children}</>;
  const access=user.subscription;
  if(!access?.canOperate)return <main className="saas-restricted"><header><Link to="/"><img src="/mirror.svg" alt=""/> Mirror</Link><button className="admin-secondary-button" onClick={()=>dispatch(logoutUser())}><FiLogOut/> Sign out</button></header><div className="saas-access-intro"><p className="admin-eyebrow">{user.shop?.name}</p><h1>{access?.status==='trial_expired'?'Your 7-day trial has ended.':access?.status==='suspended'?'Your shop page is paused.':'Choose a package to continue.'}</h1><p>{user.role==='admin'?'Your shop records are safe. Choose a package and send your payment screenshot for checking.':'Ask the shop owner to renew the package. Your page opens again after approval.'}</p></div>{user.role==='admin'&&<PackageManagement/>}</main>;
  if(user.role==='admin'&&!access.onboardingComplete&&location.pathname!=='/admin/setup'&&new URLSearchParams(location.search).get('view')!=='package')return <Navigate to="/admin/setup" replace/>;
  return <>{access.status==='trial'&&<div className="saas-trial-banner" role="status"><FiClock/><span>{access.daysRemaining} {access.daysRemaining===1?'day':'days'} left in your free trial</span>{user.role==='admin'&&<Link to="/admin?view=package">Choose a package</Link>}</div>}{children}</>;
}
