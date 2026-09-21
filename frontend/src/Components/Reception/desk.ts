import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/axios';

export type Account = { id: number; name: string; method: string; reference: string; active: boolean };
export const defaultCashAccount=(accounts:Account[]=[])=>accounts.filter(a=>a.active&&a.method==='cash').sort((a,b)=>a.id-b.id)[0];
export type FinanceSettings = { name:string; currency:string; today:string; timezone:string; vat_enabled:boolean; vat_rate:number|string; accounts:Account[] };
export type Service = { id:number; name:string; price:number|string };
export type Visit = { id:number; barber_id:number; barber_name:string; customer_name:string; service_id:number|null; service_name:string; service_price?:number|string; status:string; start_time:string; service_started_at?:string; items:Array<{service_id:number;name:string;price:number|string}> };
export type Barber = { id:number; name:string; desk_status:string };
export type Board = { today:string; barbers:Barber[]; visits:Visit[] };
export type Bill = { id:number; appointment_id:number; customer_name:string; barber_name:string; service_name:string; subtotal:number|string; tax:number|string; total:number|string; paid:boolean; vat_rate?:number|string; generated_at:string; paid_at?:string; payment_recorded_at?:string; payment_day?:string; payment_method?:string; payment_account_name?:string; payment_account_reference?:string; transaction_reference?:string; cash_received?:number|string; received_by_name?:string; items?:Array<{name:string;price:number|string}> };
export type AccountTotal = Account & {collected:number;services:number;vat:number;expenses:number;count:number;opening:number;opening_set:boolean;net:number;expected_cash:number|null;counted?:number;difference?:number};
export type Daily = {date:string;today:string;currency:string;autoStarted?:boolean;accounts:AccountTotal[];methods:Array<{method:string;collected:number}>;collected:number;services:number;vat:number;expenses:number;net:number;pending:{count:number;total:number|string};inShop:number;closing:null|{id:number;closed_at:string;closed_by_name:string;notes:string}};
export const methodName = (value:string) => ({cash:'Cash',bank_transfer:'Bank transfer',telebirr:'Telebirr',mobile_money:'Legacy mobile money',card:'Legacy card',unknown:'Not recorded'}[value] || value);
export const amount = (value:number|string|null|undefined,currency='ETB') => `${currency} ${Number(value||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
export const visitName = (visit:{id?:number;appointment_id?:number;customer_name?:string}) => `#${String(visit.appointment_id || visit.id).padStart(3,'0')}${visit.customer_name && visit.customer_name!=='Walk-in customer' ? ` · ${visit.customer_name}` : ''}`;
export const dateTime = (value?:string) => {const date=new Date(value||''); return Number.isNaN(date.getTime())?'Time unavailable':date.toLocaleString('en-GB',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});};
const stylistize = (message:string) => message
  .replace(/\bbarbers\b/gi, match => match === match.toUpperCase() ? 'STYLISTS' : match[0] === match[0].toUpperCase() ? 'Stylists' : 'stylists')
  .replace(/\bbarber\b/gi, match => match === match.toUpperCase() ? 'STYLIST' : match[0] === match[0].toUpperCase() ? 'Stylist' : 'stylist');
export const errorText = (error:unknown) => stylistize(typeof error==='string'?error:error instanceof Error?error.message:'Could not save. Try again.');

export function useDeskResource<T>(path:string, interval=12000) {
  const [data,setData]=useState<T|null>(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const version=useRef(0);
  const refresh=useCallback(async()=>{
    const request=++version.current;
    try { const response=await api.get<T>(path); if(request===version.current) {setData(response.data);setError('');} }
    catch(e) {if(request===version.current) setError(errorText(e));}
    finally {if(request===version.current) setLoading(false);}
  },[path]);
  useEffect(()=>{
    setLoading(true);setData(null);refresh();
    const update=()=>{if(document.visibilityState==='visible') refresh();};
    const timer=interval?window.setInterval(update,interval):undefined;
    window.addEventListener('focus',update);
    return()=>{version.current++;window.clearInterval(timer);window.removeEventListener('focus',update);};
  },[refresh,interval]);
  return {data,error,loading,refresh};
}
