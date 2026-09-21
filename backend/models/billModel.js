const pool = require('../db');
const Finance = require('./deskFinanceModel');

const latestPaidCte = `WITH latest_paid AS (
  SELECT DISTINCT ON (appointment_id) id,appointment_id,total,paid_at,generated_at,barber_id
  FROM bills WHERE shop_id=$1 AND paid=true
  ORDER BY appointment_id,generated_at DESC,id DESC
)`;

const BillModel = {
  async generateBill(appointmentId, shopId, executor = pool) {
    const existing = await executor.query(
      `SELECT * FROM bills WHERE appointment_id=$1 AND shop_id=$2 ORDER BY generated_at DESC,id DESC LIMIT 1`,
      [appointmentId, shopId]
    );
    if (existing.rows[0]) return existing.rows[0];
    const appointmentResult = await executor.query(
      `SELECT a.id,a.customer_name,a.barber_id,a.service_id,s.name AS service_name,s.price,u.name AS barber_name,
              shop.timezone
       FROM appointments a
       LEFT JOIN services s ON s.id=a.service_id AND s.shop_id=a.shop_id
       JOIN users u ON u.id=a.barber_id AND u.shop_id=a.shop_id
       JOIN shops shop ON shop.id=a.shop_id
       WHERE a.id=$1 AND a.shop_id=$2 AND a.status='Completed'`,
      [appointmentId, shopId]
    );
    const appointment = appointmentResult.rows[0];
    if (!appointment) throw new Error('Create the bill through reception checkout.');
    const lines = (await executor.query('SELECT service_id,name,price FROM appointment_services WHERE appointment_id=$1 ORDER BY service_id',[appointmentId])).rows;
    if (!lines.length && appointment.service_id) lines.push({service_id:appointment.service_id,name:appointment.service_name,price:appointment.price});
    if (!lines.length) throw new Error('Confirm the services provided before creating a bill.');
    const subtotal = lines.reduce((sum,line)=>sum+Math.round(Number(line.price)*100),0)/100;
    const rate = 0; // Reception may add 15% when recording this payment.
    const tax = Math.round(subtotal * rate) / 100;
    const total = (Math.round(subtotal*100) + Math.round(tax*100))/100;
    const result = await executor.query(
      `INSERT INTO bills (appointment_id,shop_id,barber_id,service_id,customer_name,service_name,barber_name,subtotal,tax,total,paid,generated_at,items,vat_rate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,CURRENT_TIMESTAMP AT TIME ZONE $13,$11,$12) RETURNING *`,
      [appointmentId, shopId, appointment.barber_id, appointment.service_id, appointment.customer_name, lines.map(l=>l.name).join(' + '), appointment.barber_name, subtotal, tax, total,JSON.stringify(lines),rate,appointment.timezone]
    );
    return result.rows[0];
  },

  async getBillsReport(shopId) {
    const result = await pool.query(
      `SELECT DISTINCT ON (b.appointment_id) b.*,receiver.name AS received_by_name
       FROM bills b LEFT JOIN users receiver ON receiver.id=b.received_by
       WHERE b.shop_id=$1 ORDER BY b.appointment_id,b.generated_at DESC,b.id DESC`,
      [shopId]
    );
    return result.rows.sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));
  },

  async markPaid(billId, shopId, receivedBy, data) { return Finance.collect(shopId,receivedBy,billId,data); },

  async getIncomeAggregates(shopId) {
    const daily = await pool.query(`${latestPaidCte}
      SELECT DATE(COALESCE(paid_at,generated_at)) AS date,SUM(total) AS income,COUNT(*)::int AS customers
      FROM latest_paid GROUP BY 1 ORDER BY 1 DESC`, [shopId]);
    const weekly = await pool.query(`${latestPaidCte}
      SELECT DATE_TRUNC('week',COALESCE(paid_at,generated_at)) AS week,SUM(total) AS income,COUNT(*)::int AS customers
      FROM latest_paid GROUP BY 1 ORDER BY 1 DESC`, [shopId]);
    const monthly = await pool.query(`${latestPaidCte}
      SELECT DATE_TRUNC('month',COALESCE(paid_at,generated_at)) AS month,SUM(total) AS income,COUNT(*)::int AS customers
      FROM latest_paid GROUP BY 1 ORDER BY 1 DESC`, [shopId]);
    const summary = await pool.query(`${latestPaidCte}, totals AS (
      SELECT COALESCE(SUM(total),0) AS revenue,COUNT(*)::int AS paid_services FROM latest_paid
    ), expense_total AS (
      SELECT COALESCE(SUM(amount),0) AS expenses FROM expenses WHERE shop_id=$1
    ) SELECT revenue,paid_services,expenses,revenue-expenses AS net_income FROM totals,expense_total`, [shopId]);
    return { daily: daily.rows, weekly: weekly.rows, monthly: monthly.rows, summary: summary.rows[0] };
  },
};

module.exports = BillModel;
