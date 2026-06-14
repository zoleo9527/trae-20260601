import { json } from '@sveltejs/kit';
import { authenticateUser } from '$lib/server/auth.js';

export async function POST({ request, cookies }) {
  try {
    const { username, password } = await request.json();
    
    const user = authenticateUser(username, password);
    
    if (!user) {
      return json({ success: false, message: '用户名或密码错误' }, { status: 401 });
    }

    cookies.set('session', user.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7
    });

    return json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    return json({ success: false, message: '登录失败' }, { status: 500 });
  }
}
