import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/auth';

/**
 * 扩展 Express Request 接口，添加 user 属性
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * AuthRequest 类型
 * 用于需要认证的路由处理器
 */
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

/**
 * 认证中间件
 * 验证 JWT 令牌并将用户信息附加到 request 对象
 * 
 * 使用方法:
 * - 在需要认证的路由上使用: router.get('/protected', authMiddleware, handler)
 * - 在路由组上使用: router.use(authMiddleware)
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Debug: Log auth header (remove in production)
    console.log('[Auth Debug] Path:', req.path);
    console.log('[Auth Debug] Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    
    // 1. 从 Authorization header 中提取 token
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      console.log('[Auth Debug] No token extracted');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided. Please include Authorization header with Bearer token.',
      });
      return;
    }

    // 2. 验证 token
    const payload = verifyToken(token);
    console.log('[Auth Debug] Token verification result:', payload ? 'Success' : 'Failed');

    if (!payload) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token. Please login again.',
      });
      return;
    }

    // 3. 将用户信息附加到 request 对象
    req.user = payload;
    console.log('[Auth Debug] User attached:', payload.userId);

    // 4. 继续处理请求
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during authentication.',
    });
  }
}

/**
 * 可选认证中间件
 * 如果提供了有效的 token，则附加用户信息；否则继续处理请求
 *
 * 使用场景: 某些端点对登录用户和未登录用户都开放，但行为不同
 */
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        req.user = payload;
      }
    }

    // 无论是否有有效 token，都继续处理请求
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // 即使出错也继续处理请求
    next();
  }
}