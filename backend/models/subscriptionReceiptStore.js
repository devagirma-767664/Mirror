const path=require('path');
const crypto=require('crypto');
const storage=require('../storage/objectStorage');

const backendRoot=path.join(__dirname,'..');
const privateRoot=path.join(backendRoot,'private','payment-receipts');
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
  await storage.save(relative,file.buffer,{contentType:file.mimetype,cacheControl:'private, no-store'});
  return {path:relative.replace(/\\/g,'/'),originalName:safeName(file.originalname),mimeType:file.mimetype,size:file.size||file.buffer.length};
}

async function remove(relative){
  if(!relative) return;
  if(!String(relative).replace(/\\/g,'/').startsWith('private/payment-receipts/')) return;
  await storage.remove(relative);
}

async function read(relative){
  if(!relative) return null;
  if(!String(relative).replace(/\\/g,'/').startsWith('private/payment-receipts/')) return null;
  return storage.read(relative);
}

module.exports={save,remove,read,privateRoot};
