const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',       
  host: 'localhost',      
  database: 'barberbook', 
  password: 'newpassword', 
  port: 5432,             
});

module.exports = pool;
