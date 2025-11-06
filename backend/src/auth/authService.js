import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import logger from '../config/logger.js';

/**
 * Authentication service - PIN-based authentication with JWT
 */

/**
 * Authenticate user with username and password
 */
export function authenticate(username, password) {
  let role = null;

  // Fixed credentials
  if (username === 'admin' && password === '2222') {
    role = 'maintenance';
  } else if (username === 'guest' && password === '1111') {
    role = 'operator';
  }

  if (!role) {
    logger.warn({ username }, 'Invalid login attempt');
    return null;
  }

  // Generate JWT token
  const token = jwt.sign(
    { role, username, timestamp: Date.now() },
    config.auth.jwtSecret,
    { expiresIn: '12h' }
  );

  logger.info({ role, username }, 'User authenticated');

  return { token, role, username };
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
