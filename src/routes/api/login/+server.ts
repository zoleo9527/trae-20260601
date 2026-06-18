import { json, type RequestEvent } from '@sveltejs/kit';
import { getUserByUsername } from '$server/database';

export async function POST({ request }: RequestEvent) {
  const { username, password } = await request.json();
  
  const user = getUserByUsername(username);
  
  if (!user || user.password !== password) {
    return json({ success: false, message: '用户名或密码错误' });
  }
  
  return json({ 
    success: true, 
    user: { id: user.id, username: user.username, role: user.role } 
  });
}
