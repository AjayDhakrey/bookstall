import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getStore } from '../repositories/store.js';
import type { StaffPartner, UserRole } from '../types.js';
import { sendError } from './httpResponses.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'vanguard-book-dealer-jwt-secret-2026-production';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: StaffPartner | null;
      authToken?: string | null;
    }
  }
}

export function sanitizeStaff(staff: StaffPartner): StaffPartner {
  const { passwordHash, password, ...safe } = staff;
  return safe as StaffPartner;
}

export function signToken(user: StaffPartner): string {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    req.authToken = null;
    return next();
  }

  const token = authHeader.substring(7).trim();
  req.authToken = token;

  const decoded = verifyJwtToken(token);
  if (decoded) {
    const store = getStore();
    const found = store.staff.find((s) => s.id === decoded.id && s.active !== false);
    if (found) {
      req.user = sanitizeStaff(found);
      return next();
    }
  }

  // Fallback for legacy tokens if any
  const store = getStore();
  const legacyFound = store.staff.find((s) => s.token === token && s.active !== false);
  if (legacyFound) {
    req.user = sanitizeStaff(legacyFound);
    return next();
  }

  req.user = null;
  return next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.user) return next();

  if (req.headers.authorization) {
    return sendError(res, 'Invalid or expired authentication token. Please log in again.', 401);
  }

  if (process.env.ENFORCE_AUTH === 'true' || req.headers['x-enforce-auth']) {
    return sendError(res, 'Authentication required. Please log in.', 401);
  }

  return next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
      if (allowedRoles.includes(req.user.role)) return next();
      return sendError(res, `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`, 403);
    }

    if (req.headers.authorization) {
      return sendError(res, 'Invalid or expired authentication token. Please log in again.', 401);
    }

    if (process.env.ENFORCE_AUTH === 'true' || req.headers['x-enforce-auth']) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    return next();
  };
}
