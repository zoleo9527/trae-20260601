import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateUser } from '$db/users';
import type { User } from '$db/types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const body = await request.json();
  const { username, password } = body;
  
  const user = validateUser(username, password);
  
  if (!user) {
    return error(401, { message: '用户名或密码错误' });
  }
  
  const session = Buffer.from(`${user.id}|${user.username}|${user.role}`).toString('base64');
  cookies.set('user', session, { path: '/', httpOnly: true });
  
  return json({ user: { id: user.id, username: user.username, role: user.role } });
};