const bcrypt=require('bcrypt');
const pool=require('../db');
const Finance=require('./deskFinanceModel');
const Shop=require('./shopModel');
const Session=require('./sessionModel');
const {normalizePhone}=require('../utils/phone');
const setupError=(message,step,field)=>Object.assign(new Error(message),{step,field});
const workspaceSlug=name=>{
  const letters=String(name||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');
  const base=(letters||'shop').slice(0,52);
  return base.length>=3?base:`shop${base}`;
};
const generatedSuffix=()=>Array.from(require('crypto').randomBytes(7),byte=>String.fromCharCode(97+(byte%26))).join('');
async function uniqueWorkspaceSlug(db,shopName) {
  const base=workspaceSlug(shopName);
  // Owners creating the same-named shop are serialized so the first gets the clean URL.
  await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`shop-slug:${base}`]);
  for(let attempt=0;attempt<20;attempt++) {
    const slug=attempt===0?base:`${base.slice(0,52)}${generatedSuffix()}`;
    if(!(await db.query('SELECT 1 FROM shops WHERE slug=$1',[slug])).rowCount)return slug;
  }
  throw new Error('Unable to prepare your workspace. Please try again.');
}
const email=value=>{
  const result=String(value||'').trim().toLowerCase();
  if(result.length>180||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new Error('Enter a complete email address, for example name@gmail.com.');
  return result;
};
const password=value=>{
  if(typeof value!=='string'||value.length<8||Buffer.byteLength(value)>72) throw new Error('Use a password of at least 8 characters and at most 72 bytes.');
  return value;
};
const Onboarding={
  async signup(data) {
    const ownerEmail=email(data.email),ownerPhone=normalizePhone(data.ownerPhone),name=Finance.text(data.ownerName,100,'Your name'),shopName=Finance.text(data.shopName,140,'Shop name');
    const hash=await bcrypt.hash(password(data.password),10);
    const id=await Finance.transaction(async db=>{
      await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[ownerEmail]);
      await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[ownerPhone]);
      if((await db.query('SELECT id FROM users WHERE LOWER(email)=$1 OR phone=$2',[ownerEmail,ownerPhone])).rowCount) throw new Error('This email or phone number already has an account. Sign in to your workspace.');
      const slug=await uniqueWorkspaceSlug(db,shopName);
      const trial=(await db.query('SELECT code FROM subscription_plans WHERE active=true AND is_trial_default=true FOR SHARE')).rows[0];
      if(!trial) throw new Error('Free trial setup is temporarily unavailable. Please try again later.');
      const shop=(await db.query(`INSERT INTO shops(name,slug,plan_code,subscription_status,subscription_source,trial_started_at,trial_ends_at)
        VALUES($1,$2,$3,'trial','trial',NOW(),NOW()+INTERVAL '7 days') RETURNING id`,[shopName,slug,trial.code])).rows[0];
      const owner=(await db.query("INSERT INTO users(name,email,phone,password,role,shop_id) VALUES($1,$2,$3,$4,'admin',$5) RETURNING id",[name,ownerEmail,ownerPhone,hash,shop.id])).rows[0];
      await require('./platformEventModel').shopEvent(db,shop.id,{key:`signup:${shop.id}`,kind:'signup',title:'New shop · 7-day trial started',details:'Free trial: 7 days. No paid package chosen yet.'});
      return owner.id;
    });
    return Session.session(id);
  },
  async details(shopId) {
    const shop=await Shop.getById(shopId);
    const counts=(await pool.query(`SELECT (SELECT COUNT(*)::int FROM users WHERE shop_id=$1 AND role='barber') AS barbers,
      (SELECT COUNT(*)::int FROM users WHERE shop_id=$1 AND role='receptionist') AS receptionists,
      (SELECT COUNT(*)::int FROM services WHERE shop_id=$1) AS services,
      (SELECT COUNT(*)::int FROM payment_accounts WHERE shop_id=$1 AND active=true) AS accounts`,[shopId])).rows[0];
    return {shop,counts};
  },
  async complete(shopId,adminId,data) {
    const accounts=Array.isArray(data.team)?data.team:[];
    if(accounts.length>12) throw new Error('Add up to 12 team members during setup.');
    const usedPhones=new Set();
    const team=[];
    for(const [index,person] of accounts.entries()) {
      const field=`team.${index}`;
      if(!['barber','receptionist'].includes(person.role)) throw setupError('Choose a barber or receptionist role.',0,`${field}.role`);
      let name,personPhone,personPassword;
      try {name=Finance.text(person.name,100,`Team member ${index+1} name`);} catch(e) {throw setupError(e.message,0,`${field}.name`);}
      try {personPhone=normalizePhone(person.phone);} catch(e) {throw setupError(`${name}: ${e.message}`,0,`${field}.phone`);}
      if(usedPhones.has(personPhone)) throw setupError(`${name}: each team member needs a different phone number.`,0,`${field}.phone`);
      usedPhones.add(personPhone);
      try {personPassword=password(person.password);} catch(e) {throw setupError(`${name}: ${e.message}`,0,`${field}.password`);}
      team.push({name,phone:personPhone,role:person.role,hash:await bcrypt.hash(personPassword,10),field});
    }
    const services=Array.isArray(data.services)?data.services:[];
    if(services.length>30) throw new Error('Add up to 30 services during setup.');
    const validated=services.map((s,index)=>{
      let name,price;
      try {name=Finance.text(s.name,100,'Service name');} catch(e) {throw setupError(e.message,1,`services.${index}.name`);}
      try {price=Finance.money(s.price,'Service price');} catch(e) {throw setupError(e.message,1,`services.${index}.price`);}
      if(price<=0) throw setupError(`${name}: enter a price greater than zero.`,1,`services.${index}.price`);
      const duration=Number(s.duration||30);
      if(!Number.isInteger(duration)||duration<5||duration>480) throw setupError('Service duration must be 5–480 minutes.',1,`services.${index}.name`);
      return {name,price,duration};
    });
    return Finance.transaction(async db=>{
      const shop=(await db.query('SELECT * FROM shops WHERE id=$1 FOR UPDATE',[shopId])).rows[0];
      if(shop.onboarding_completed_at) return {completed:true};
      if(!require('./subscriptionModel').access(shop).canOperate) throw new Error('Choose a package before completing setup.');
      const plan=(await db.query('SELECT limits,features FROM subscription_plans WHERE code=$1',[shop.plan_code])).rows[0];
      const staffCount=Number((await db.query('SELECT COUNT(*) AS n FROM users WHERE shop_id=$1',[shopId])).rows[0].n);
      if(plan.limits?.staff && staffCount+team.length>Number(plan.limits.staff)) throw new Error(`This package allows ${plan.limits.staff} accounts, including the owner. Add fewer team members or choose a higher package.`);
      for(const person of [...team].sort((a,b)=>a.phone.localeCompare(b.phone))) {
        await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[person.phone]);
        if((await db.query('SELECT id FROM users WHERE phone=$1',[person.phone])).rowCount) throw setupError(`${person.name}: this phone number already has an account. Use a different number for this team member.`,0,`${person.field}.phone`);
        await db.query('INSERT INTO users(name,email,phone,password,role,shop_id,has_workspace) VALUES($1,NULL,$2,$3,$4,$5,true)',[person.name,person.phone,person.hash,person.role,shopId]);
      }
      for(const s of validated) await db.query('INSERT INTO services(name,price,duration,shop_id) VALUES($1,$2,$3,$4)',[s.name,s.price,s.duration,shopId]);
      const counts=(await db.query(`SELECT (SELECT COUNT(*) FROM users WHERE shop_id=$1 AND role='barber') AS barbers,
        (SELECT COUNT(*) FROM users WHERE shop_id=$1 AND role='receptionist') AS receptionists,
        (SELECT COUNT(*) FROM services WHERE shop_id=$1) AS services`,[shopId])).rows[0];
      if(!Number(counts.barbers)||!Number(counts.receptionists)) throw setupError('Add at least one barber and one receptionist to open your workspace.',0,'team.0.role');
      if(!Number(counts.services)) throw setupError('Add at least one service to open your workspace.',1,'services.0.name');
      await db.query(`INSERT INTO payment_accounts(shop_id,name,method,created_by) VALUES($1,'Front desk till','cash',$2) ON CONFLICT(shop_id,name) DO NOTHING`,[shopId,adminId]);
      // Setup opens the management workspace.
      await db.query('UPDATE shops SET onboarding_completed_at=NOW() WHERE id=$1',[shopId]);
      return {completed:true};
    });
  },
};
module.exports=Onboarding;
