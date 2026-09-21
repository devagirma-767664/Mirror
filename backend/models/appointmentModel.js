const pool = require('../db');
const Finance=require('./deskFinanceModel');
const Subscription=require('./subscriptionModel');

const detailSelect = `
  SELECT a.id,a.customer_name,a.customer_phone,a.barber_id,a.service_id,a.start_time,
         a.service_started_at,a.end_time,a.actual_duration,a.status,a.appointment_type,a.created_at,
         COALESCE(lines.label,s.name,'Services to confirm') AS service_name,COALESCE(lines.price,s.price,0) AS service_price,u.name AS barber_name,
         COALESCE(lines.items,'[]'::jsonb) AS items
  FROM appointments a
  LEFT JOIN services s ON s.id=a.service_id AND s.shop_id=a.shop_id
  JOIN users u ON u.id=a.barber_id AND u.shop_id=a.shop_id
  LEFT JOIN LATERAL (SELECT STRING_AGG(name,' + ' ORDER BY service_id) AS label,SUM(price) AS price,
    JSONB_AGG(JSONB_BUILD_OBJECT('service_id',service_id,'name',name,'price',price) ORDER BY service_id) AS items
    FROM appointment_services WHERE appointment_id=a.id) lines ON true`;

const AppointmentModel = {
  async createAppointment(customerName, customerPhone, barberId, serviceId, startTime, shopId) {
    if (!barberId || !serviceId || !startTime || !shopId) throw new Error('Barber, service, and appointment time are required.');
    const bookingDay=String(startTime).slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(bookingDay)||!Number.isFinite(Date.parse(bookingDay))) throw new Error('Choose a valid appointment time.');
    return Finance.transaction(async db=>{
    const shop=await Finance.shopDay(shopId,db,true);
    await Subscription.assertDailyCustomerLimit(db,shop,bookingDay);
    const resource = await db.query(
      `SELECT EXISTS(SELECT 1 FROM users WHERE id=$1 AND shop_id=$3 AND role='barber') AS barber_ok,
              EXISTS(SELECT 1 FROM services WHERE id=$2 AND shop_id=$3) AS service_ok`,
      [barberId, serviceId, shopId]
    );
    if (!resource.rows[0].barber_ok || !resource.rows[0].service_ok) throw new Error('The selected barber or service does not belong to this shop.');
    const existing = await db.query(
      `SELECT id FROM appointments WHERE shop_id=$1 AND barber_id=$2 AND start_time=$3
       AND status IN ('Booked','Arrived','InProgress')`,
      [shopId, barberId, startTime]
    );
    if (existing.rowCount) throw new Error('This time is already booked for the selected barber.');
    const inserted = await db.query(
      `INSERT INTO appointments (customer_name,customer_phone,barber_id,service_id,start_time,status,appointment_type,shop_id)
       VALUES ($1,$2,$3,$4,$5,'Booked','booked',$6) RETURNING id`,
      [customerName || 'Booked customer', customerPhone || null, barberId, serviceId, startTime, shopId]
    );
    return this.getById(inserted.rows[0].id, shopId,db);
    });
  },

  async getById(id, shopId, executor = pool) {
    const result = await executor.query(`${detailSelect} WHERE a.id=$1 AND a.shop_id=$2`, [id, shopId]);
    return result.rows[0];
  },

  async getAllAppointments(shopId) {
    const result = await pool.query(`${detailSelect} WHERE a.shop_id=$1 ORDER BY a.start_time DESC`, [shopId]);
    return result.rows;
  },

  async getAllActiveAppointments(shopId) {
    const result = await pool.query(
      `${detailSelect} WHERE a.shop_id=$1 AND a.status IN ('Booked','Arrived','InProgress')
       ORDER BY CASE a.status WHEN 'InProgress' THEN 1 WHEN 'Arrived' THEN 2 ELSE 3 END,a.start_time`,
      [shopId]
    );
    return result.rows;
  },

  async getActiveAppointments(barberId, shopId) {
    const result = await pool.query(
      `${detailSelect} WHERE a.barber_id=$1 AND a.shop_id=$2 AND a.status IN ('Booked','Arrived','InProgress')
       ORDER BY CASE a.status WHEN 'InProgress' THEN 1 WHEN 'Arrived' THEN 2 ELSE 3 END,a.start_time`,
      [barberId, shopId]
    );
    return result.rows;
  },

  async getAppointmentsByBarberId(barberId, shopId) {
    const result = await pool.query(`${detailSelect} WHERE a.barber_id=$1 AND a.shop_id=$2 ORDER BY a.start_time DESC`, [barberId, shopId]);
    return result.rows;
  },

  async checkInAppointment(id, shopId) {
    const Finance = require('./deskFinanceModel');
    return Finance.transaction(async executor => {
    const shop = await Finance.shopDay(shopId,executor,true);
    await Finance.assertOpen(shopId,shop.today,executor);
    const result = await executor.query(
      `UPDATE appointments SET status='Arrived' WHERE id=$1 AND shop_id=$2 AND status='Booked' RETURNING *`,
      [id, shopId]
    );
    if (!result.rows[0]) throw new Error('Only a booked appointment can be checked in.');
    return this.getById(id, shopId,executor);
    });
  },

  async startSession(id, barberId, shopId) {
    const result = await pool.query(
      `UPDATE appointments SET status='InProgress',service_started_at=COALESCE(service_started_at,NOW())
       WHERE id=$1 AND barber_id=$2 AND shop_id=$3 AND status IN ('Arrived','InProgress') RETURNING *`,
      [id, barberId, shopId]
    );
    if (!result.rows[0]) throw new Error('This customer is not ready for your chair.');
    return this.getById(id, shopId);
  },

  async closeSession(id, barberId, shopId, executor = pool) {
    const result = await executor.query(
      `UPDATE appointments SET status='Completed',end_time=NOW(),
       actual_duration=GREATEST(0,ROUND(EXTRACT(EPOCH FROM (NOW()-COALESCE(service_started_at,start_time)))/60))
       WHERE id=$1 AND barber_id=$2 AND shop_id=$3 AND status='InProgress' RETURNING *`,
      [id, barberId, shopId]
    );
    if (!result.rows[0]) throw new Error('Only your active service can be completed.');
    return this.getById(id, shopId, executor);
  },

  async assignWalkIn(customerName, serviceId, barberId, shopId) {
    return Finance.transaction(async db=>{
    const shop=await Finance.shopDay(shopId,db,true);
    await Subscription.assertDailyCustomerLimit(db,shop,shop.today);
    const resource = await db.query(
      `SELECT EXISTS(SELECT 1 FROM users WHERE id=$1 AND shop_id=$3 AND role='barber') AS barber_ok,
              EXISTS(SELECT 1 FROM services WHERE id=$2 AND shop_id=$3) AS service_ok`,
      [barberId, serviceId, shopId]
    );
    if (!resource.rows[0].barber_ok || !resource.rows[0].service_ok) throw new Error('Choose a valid barber and service for this shop.');
    const inserted = await db.query(
      `INSERT INTO appointments (customer_name,barber_id,service_id,start_time,status,appointment_type,shop_id)
       VALUES ($1,$2,$3,NOW(),'Arrived','walk_in',$4) RETURNING id`,
      [customerName || 'Walk-in customer', barberId, serviceId, shopId]
    );
    return this.getById(inserted.rows[0].id, shopId,db);
    });
  },

  async getBarberPerformance(shopId) {
    const result = await pool.query(`
      WITH latest_paid AS (
        SELECT DISTINCT ON (appointment_id) id,appointment_id,total,barber_id
        FROM bills WHERE shop_id=$1 AND paid=true
        ORDER BY appointment_id,generated_at DESC,id DESC
      ), paid_by_barber AS (
        SELECT barber_id,COUNT(*)::int AS customers,COALESCE(SUM(total),0) AS income,
               COALESCE(ROUND(AVG(total),2),0) AS average_ticket
        FROM latest_paid GROUP BY barber_id
      ), completed_by_barber AS (
        SELECT barber_id,COUNT(*)::int AS completed_services FROM appointments
        WHERE shop_id=$1 AND status='Completed' GROUP BY barber_id
      )
      SELECT u.id AS barber_id,u.name AS barber_name,
             COALESCE(pb.customers,0) AS customers,
             COALESCE(pb.income,0) AS income,
             COALESCE(pb.average_ticket,0) AS average_ticket,
             COALESCE(cb.completed_services,0) AS completed_services
      FROM users u
      LEFT JOIN paid_by_barber pb ON pb.barber_id=u.id
      LEFT JOIN completed_by_barber cb ON cb.barber_id=u.id
      WHERE u.shop_id=$1 AND u.role='barber'
      ORDER BY income DESC,u.name`, [shopId]);
    return result.rows;
  },
};

module.exports = AppointmentModel;
