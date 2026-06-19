import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  return json({ user: locals.user });
};

export const POST: RequestHandler = async ({ cookies }) => {
  cookies.delete('user', { path: '/' });
  return json({ message: '已退出' });
};