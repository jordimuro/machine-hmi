import { verifyToken } from './authService.js';
import logger from '../config/logger.js';

/**
 * Middleware to authenticate JWT token
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Attach user to request
  req.user = decoded;
  next();
}

/**
 * Middleware to require specific role
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Maintenance has all permissions
    if (req.user.role === 'maintenance') {
      return next();
    }

    // Check specific role
    if (req.user.role !== role) {
      logger.warn(
        { userRole: req.user.role, requiredRole: role },
        'Insufficient permissions'
      );
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Optional authentication - attaches user if token is valid but doesn't reject if missing
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}
