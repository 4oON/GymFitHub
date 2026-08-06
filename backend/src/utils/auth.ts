import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * 认证工具函数
 * 提供密码哈希、验证和 JWT 令牌生成功能
 */

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 哈希密码
 * @param password - 明文密码
 * @returns Promise<string> - 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 * @param password - 明文密码
 * @param hashedPassword - 哈希后的密码
 * @returns Promise<boolean> - 密码是否匹配
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * JWT Payload 接口
 */
export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * 生成 JWT 令牌
 * @param payload - JWT 载荷（用户 ID 和邮箱）
 * @returns string - JWT 令牌
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * 验证 JWT 令牌
 * @param token - JWT 令牌
 * @returns JWTPayload | null - 解码后的载荷，如果无效则返回 null
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 从 Authorization header 中提取 token
 * @param authHeader - Authorization header 值
 * @returns string | null - 提取的 token，如果格式不正确则返回 null
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  // 期望格式: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}