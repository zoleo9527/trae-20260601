import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const POST: RequestHandler = async ({ params, request }) => {
  const { status, note } = await request.json();
  const userId = request.headers.get('x-user-id') || '';
  
  try {
    const arrangement = await prisma.arrangement.update({
      where: { id: params.id },
      data: {
        status,
        confirmedAt: new Date(),
        confirmedBy: userId
      },
      include: {
        exam: true,
        invigilator: true
      }
    });
    
    await prisma.operationLog.create({
      data: {
        userId,
        action: status === 'CONFIRMED' ? 'CONFIRM_ARRANGEMENT' : 'REJECT_ARRANGEMENT',
        entityType: 'Arrangement',
        entityId: params.id,
        newValue: JSON.stringify({ status, note })
      }
    });
    
    if (status === 'CONFIRMED') {
      await prisma.todoItem.updateMany({
        where: {
          relatedId: params.id,
          type: 'ARRANGEMENT_CONFIRM'
        },
        data: { status: 'COMPLETED' }
      });
    }
    
    return new Response(
      JSON.stringify(arrangement),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '确认失败' }),
      { status: 500 }
    );
  }
};