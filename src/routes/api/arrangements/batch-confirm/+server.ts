import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const { ids } = data;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return new Response(
      JSON.stringify({ error: '请选择要确认的监考安排' }),
      { status: 400 }
    );
  }
  
  try {
    const userStr = request.headers.get('x-user-id');
    if (!userStr) {
      return new Response(
        JSON.stringify({ error: '用户未登录' }),
        { status: 401 }
      );
    }
    
    const updatedArrangements = await Promise.all(
      ids.map(async (id: string) => {
        const arrangement = await prisma.arrangement.update({
          where: { id },
          data: {
            status: 'CONFIRMED',
            confirmedAt: new Date(),
            confirmedBy: userStr
          }
        });
        
        await prisma.operationLog.create({
          data: {
            userId: userStr,
            action: 'BATCH_CONFIRM_ARRANGEMENT',
            entityType: 'Arrangement',
            entityId: id,
            newValue: JSON.stringify({ status: 'CONFIRMED' })
          }
        });
        
        return arrangement;
      })
    );
    
    return new Response(
      JSON.stringify({
        success: updatedArrangements.length,
        arrangements: updatedArrangements
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '批量确认失败' }),
      { status: 500 }
    );
  }
};
