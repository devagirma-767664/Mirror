import {useEffect,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {FiArrowRight,FiPlus,FiTrash2,FiCheck} from 'react-icons/fi';
import api from '../../api/axios';
import {useAppDispatch,useAppSelector} from '../../app/hooks';
import {refreshUser} from '../../features/auth/authSlice';
import {logoutUser} from '../../features/auth/authThunks';
import {useDeskResource} from '../Reception/desk';

type Person={name:string;phone:string;password:string;role:'barber'|'receptionist'};
type SetupError={message:string;step:number;field?:string};

export default function StoreSetup(){
  const user=useAppSelector(s=>s.auth.user),dispatch=useAppDispatch(),navigate=useNavigate();
  const existing=useDeskResource<{counts:{barbers:number;receptionists:number;services:number};shop:{onboarding_completed_at:string|null}}>('/admin/onboarding',0);
  const [step,setStep]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState<SetupError|null>(null);
  const [team,setTeam]=useState<Person[]>([{name:'',phone:'',password:'',role:'barber'},{name:'',phone:'',password:'',role:'receptionist'}]);
  const [services,setServices]=useState([{name:'Haircut',price:'',duration:30}]);
  useEffect(()=>{if(error?.field)document.getElementById(error.field)?.focus();},[error]);
  const fields=(field:string)=>({id:field,'aria-invalid':error?.field===field,'aria-describedby':error?.field===field?'setup-error':undefined});
  const showError=(issue:SetupError)=>{setStep(issue.step);setError(issue);};
  const validateTeam=():SetupError|null=>{
    const phones=new Set<string>();
    for(const [i,p] of team.entries()){
      const name=p.name.trim(),phone=p.phone.replace(/[^0-9+]/g,''),field=`team.${i}`;
      if(!name)return {message:`Enter a name for team member ${i+1}.`,step:0,field:`${field}.name`};
      if(!/^(?:0[79]\d{8}|(?:\+?251)[79]\d{8})$/.test(phone))return {message:`${name}: enter an Ethiopian mobile number, for example 0912345678.`,step:0,field:`${field}.phone`};
      if(phones.has(phone))return {message:`${name}: use a different phone number for each team member.`,step:0,field:`${field}.phone`};
      phones.add(phone);
      if(p.password.length<8||new TextEncoder().encode(p.password).length>72)return {message:`${name}: use a password of at least 8 characters and at most 72 bytes.`,step:0,field:`${field}.password`};
    }
    if(!team.some(p=>p.role==='barber')&&!existing.data?.counts.barbers)return {message:'Add at least one stylist.',step:0,field:'team.0.role'};
    if(!team.some(p=>p.role==='receptionist')&&!existing.data?.counts.receptionists)return {message:'Add at least one receptionist.',step:0,field:'team.0.role'};
    return null;
  };
  const validateServices=():SetupError|null=>{
    for(const [i,s] of services.entries()){
      if(!s.name.trim())return {message:'Enter a name for each service.',step:1,field:`services.${i}.name`};
      if(!s.price||!Number.isFinite(Number(s.price))||Number(s.price)<=0)return {message:`${s.name}: enter a price greater than zero.`,step:1,field:`services.${i}.price`};
    }
    return null;
  };
  const submit=async()=>{
    const issue=validateTeam()||(step>0?validateServices():null);
    if(issue){showError(issue);return;}
    setError(null);
    if(step<2){setStep(step+1);return;}
    setBusy(true);
    try{
      const saved=await api.post('/admin/onboarding',{
        team:team.map(p=>({...p,name:p.name.trim(),phone:p.phone.trim()})),services,
      },{validateStatus:status=>status===400||(status>=200&&status<300)});
      if(saved.status===400){showError({message:saved.data.error,step:[0,1,2].includes(saved.data.step)?saved.data.step:step,field:saved.data.field});return;}
      const r=await api.get('/auth/me');dispatch(refreshUser(r.data.user));navigate('/admin',{replace:true});
    }catch(e){setError({message:typeof e==='string'?e:'Unable to save setup. Your entries are still here; please try again.',step});}
    finally{setBusy(false);}
  };
  return <main className="saas-setup saas-site">
    <header><Link to="/" className="saas-brand saas-brand-mirror" aria-label="Mirror — see your salon clearly"><img src="/mirror.svg" alt=""/><b>Mirror</b></Link><button className="saas-text-link" onClick={()=>dispatch(logoutUser())}>Sign out</button></header>
    <div className="saas-setup-heading"><span className="saas-eyebrow">WELCOME TO {user?.shop?.name}</span><h1>Make it your shop.</h1><p>A few details now, a smoother day at reception.</p></div>
    {existing.data?.shop.onboarding_completed_at?<div className="saas-setup-card"><h2>Your shop is ready.</h2><p>Update staff, services, and payment accounts from your owner page.</p><Link to="/admin" className="saas-button">Open my page <FiArrowRight/></Link></div>:
    <div className="saas-setup-card">
      <ol className="saas-setup-progress">{['Your team','Your services','Ready to open'].map((v,i)=><li className={step===i?'is-current':step>i?'is-done':''} aria-current={step===i?'step':undefined} key={v}><span>{step>i?<FiCheck/>:i+1}</span>{v}</li>)}</ol>
      <form noValidate onSubmit={e=>{e.preventDefault();if(!busy)void submit();}}><fieldset disabled={busy}>
        {(error||existing.error)&&<p id="setup-error" className="saas-error" role="alert">{error?.message||existing.error}</p>}
        {step===0&&<><h2>Who’s working at your shop?</h2><p>Start with one stylist and one receptionist. Give each person their own phone number and password to sign in.</p>
          {team.map((p,i)=><div className="saas-person" key={i}>
            <div className="saas-inline-fields"><label>Role<select {...fields(`team.${i}.role`)} value={p.role} onChange={e=>setTeam(team.map((t,j)=>j===i?{...t,role:e.target.value as Person['role']}:t))}><option value="barber">Stylist</option><option value="receptionist">Receptionist</option></select></label><label>Name<input {...fields(`team.${i}.name`)} required maxLength={100} value={p.name} onChange={e=>setTeam(team.map((t,j)=>j===i?{...t,name:e.target.value}:t))}/></label></div>
            <div className="saas-inline-fields"><label>Team member’s phone<input {...fields(`team.${i}.phone`)} required type="tel" inputMode="tel" maxLength={20} placeholder="e.g. 0912345678" autoComplete="off" value={p.phone} onChange={e=>setTeam(team.map((t,j)=>j===i?{...t,phone:e.target.value}:t))}/></label><label>Account password<input {...fields(`team.${i}.password`)} required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={p.password} onChange={e=>setTeam(team.map((t,j)=>j===i?{...t,password:e.target.value}:t))}/></label></div>
            {team.length>2&&<button type="button" className="saas-text-link" onClick={()=>setTeam(team.filter((_,j)=>i!==j))}><FiTrash2/> Remove team member</button>}
          </div>)}<button type="button" className="saas-text-link" disabled={team.length>=12} onClick={()=>setTeam([...team,{name:'',phone:'',password:'',role:'barber'}])}><FiPlus/> Add another team member</button>
        </>}
        {step===1&&<><h2>What services do you offer?</h2><p>Add your menu prices in {user?.shop?.currency||'ETB'}. Reception can add optional 15% VAT when collecting each payment.</p>
          {services.map((s,i)=><div className="saas-service-fields" key={i}><label>Service<input {...fields(`services.${i}.name`)} required maxLength={100} value={s.name} onChange={e=>setServices(services.map((t,j)=>j===i?{...t,name:e.target.value}:t))}/></label><label>Price ({user?.shop?.currency||'ETB'})<input {...fields(`services.${i}.price`)} required type="number" min="0.01" step="0.01" inputMode="decimal" value={s.price} onChange={e=>setServices(services.map((t,j)=>j===i?{...t,price:e.target.value}:t))}/></label><button type="button" aria-label={`Remove service ${i+1}`} disabled={services.length===1} onClick={()=>setServices(services.filter((_,j)=>i!==j))}><FiTrash2/></button></div>)}
          <button type="button" className="saas-text-link" disabled={services.length>=30} onClick={()=>setServices([...services,{name:'',price:'',duration:30}])}><FiPlus/> Add another service</button>
        </>}
        {step===2&&<><h2>Your shop is ready to open.</h2><div className="saas-setup-summary"><span><FiCheck/> {team.length} staff accounts</span><span><FiCheck/> {services.length} services</span><span><FiCheck/> Front desk cash</span></div><p>You can add bank or Telebirr accounts later under Payments & closings.</p><p>Use your shop during the 7-day trial. If you choose Mirror Max, Mirror will contact you about website support.</p></>}
        <div className="saas-setup-actions">{step>0&&<button type="button" className="saas-text-link" onClick={()=>{setStep(step-1);setError(null);}}>Back</button>}<button className="saas-button" disabled={busy||existing.loading||!!existing.error}>{busy?'Opening your shop…':step===2?'Open my page':'Continue'}<FiArrowRight/></button></div>
      </fieldset></form>
    </div>}
  </main>;
}
