const pool = require('../db');

const BillModel = {
  async generateBill(appointmentId) {
    // 1. Fetch appointment details with joins
    const apptRes = await pool.query(`
      SELECT a.id, a.customer_name, s.name AS service_name, s.price, u.name AS barber_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN users u ON a.barber_id = u.id
      WHERE a.id = $1
    `, [appointmentId]);

    const appt = apptRes.rows[0];

    // 2. Guard clause: stop if no appointment found
    if (!appt) {
      throw new Error("Appointment not found or missing service/barber info");
    }

    // 3. Calculate totals
    const price = Number(appt.price);
    const vat = price * 0.15;
    const grandTotal = price + vat;

    // 4. Insert bill
    const result = await pool.query(
      `INSERT INTO bills (appointment_id, customer_name, service_name, barber_name, total, paid, generated_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW())
       RETURNING *`,
      [appointmentId, appt.customer_name, appt.service_name, appt.barber_name, grandTotal]
    );


    // 6. Return bill with breakdown
    return { ...result.rows[0], price, vat, total: grandTotal };
  },

  async getBillsReport() {
    const res = await pool.query(`SELECT * FROM bills ORDER BY generated_at DESC`);
    return res.rows;
  },

  async markPaid(billId) {
    const res = await pool.query(
      `UPDATE bills SET paid = true, paid_at = NOW() WHERE id = $1 RETURNING *`,
      [billId]
    );
    return res.rows[0];
  },

  // billModel.js
async getIncomeAggregates() {
  const daily = await pool.query(`
    SELECT DATE(a.start_time) AS date,
           SUM(b.total) AS income,
           COUNT(a.id) AS customers
    FROM bills b
    JOIN appointments a ON b.appointment_id = a.id
    GROUP BY DATE(a.start_time)
    ORDER BY date DESC;
  `);

  const weekly = await pool.query(`
    SELECT DATE_TRUNC('week', a.start_time) AS week,
           SUM(b.total) AS income,
           COUNT(a.id) AS customers
    FROM bills b
    JOIN appointments a ON b.appointment_id = a.id
    GROUP BY week
    ORDER BY week DESC;
  `);

  const monthly = await pool.query(`
    SELECT DATE_TRUNC('month', a.start_time) AS month,
           SUM(b.total) AS income,
           COUNT(a.id) AS customers
    FROM bills b
    JOIN appointments a ON b.appointment_id = a.id
    GROUP BY month
    ORDER BY month DESC;
  `);

  return { daily: daily.rows, weekly: weekly.rows, monthly: monthly.rows };
}

};

module.exports = BillModel;
