import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const JWT_EXPIRES_IN = '24h';

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new Error('用户名或密码错误');
  }

  if (user.status !== 'active') {
    throw new Error('账户已被禁用');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('用户名或密码错误');
  }

  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    } as JWTPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    user: {
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role,
    },
    token,
  };
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('无效的令牌');
  }
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
