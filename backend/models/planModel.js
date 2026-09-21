const pool=require('../db');
const Finance=require('./deskFinanceModel');
const featureKeys=['publicWebsite','onlineBooking'];
function validate(data) {
  const name=Finance.text(data.name,80,'Package name'),description=Finance.text(data.description,400,'Package description');
  const price=Finance.money(data.monthly_price,'Monthly price');
  if(price<=0||price>99999999.99) throw new Error('Set a monthly price greater than zero.');
  if(!['basic','plus','max'].includes(data.tier)) throw new Error('Choose Basic, Plus, or Max capabilities.');
  const staff=Number(data.limits?.staff);
  if(!Number.isInteger(staff)||staff<3||staff>1000) throw new Error('Allow 3–1,000 team accounts, including the owner.');
  if(!Array.isArray(data.highlights)||data.highlights.length>12) throw new Error('Add up to 12 package contents.');
  const highlights=data.highlights.map(v=>Finance.text(v,180,'Package content'));
  if(!data.features||featureKeys.some(k=>typeof data.features[k]!=='boolean')) throw new Error('Choose the included capabilities.');
  const extended=['plus','max'].includes(data.tier);
  const features={inventoryAlerts:true,telegramDigest:extended,...Object.fromEntries(featureKeys.map(k=>[k,data.features[k]]))};
  if(data.tier!=='max'&&(features.publicWebsite||features.onlineBooking)) throw new Error('Website and online booking are available with Mirror Max only.');
  if(features.onlineBooking&&!features.publicWebsite) throw new Error('Include the shop website to offer online booking.');
  const dailyCustomers={basic:20,plus:50,max:0}[data.tier];
  return {name,description,price,staff,dailyCustomers,features,highlights,tier:data.tier};
}
module.exports={
  async list(){return (await pool.query(`SELECT p.*, (SELECT COUNT(*)::int FROM shops s WHERE s.plan_code=p.code) AS shop_count
    FROM subscription_plans p ORDER BY active DESC,monthly_price,code`)).rows;},
  async save(code,data){
    const p=validate(data);
    return Finance.transaction(async db=>{
      // Serialize catalog changes, including the trial default and removal decisions.
      await db.query("SELECT pg_advisory_xact_lock(hashtext('mirror-package-catalog'))");
      if(!code){
        code=String(data.code||'').trim().toLowerCase();
        if(!/^[a-z][a-z0-9_]{2,39}$/.test(code)) throw new Error('Use 3–40 letters, numbers or underscores for the package code.');
        if((await db.query('SELECT code FROM subscription_plans WHERE code=$1',[code])).rowCount) throw new Error('This package code already exists. Edit or restore that package.');
        return (await db.query(`INSERT INTO subscription_plans(code,name,description,monthly_price,tier,features,limits,highlights)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[code,p.name,p.description,p.price,p.tier,p.features,{staff:p.staff,dailyCustomers:p.dailyCustomers},JSON.stringify(p.highlights)])).rows[0];
      }
      const previous=(await db.query('SELECT * FROM subscription_plans WHERE code=$1 FOR UPDATE',[code])).rows[0];
      if(!previous) throw new Error('Package not found.');
      // Existing optional flags are preserved; only supported capabilities are exposed for editing.
      return (await db.query(`UPDATE subscription_plans SET name=$2,description=$3,monthly_price=$4,tier=$5,
        features=features||$6::jsonb,limits=limits||$7::jsonb,highlights=$8,updated_at=NOW() WHERE code=$1 RETURNING *`,
        [code,p.name,p.description,p.price,p.tier,p.features,{staff:p.staff,dailyCustomers:p.dailyCustomers},JSON.stringify(p.highlights)])).rows[0];
    });
  },
  async availability(code,active){
    if(typeof active!=='boolean') throw new Error('Choose package availability.');
    return Finance.transaction(async db=>{
      await db.query("SELECT pg_advisory_xact_lock(hashtext('mirror-package-catalog'))");
      const plan=(await db.query('SELECT * FROM subscription_plans WHERE code=$1 FOR UPDATE',[code])).rows[0];
      if(!plan) throw new Error('Package not found.');
      if(!active&&plan.is_trial_default) throw new Error('Choose another available package for the free trial before removing this one.');
      return (await db.query('UPDATE subscription_plans SET active=$2,updated_at=NOW() WHERE code=$1 RETURNING *',[code,active])).rows[0];
    });
  },
  async trialDefault(code){
    return Finance.transaction(async db=>{
      await db.query("SELECT pg_advisory_xact_lock(hashtext('mirror-package-catalog'))");
      const plan=(await db.query('SELECT * FROM subscription_plans WHERE code=$1 AND active=true FOR UPDATE',[code])).rows[0];
      if(!plan) throw new Error('Choose an available trial package.');
      await db.query('UPDATE subscription_plans SET is_trial_default=false WHERE is_trial_default');
      return (await db.query('UPDATE subscription_plans SET is_trial_default=true,updated_at=NOW() WHERE code=$1 RETURNING *',[code])).rows[0];
    });
  },
};
