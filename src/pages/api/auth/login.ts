import type { NextApiRequest, NextApiResponse } from 'next';
import { login, SESSION_COOKIE } from '@/lib/auth';
import { serialize } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  const user = await login(username, password);

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const cookie = serialize(SESSION_COOKIE, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  res.setHeader('Set-Cookie', cookie);
  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  });
}
