const pool = require('../db');

const AppointmentModel = {
  async createAppointment(customerName, customerPhone, barberId, serviceId, startTime) {

    if (!barberId || !serviceId) {
    throw new Error("Service and barber must be selected for appointment.");
    }
    const checkQuery = `
      SELECT * FROM appointments
      WHERE barber_id = $1 AND start_time = $2
    `;
    const existing = await pool.query(checkQuery, [barberId, startTime]);

    if (existing.rows.length > 0) {
      throw new Error("This time is already booked for the selected barber.");
    }

    const insertQuery = `
      INSERT INTO appointments (customer_name, customer_phone, barber_id, service_id, start_time, status)
      VALUES ($1, $2, $3, $4, $5, 'Booked')
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [customerName, customerPhone, barberId, serviceId, startTime]);
    return result.rows[0];
  },

  // ✅ Fetch all appointments (Receptionist/Admin)
  async getAllAppointments() {
    const query = `
      SELECT a.id,
             a.customer_name,
             a.customer_phone,
             a.start_time,
             a.status,
             s.name AS service_name,
             s.price AS service_price,
             u.name AS barber_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN users u ON a.barber_id = u.id
      WHERE u.role = 'barber'
      ORDER BY a.start_time ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // ✅ Fetch active appointments (Booked/Arrived)
  async getActiveAppointments(barberId) {
  const query = `
    SELECT a.id,
           a.customer_name,
           a.customer_phone,
           a.start_time,
           a.status,
           s.name AS service_name,
           s.price AS service_price,
           u.name AS barber_name
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    JOIN users u ON a.barber_id = u.id
    WHERE a.barber_id = $1
      AND a.barber_id IS NOT NULL   -- ✅ exclude unassigned
      AND a.status IN ('Booked','Arrived','InProgress')
    ORDER BY a.start_time ASC;
  `;
  const result = await pool.query(query, [barberId]);
  return result.rows;
}
,

  // ✅ Fetch appointments by barber (all statuses)
  async getAppointmentsByBarberId(barberId) {
  const query = `
    SELECT a.id,
           a.customer_name,
           a.customer_phone,
           a.start_time,
           a.status,
           s.name AS service_name,
           s.price AS service_price
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    WHERE a.barber_id = $1
      AND a.barber_id IS NOT NULL   -- ✅ exclude unassigned
    ORDER BY a.start_time ASC;
  `;
  const result = await pool.query(query, [barberId]);
  return result.rows;
}
,

  async checkInAppointment(id) {
    const result = await pool.query(
      `UPDATE appointments SET status = 'Arrived' WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  async startSession(id) {
    const result = await pool.query(
      `UPDATE appointments SET status = 'InProgress', start_time = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  async closeSession(id) {
    const result = await pool.query(
      `UPDATE appointments SET status = 'Completed', end_time = NOW(),
       actual_duration = EXTRACT(EPOCH FROM (NOW() - start_time))/60
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  // ✅ Assign Walk-In and generate bill
async assignWalkIn(name, serviceId, barberId) {
  // Insert appointment
  const query = `
    INSERT INTO appointments (customer_name, barber_id, service_id, start_time, status)
    VALUES ($1, $2, $3, NOW(), 'Arrived')
    RETURNING id, customer_name, barber_id, service_id, start_time, status;
  `;
  const result = await pool.query(query, [name, barberId, serviceId]);
  const appt = result.rows[0];

  // Fetch service price
  const serviceRes = await pool.query(`SELECT price, name FROM services WHERE id = $1`, [serviceId]);
  const { price, name: serviceName } = serviceRes.rows[0];

  // Fetch barber name
  const barberRes = await pool.query(`SELECT name FROM users WHERE id = $1`, [barberId]);
  const barberName = barberRes.rows[0].name;

  // ✅ Insert bill for this walk-in
  await pool.query(
    `INSERT INTO bills (appointment_id, customer_name, service_name, barber_name, total, paid)
     VALUES ($1, $2, $3, $4, $5, false)`,
    [appt.id, appt.customer_name, serviceName, barberName, price]
  );

  // Return appointment with joins
  const joinQuery = `
    SELECT a.id, a.customer_name, a.start_time, a.status,
           s.name AS service_name,
           s.price AS service_price,
           u.name AS barber_name
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    JOIN users u ON a.barber_id = u.id
    WHERE a.id = $1;
  `;
  const joined = await pool.query(joinQuery, [appt.id]);
  return joined.rows[0];
},

// appointmentModel.js
async getBarberPerformance() {
  const result = await pool.query(`
    SELECT u.name AS barber_name,
           COUNT(a.id) AS customers,
           SUM(b.total) AS income
    FROM appointments a
    JOIN users u ON a.barber_id = u.id
    JOIN bills b ON b.appointment_id = a.id
    WHERE u.role = 'barber'
    GROUP BY u.name
    ORDER BY customers DESC;
  `);
  return result.rows;
}


};

module.exports = AppointmentModel;
