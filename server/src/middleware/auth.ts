import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types/index.js';
import { store } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hotelpro_super_secure_jwt_secret_key_change_in_production';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    assignedHotelId?: string;
  };
}

export function generateToken(payload: { id: string; email: string; role: UserRole; name: string; assignedHotelId?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      res.status(403).json({ success: false, error: 'Invalid or expired token.' });
      return;
    }

    // Verify user exists and is active
    const user = store.users.find(u => u._id === decoded.id);
    if (!user || user.accountStatus === 'suspended') {
      res.status(403).json({ success: false, error: 'User account is inactive or not found.' });
      return;
    }

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      assignedHotelId: user.assignedHotelId,
    };
    next();
  });
}

export function optionalAuthToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (!err && decoded) {
      const user = store.users.find(u => u._id === decoded.id);
      if (user && user.accountStatus !== 'suspended') {
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          assignedHotelId: user.assignedHotelId,
        };
      }
    }
    next();
  });
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
}
