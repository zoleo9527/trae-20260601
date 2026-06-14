import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const POST: RequestHandler = async ({ params, request }) => {
  const { studentId, status, note } = await request.json();
  const userId = request.headers.get('x-user-id') || '';
  
  try {
    const record = await prisma.checkInRecord.upsert({
      where: {
        arrangementId_studentId: {
          arrangementId: params.id,
          studentId
        }
      },
      create: {
        arrangementId: params.id,
        studentId,
        seatNumber: '1',
        status,
        checkedAt: status !== 'PENDING' ? new Date() : null,
        checkedBy: userId,
        note
      },
      update: {
        status,
        checkedAt: status !== 'PENDING' ? new Date() : null,
        checkedBy: userId,
        note
      }
    });
    
    await prisma.operationLog.create({
      data: {
        userId,
        action: 'CHECK_IN',
        entityType: 'CheckInRecord',
        entityId: record.id,
        newValue: JSON.stringify({ status, note })
      }
    });
    
    return new Response(
      JSON.stringify(record),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '签到失败' }),
      { status: 500 }
    );
  }
};