const pool = require('../db');
const Finance = require('./deskFinanceModel');
const Appointments = require('./appointmentModel');
const Bills = require('./billModel');
const Subscription=require('./subscriptionModel');

async function setServices(db, shopId, visitId, ids) {
  if (!Array.isArray(ids) || ids.length > 30 || ids.some(id => !Number.isInteger(Number(id)) || Number(id) <= 0)) throw new Error('Select valid services.');
  ids = [...new Set(ids.map(Number))];
  const available = (await db.query('SELECT id,name,price FROM services WHERE shop_id=$1 AND id=ANY($2::int[])', [shopId,ids])).rows;
  if (available.length !== ids.length) throw new Error('A selected service does not belong to this shop.');
  // Retain the quoted price of unchanged services; new selections use the current menu.
  await db.query('DELETE FROM appointment_services WHERE appointment_id=$1 AND NOT(service_id=ANY($2::int[]))', [visitId,ids]);
  for (const item of available) await db.query('INSERT INTO appointment_services(appointment_id,service_id,name,price) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING', [visitId,item.id,item.name,item.price]);
  await db.query('UPDATE appointments SET service_id=$2 WHERE id=$1 AND shop_id=$3', [visitId,ids[0] || null,shopId]);
}

const Desk = {
  async board(shopId) {
    const shop = await Finance.shopDay(shopId);
    const barbers = (await pool.query("SELECT id,name,profile_picture,desk_status FROM users WHERE shop_id=$1 AND role='barber' ORDER BY name", [shopId])).rows;
    const visits = await Appointments.getAllActiveAppointments(shopId);
    return { today:shop.today,barbers,visits:visits.filter(v=>v.status!=='Booked') };
  },
  async create(shopId,userId,data) {
    return Finance.transaction(async db=>{
      const shop=await Finance.shopDay(shopId,db,true);
      await Finance.assertOpen(shopId,shop.today,db);
      await Subscription.assertDailyCustomerLimit(db,shop,shop.today);
      const barber=(await db.query("SELECT id,desk_status FROM users WHERE id=$1 AND shop_id=$2 AND role='barber' FOR UPDATE", [data.barberId,shopId])).rows[0];
      if(!barber) throw new Error('Choose a barber in this shop.');
      if(barber.desk_status==='away') throw new Error('This barber is away. Mark them available before assigning a customer.');
      const row=(await db.query(`INSERT INTO appointments(customer_name,barber_id,start_time,status,appointment_type,shop_id,updated_by)
        VALUES($1,$2,CURRENT_TIMESTAMP AT TIME ZONE $3,'Arrived','walk_in',$4,$5) RETURNING id`, [Finance.text(data.nickname,100,'Nickname',false)||'Walk-in customer',barber.id,shop.timezone,shopId,userId])).rows[0];
      await setServices(db,shopId,row.id,data.serviceIds || []);
      return Appointments.getById(row.id,shopId,db);
    });
  },
  async checkout(shopId,userId,id,data={}) {
    return Finance.transaction(async db=>{
      const shop=await Finance.shopDay(shopId,db,true);
      const visit=(await db.query('SELECT * FROM appointments WHERE id=$1 AND shop_id=$2 FOR UPDATE',[id,shopId])).rows[0];
      if(!visit) throw new Error('Visit not found.');
      if(!['Arrived','InProgress','Completed'].includes(visit.status)) throw new Error('Only an assigned customer can be checked out.');
      if(visit.status==='Completed') {
        const bill=await Bills.generateBill(id,shopId,db);
        if(data.serviceIds!==undefined) {
          const ids=Array.isArray(data.serviceIds)?[...new Set(data.serviceIds.map(Number))].sort((a,b)=>a-b):[];
          const saved=(bill.items||[]).map(item=>Number(item.service_id)).sort((a,b)=>a-b);
          if(JSON.stringify(ids)!==JSON.stringify(saved)) throw new Error('This visit already has a bill. Review its saved services in Payments.');
        }
        return Finance.collect(shopId,userId,bill.id,data,db);
      }
      await Finance.assertOpen(shopId,shop.today,db);
      if(data.serviceIds!==undefined) await setServices(db,shopId,id,data.serviceIds);
      else if(!(await db.query('SELECT 1 FROM appointment_services WHERE appointment_id=$1',[id])).rowCount && visit.service_id) await setServices(db,shopId,id,[visit.service_id]);
      if(!(await db.query('SELECT 1 FROM appointment_services WHERE appointment_id=$1',[id])).rowCount) throw new Error('Select the services provided before collecting payment.');
      // Queue time is not service duration. Completion and collection commit together.
      await db.query(`UPDATE appointments SET status='Completed',end_time=CURRENT_TIMESTAMP AT TIME ZONE $3,
        actual_duration=NULL,updated_by=$4 WHERE id=$1 AND shop_id=$2`,[id,shopId,shop.timezone,userId]);
      const bill=await Bills.generateBill(id,shopId,db);
      return Finance.collect(shopId,userId,bill.id,data,db);
    });
  },
  async update(shopId,userId,id,action,data={}) {
    if(!['services','cancel'].includes(action)) throw new Error('Assign the customer, then collect payment. Start and finish are no longer needed.');
    return Finance.transaction(async db=>{
      const shop=await Finance.shopDay(shopId,db,true);
      await Finance.assertOpen(shopId,shop.today,db);
      const visit=(await db.query('SELECT * FROM appointments WHERE id=$1 AND shop_id=$2 FOR UPDATE', [id,shopId])).rows[0];
      if(!visit) throw new Error('Visit not found.');
      if(!['Arrived','InProgress'].includes(visit.status)) throw new Error('This visit can no longer be changed.');
      if(action==='services') {
        await setServices(db,shopId,id,data.serviceIds);
      } else if(action==='cancel') {
        await db.query("UPDATE appointments SET status='Cancelled',cancellation_reason=$3,updated_by=$4,end_time=CURRENT_TIMESTAMP AT TIME ZONE $5 WHERE id=$1 AND shop_id=$2",[id,shopId,Finance.text(data.reason||'Customer left before service',220,'Cancellation reason'),userId,shop.timezone]);
      }
      await db.query('UPDATE appointments SET updated_by=$3 WHERE id=$1 AND shop_id=$2',[id,shopId,userId]);
      return Appointments.getById(id,shopId,db);
    });
  },
  async availability(shopId,userId,id,status) {
    if(!['available','break','away'].includes(status)) throw new Error('Choose an availability status.');
    return Finance.transaction(async db=>{
      await Finance.shopDay(shopId,db,true);
      const row=(await db.query("UPDATE users SET desk_status=$3 WHERE id=$1 AND shop_id=$2 AND role='barber' RETURNING id,name,desk_status",[id,shopId,status])).rows[0];
      if(!row) throw new Error('Barber not found.');
      return row;
    });
  },
};
module.exports=Desk;
