type WorkspaceRole='admin'|'barber'|'receptionist'|'platform_admin'|string|undefined;

const homeFor=(role:WorkspaceRole)=>{
  if(role==='platform_admin')return '/platform';
  if(role==='admin')return '/admin?view=messages';
  if(role==='barber')return '/barber';
  if(role==='receptionist')return '/receptionist';
  return '/';
};

// Notification paths are supplied by the API. Keep navigation inside the
// correct signed-in workspace, and recover cleanly from old or malformed paths.
export const notificationDestination=(path:string|undefined,role:WorkspaceRole)=>{
  const fallback=homeFor(role),raw=String(path||'').trim();
  if(!raw||!raw.startsWith('/')||/^\/[\\/]/.test(raw))return fallback;
  try{
    const target=new URL(raw,window.location.origin);
    if(target.origin!==window.location.origin)return fallback;
    const destination=target.pathname+target.search+target.hash;
    if(role==='platform_admin')return destination.startsWith('/platform')?destination:fallback;
    if(role==='admin')return destination.startsWith('/admin')?destination:fallback;
    return fallback;
  }catch{return fallback;}
};
