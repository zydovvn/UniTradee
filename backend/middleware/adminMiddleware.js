// middleware/adminMiddleware.js
export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role?.toLowerCase() !== 'admin') {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};
