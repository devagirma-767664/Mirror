const pool = require('../db');

const UserModel = {
  async createUser(name, email, role, password, profilePicture) {
    const query = `
      INSERT INTO users (name, email, role, password, profile_picture)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, profile_picture, created_at;
    `;
    const result = await pool.query(query, [name, email, role, password, profilePicture]);
    return result.rows[0];
  },

  async getAllUsers() {
    const result = await pool.query(
      'SELECT id, name, email, role, profile_picture, created_at FROM users'
    );
    return result.rows;
  },

  async findByEmail(email) {
    const result = await pool.query(
      'SELECT id, name, email, role, password, profile_picture FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async deleteUser(id) {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, name, email, role, profile_picture, created_at',
      [id]
    );
    return result.rows[0];
  },

  async getBarbers() {
    const result = await pool.query(
      "SELECT id, name, email, role, profile_picture FROM users WHERE role = $1",
      ["barber"]
    );
    return result.rows;
  },
};

module.exports = UserModel;
