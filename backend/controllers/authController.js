const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const UserModel = require('../models/userModel');

const AuthController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check approval flag (if applicable)
      if (user.approved === false) {
        return res.status(403).json({ error: 'Account not yet approved by supervisor' });
      }

      // Compare password
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Normalize role casing
      const normalizedRole = user.role?.toLowerCase();

      // Create JWT
      const token = jwt.sign(
        { id: user.id, role: normalizedRole },
        process.env.JWT_SECRET || 'secretkey',
        { expiresIn: '1h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: normalizedRole,
          profilePicture: user.profilePicture
        },
        expiresIn: 3600,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = AuthController;
