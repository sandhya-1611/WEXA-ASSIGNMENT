module.exports = function requireRole(role) {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (req.user.role !== role) {
        return res.status(403).json({ message: "Forbidden: insufficient role" });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};
