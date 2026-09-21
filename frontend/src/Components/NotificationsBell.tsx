import {useEffect,useState} from 'react';
import {FiBell,FiChevronRight,FiCheckCircle} from 'react-icons/fi';
import api from '../api/axios';
import DeskModal from './Reception/DeskModal';
import {dateTime,errorText,useDeskResource} from './Reception/desk';

type Notification={id:number;kind:string;title:string;body:string;path:string;createdAt:string;readAt:string|null};
type Feed={unread:number;notifications:Notification[]};

export default function NotificationsBell({className='',feedPath='/auth/notifications',readPath=feedPath,emptyMessage='New updates will show here.'}:{className?:string;feedPath?:string;readPath?:string;emptyMessage?:string}){
  const resource=useDeskResource<Feed>(feedPath,15000);
  const [open,setOpen]=useState(false),[error,setError]=useState(''),[opening,setOpening]=useState<number|null>(null);
  const unread=resource.data?.unread||0;
  useEffect(()=>{
    const refresh=()=>void resource.refresh();
    window.addEventListener('mirror-notifications-updated',refresh);
    return()=>window.removeEventListener('mirror-notifications-updated',refresh);
  },[resource.refresh]);
  const openNotification=async(notification:Notification)=>{
    setError('');setOpening(notification.id);
    try {
      if(!notification.readAt){
        await api.put(`${readPath}/${notification.id}/read`);
        window.dispatchEvent(new Event('mirror-notifications-updated'));
      }
      if(notification.path){setOpen(false);window.location.assign(notification.path);}
      else await resource.refresh();
    } catch(e){setError(errorText(e));}
    finally{setOpening(null);}
  };
  return <><button type="button" className={`workspace-notification-button ${className}`} aria-label={unread?`Notifications, ${unread} unread`:'Notifications'} onClick={()=>{setError('');setOpen(true);}}><FiBell/>{unread>0&&<span className="workspace-notification-count" aria-hidden="true">{unread>99?'99+':unread}</span>}</button>
    {open&&<DeskModal title="Updates" busy={opening!==null} onClose={()=>setOpen(false)}><div className="workspace-notification-feed">{error&&<p className="admin-inline-error" role="alert">{error}</p>}{resource.loading&&<p className="workspace-notification-empty">Loading updates…</p>}{resource.data?.notifications.map(notification=><button type="button" className={`workspace-notification-item ${notification.readAt?'':'is-unread'}`} key={notification.id} disabled={opening===notification.id} onClick={()=>void openNotification(notification)}><span className="workspace-notification-icon"><FiBell/></span><span><strong>{notification.title}</strong><small>{dateTime(notification.createdAt)}</small><p>{notification.body}</p></span><FiChevronRight/></button>)}{!resource.loading&&!resource.data?.notifications.length&&<div className="workspace-notification-empty"><FiCheckCircle/><strong>No new updates</strong><span>{emptyMessage}</span></div>}</div></DeskModal>}
  </>;
}
