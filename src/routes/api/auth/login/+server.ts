import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ request }) => {
  const { username, password, role } = await request.json();
  
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: username },
          { phone: username }
        ]
      }
    });
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: '用户不存在' }),
        { status: 401 }
      );
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return new Response(
        JSON.stringify({ error: '密码错误' }),
        { status: 401 }
      );
    }
    
    const userWithRole = {
      id: user.id,
      name: user.name,
      role: role || user.role,
      department: user.department,
      phone: user.phone
    };
    
    return new Response(
      JSON.stringify({ user: userWithRole }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '登录失败' }),
      { status: 500 }
    );
  }
};