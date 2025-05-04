// Middleware authentication
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware đảm bảo người dùng đã đăng nhập
 */
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
}

/**
 * Middleware đảm bảo người dùng là admin
 */
export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  // Kiểm tra cả hai điều kiện: đã đăng nhập và có quyền admin
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (!req.user || (req.user as any).role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden. Admin role required' });
  }
  
  return next();
}
