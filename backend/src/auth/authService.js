import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import logger from '../config/logger.js';

/**
 * Authentication service - PIN-based authentication with JWT
 */

/**
 * Authenticate user with PIN
 */
export function authenticate(pin) {
  let role = null;

  if (pin === config.auth.pinOperator) {
    role = 'operator';
  } else if (pin === config.auth.pinMaintenance) {
    role = 'maintenance';
  }

  if (!role) {
    logger.warn({ pin: pin.replace(/./g, '*') }, 'Invalid PIN attempt');
    return null;
  }

  // Generate JWT token
  const token = jwt.sign(
    { role, timestamp: Date.now() },
    config.auth.jwtSecret,
    { expiresIn: '12h' }
  );

  logger.info({ role }, 'User authenticated');

  return { token, role };
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    return decoded;
  } catch (error) {
    logger.warn({ err: error.message }, 'Token verification failed');
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user, requiredRole) {
  if (!user || !user.role) {
    return false;
  }

  // Maintenance has all permissions
  if (user.role === 'maintenance') {
    return true;
  }

  // Check specific role
  return user.role === requiredRole;
}
