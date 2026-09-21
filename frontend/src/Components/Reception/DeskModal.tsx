import { useEffect, useId, useRef, type ReactNode } from 'react';
import { FiX } from 'react-icons/fi';

export default function DeskModal({title,children,onClose,busy=false}:{title:string;children:ReactNode;onClose:()=>void;busy?:boolean}) {
  const ref=useRef<HTMLDivElement>(null);
  const titleId=useId();
  const close=useRef(onClose);close.current=onClose;
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';ref.current?.focus();
    return()=>{document.body.style.overflow=overflow;previous?.focus();};
  },[]);
  return <div className="reception-modal-backdrop"><div className="reception-modal desk-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={ref} onKeyDown={event=>{
    if(event.key==='Escape'&&!busy) close.current();
    if(event.key==='Tab') {
      const nodes=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')||[]);
      const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey && (document.activeElement===first||document.activeElement===ref.current)){event.preventDefault();last?.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
    }
  }}><div className="desk-modal-heading"><h2 id={titleId}>{title}</h2><button type="button" className="admin-icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}><FiX/></button></div>{children}</div></div>;
}
