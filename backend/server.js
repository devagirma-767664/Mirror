const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const barberRoutes = require('./routes/barberRoutes');
const receptionistRoutes = require('./routes/receptionistRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/servicesRoutes');
const appointmentRoutes = require("./routes/appointmentRoutes")

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());

// Static file serving (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root health check
app.get('/', (req, res) => {
  res.send('BarberBook API is running!');
});

// Database connectivity test
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Mount routes with role-based access
app.use('/admin', adminRoutes);
app.use('/barber', barberRoutes);
app.use('/receptionist', receptionistRoutes);
app.use('/ratings', ratingRoutes);
app.use('/auth', authRoutes);
app.use('/services', serviceRoutes);
app.use("/appointments", appointmentRoutes);


// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
