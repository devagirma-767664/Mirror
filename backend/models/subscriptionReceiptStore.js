const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const backendRoot=path.join(__dirname,'..');
const privateRoot=path.join(backendRoot,'private','payment-receipts');
fs.mkdirSync(privateRoot,{recursive:true});
const extensionFor={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'};

function safeName(value){
  const base=path.basename(String(value||'receipt')).replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,255);
  return base||'receipt';
}

async function save(file){
  if(!file?.buffer) throw new Error('Attach a screenshot of the transfer receipt (PNG, JPG, or WEBP, up to 5 MB).');
  const extension=extensionFor[file.mimetype];
  if(!extension) throw new Error('Attach a PNG, JPG, or WEBP receipt screenshot.');
  const filename=`${crypto.randomUUID()}${extension}`;
  const relative=path.join('private','payment-receipts',filename);
  const absolute=path.join(backendRoot,relative);
  await fs.promises.writeFile(absolute,file.buffer,{flag:'wx'});
  return {path:relative.replace(/\\/g,'/'),originalName:safeName(file.originalname),mimeType:file.mimetype,size:file.size||file.buffer.length};
}

async function remove(relative){
  if(!relative) return;
  const absolute=path.resolve(backendRoot,relative);
  if(path.dirname(absolute)!==privateRoot) return;
  await fs.promises.rm(absolute,{force:true});
}

function resolve(relative){
  if(!relative) return null;
  const absolute=path.resolve(backendRoot,relative);
  if(path.dirname(absolute)!==privateRoot) return null;
  return absolute;
}

module.exports={save,remove,resolve,privateRoot};
