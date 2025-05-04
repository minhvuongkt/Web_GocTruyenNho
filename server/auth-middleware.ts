// Middleware authentication
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware đảm bảo người dùng đã đăng nhập
 */
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
}

/**
 * Middleware đảm bảo người dùng là admin
 */
export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && (req.user as any).role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Access forbidden. Admin role required' });
}