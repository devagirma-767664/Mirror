import { useState } from 'react';
import { FiPackage, FiSearch } from 'react-icons/fi';
import { useDeskResource } from '../Reception/desk';
type Item={id:number;name:string;quantity:string;reorder_level:string;unit:string;supplier:string;category:string;low_stock:boolean};
export default function OwnerStock(){
  const resource=useDeskResource<Item[]>('/admin/owner/inventory',30000);
  const [query,setQuery]=useState(''),[lowOnly,setLowOnly]=useState(false);
  const items=resource.data||[];
  const low=items.filter(item=>item.low_stock).length;
  const filtered=items.filter(item=>(!lowOnly||item.low_stock)&&[item.name,item.supplier,item.category].some(value=>value?.toLowerCase().includes(query.trim().toLowerCase()))).sort((a,b)=>Number(b.low_stock)-Number(a.low_stock)||a.name.localeCompare(b.name));
  return <div className="owner-stack">
    <div className="owner-section-intro"><div><p>SHOP SUPPLIES</p><h2>Stock</h2><span>Reception adds stock changes. Check here when you need to buy more.</span></div>{resource.data&&<span className={`owner-badge ${low?'amber':'green'}`}>{low} items to buy</span>}</div>
    {resource.error&&<div className="admin-inline-error" role="alert">{resource.error}</div>}
    <div className="owner-filter-bar"><div className="desk-tabs" aria-label="Stock filter"><button aria-pressed={!lowOnly} className={!lowOnly?'is-active':''} onClick={()=>setLowOnly(false)}>All supplies ({items.length})</button><button aria-pressed={lowOnly} className={lowOnly?'is-active':''} onClick={()=>setLowOnly(true)}>Need to buy ({low})</button></div><label className="admin-search-box"><FiSearch/><input aria-label="Find stock or supplier" placeholder="Find a supply or supplier" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
    {resource.loading&&<p>Loading shop stock…</p>}
    <div className="owner-stock-grid">{filtered.map(i=><article className="owner-card" key={i.id}><div className="owner-card-head"><span className="owner-kpi-icon purple"><FiPackage/></span><span className={`owner-badge ${i.low_stock?'amber':'green'}`}>{Number(i.quantity)===0?'Out of stock':i.low_stock?'Restock':'In stock'}</span></div><h3>{i.name}</h3><strong className="owner-stock-quantity">{Number(i.quantity)} <small>{i.unit}</small></strong><p className="owner-note">Reorder at {Number(i.reorder_level)} {i.unit}<br/>{i.supplier?`Supplier: ${i.supplier}`:'Supplier not recorded'}</p></article>)}</div>
    {resource.data&&!filtered.length&&<p className="owner-empty">{!items.length?'Reception can add shop supplies from the Stock page.':query?'No supplies match this search.':'All supplies are above their low-stock levels.'}</p>}
  </div>;
}
