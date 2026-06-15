import { validateUser } from '$server/db';

export async function POST(request: Request): Promise<Response> {
  const { username, password } = await request.json();
  
  const user = validateUser(username, password);
  
  if (user) {
    return new Response(JSON.stringify({
      success: true,
      user: { id: user.id, name: user.name, role: user.role, username: user.username }
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }
  
  return new Response(JSON.stringify({
    success: false,
    message: '用户名或密码错误'
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 401
  });
}
