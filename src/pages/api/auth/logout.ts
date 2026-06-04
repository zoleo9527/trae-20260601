import type { NextApiRequest, NextApiResponse } from 'next';
import { SESSION_COOKIE } from '@/lib/auth';
import { serialize } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookie = serialize(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  res.setHeader('Set-Cookie', cookie);
  res.status(200).json({ success: true });
}
