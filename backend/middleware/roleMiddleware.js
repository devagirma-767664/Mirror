// middlewares/roleMiddleware.js
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // Ensure user context exists (from authMiddleware)
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: no user context' });
    }

    // Check if user role is permitted
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }

    next();
  };
};

module.exports = roleMiddleware;
