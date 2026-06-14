import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const role = url.searchParams.get('role');
  
  try {
    const users = await prisma.user.findMany({
      where: role ? { role } : {},
      select: {
        id: true,
        name: true,
        department: true,
        phone: true,
        role: true
      }
    });
    
    return new Response(
      JSON.stringify(users),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '获取用户列表失败' }),
      { status: 500 }
    );
  }
};