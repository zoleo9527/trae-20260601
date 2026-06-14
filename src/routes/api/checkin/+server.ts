import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const invigilatorId = url.searchParams.get('invigilatorId');
  const status = url.searchParams.get('status');
  
  try {
    const tasks = await prisma.arrangement.findMany({
      where: {
        ...(invigilatorId ? { invigilatorId } : {}),
        ...(status ? { status } : {})
      },
      include: {
        exam: { select: { name: true, date: true } },
        examRoom: { select: { building: true, roomNumber: true } }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });
    
    return new Response(
      JSON.stringify({ tasks }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '获取签到任务失败' }),
      { status: 500 }
    );
  }
};