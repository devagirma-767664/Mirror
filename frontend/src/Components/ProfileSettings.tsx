import {useEffect,useState} from 'react';
import {FiCheckCircle,FiEye,FiEyeOff,FiImage,FiLock,FiSave,FiUser} from 'react-icons/fi';
import api,{API_URL} from '../api/axios';
import {useAppDispatch,useAppSelector} from '../app/hooks';
import {refreshUser} from '../features/auth/authSlice';
import {errorText} from './Reception/desk';
import '../styles/owner.css';

export default function ProfileSettings(){
  const user=useAppSelector(state=>state.auth.user),dispatch=useAppDispatch();
  const [name,setName]=useState(user?.name||''),[phone,setPhone]=useState(user?.phone||''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const canEditPhone=['admin','barber','receptionist','platform_admin'].includes(String(user?.role||''));
  const contactPhone=['admin','platform_admin'].includes(String(user?.role||''));
  useEffect(()=>{setName(user?.name||'');setPhone(user?.phone||'');},[user?.name,user?.phone]);
  useEffect(()=>{if(!file){setPreview(null);return;}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
  const save=async(event:React.FormEvent)=>{event.preventDefault();setBusy(true);setError('');setNotice('');try{const form=new FormData();form.append('name',name);if(canEditPhone&&phone.trim())form.append('phone',phone.trim());if(password)form.append('password',password);if(file)form.append('profilePicture',file);const {data}=await api.put('/auth/profile',form,{headers:{'Content-Type':'multipart/form-data'}});dispatch(refreshUser(data.user));setPassword('');setFile(null);setNotice('Your profile is saved.');}catch(e){setError(errorText(e));}finally{setBusy(false);}};
  const image=preview||user?.profilePicture&&(user.profilePicture.startsWith('/')?API_URL+user.profilePicture:user.profilePicture);
  return <section className="admin-module-view desk-module"><header className="admin-module-header"><div><p className="admin-eyebrow">MY PROFILE</p><h2 className="admin-module-title">My account</h2><p className="admin-module-subtitle">Change your name, photo, or password here. Only the shop owner can turn an account on or off.</p></div></header>
    {error&&<div className="admin-inline-error" role="alert">{error}</div>}{notice&&<div className="desk-success" role="status"><FiCheckCircle/>{notice}</div>}
    <form className="admin-module-card desk-form profile-settings" onSubmit={save}><div className="profile-settings-photo"><div className="admin-avatar admin-avatar-medium">{image?<img src={image} alt="Your profile"/>:<FiUser/>}</div><label className="admin-secondary-button"><FiImage/> {file?'Photo selected':'Change photo'}<input type="file" className="admin-file-input" accept="image/jpeg,image/png,image/gif" onChange={e=>setFile(e.target.files?.[0]||null)}/></label></div>
      <label className="admin-field">Name<input className="admin-input" required maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label>
      {canEditPhone&&<label className="admin-field">{contactPhone?'Contact phone':'Phone number'}<input className="admin-input" type="tel" inputMode="tel" maxLength={30} value={phone} placeholder="0912345678" onChange={e=>setPhone(e.target.value)}/><small>{contactPhone?'Mirror uses this number to contact you about your package or Plus services.':'Use this phone number to sign in.'}</small></label>}
      {contactPhone&&<div className="profile-settings-identity"><FiLock/><div><strong>{user?.role==='admin'?'Owner email':'Platform email'}</strong><span>{user?.email||'Not available'}</span></div></div>}
      <label className="admin-field">New password <small>Leave this empty if you want to keep the same password.</small><span className="saas-password"><input className="admin-input" type={show?'text':'password'} minLength={8} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/><button type="button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(!show)}>{show?<FiEyeOff/>:<FiEye/>}</button></span></label>
      <button className="admin-primary-button" disabled={busy}><FiSave/>{busy?'Saving…':'Save profile'}</button></form>
  </section>;
}
