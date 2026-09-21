import {useState} from 'react';
import {FiBell} from 'react-icons/fi';
import api from '../../api/axios';
import {useDeskResource,errorText} from '../Reception/desk';

type Message={id:number;kind:string;title:string;body:string;path:string;createdAt:string;readAt:string|null};
export default function PlatformMessages(){
  const resource=useDeskResource<{unread:number;notifications:Message[]}>('/admin/notifications',15000);
  const [error,setError]=useState('');
  const open=async(message:Message)=>{try{if(!message.readAt){await api.put(`/admin/notifications/${message.id}/read`);await resource.refresh();}window.location.assign(message.path);}catch(e){setError(errorText(e));}};
  return <section className="admin-module-view desk-module"><header className="admin-module-header"><div><p className="admin-eyebrow">FROM MIRROR</p><h2 className="admin-module-title">Platform messages</h2><p className="admin-module-subtitle">Payment decisions, account updates, and notes from the Mirror platform team.</p></div>{!!resource.data?.unread&&<span className="admin-status-pill is-pending">{resource.data.unread} new</span>}</header>
    {(error||resource.error)&&<div className="admin-inline-error" role="alert">{error||resource.error}</div>}
    <div className="owner-stack">{resource.data?.notifications.map(message=><article className={`owner-card admin-platform-message ${message.readAt?'':'is-unread'}`} key={message.id}><div className="owner-card-head"><div><p>{message.kind.replaceAll('_',' ').toUpperCase()}</p><h3><FiBell/> {message.title}</h3></div><time>{new Date(message.createdAt).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})}</time></div><p>{message.body}</p><button className="admin-secondary-button" onClick={()=>open(message)}>{message.readAt?'Open related page':'Read & open'}</button></article>)}</div>
    {!resource.loading&&!resource.data?.notifications.length&&<div className="admin-empty-state">Platform updates, including payment approval decisions, will appear here.</div>}
  </section>;
}
