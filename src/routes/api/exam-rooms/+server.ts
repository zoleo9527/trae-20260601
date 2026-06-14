import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const status = url.searchParams.get('status');
  const building = url.searchParams.get('building');
  
  try {
    const examRooms = await prisma.examRoom.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(building ? { building } : {})
      },
      orderBy: [
        { building: 'asc' },
        { roomNumber: 'asc' }
      ]
    });
    
    return new Response(
      JSON.stringify({ examRooms }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '获取考场列表失败' }),
      { status: 500 }
    );
  }
};