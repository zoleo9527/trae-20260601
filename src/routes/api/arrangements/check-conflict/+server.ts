import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const invigilatorId = url.searchParams.get('invigilatorId');
  const date = url.searchParams.get('date');
  const startTime = url.searchParams.get('startTime');
  const endTime = url.searchParams.get('endTime');
  
  if (!invigilatorId || !date || !startTime || !endTime) {
    return new Response(
      JSON.stringify({ error: '缺少必要参数' }),
      { status: 400 }
    );
  }
  
  try {
    const conflicts = await prisma.arrangement.findMany({
      where: {
        invigilatorId,
        date: new Date(date),
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          }
        ]
      },
      include: {
        exam: { select: { name: true } },
        examRoom: { select: { building: true, roomNumber: true } }
      }
    });
    
    return new Response(
      JSON.stringify({
        hasConflict: conflicts.length > 0,
        conflicts
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '检测冲突失败' }),
      { status: 500 }
    );
  }
};