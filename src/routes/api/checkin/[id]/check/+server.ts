import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const POST: RequestHandler = async ({ params, request }) => {
  const { studentId, status, note } = await request.json();
  const userId = request.headers.get('x-user-id') || '';
  
  try {
    const arrangement = await prisma.arrangement.findUnique({
      where: { id: params.id },
      include: {
        exam: { select: { id: true } },
        examRoom: { select: { id: true } }
      }
    });
    
    if (!arrangement) {
      return new Response(
        JSON.stringify({ error: '监考安排不存在' }),
        { status: 404 }
      );
    }
    
    const examSeat = await prisma.examSeat.findUnique({
      where: {
        examId_examRoomId_studentId: {
          examId: arrangement.exam.id,
          examRoomId: arrangement.examRoom.id,
          studentId
        }
      }
    });
    
    const seatNumber = examSeat?.seatNumber || '1';
    
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
        seatNumber,
        status,
        checkedAt: status !== 'PENDING' ? new Date() : null,
        checkedBy: userId,
        note
      },
      update: {
        status,
        seatNumber,
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
        newValue: JSON.stringify({ status, note, seatNumber })
      }
    });
    
    return new Response(
      JSON.stringify(record),
      { status: 200 }
    );
  } catch (error) {
    console.error('签到失败:', error);
    return new Response(
      JSON.stringify({ error: '签到失败' }),
      { status: 500 }
    );
  }
};
