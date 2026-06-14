import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const POST: RequestHandler = async ({ params, request }) => {
  const { studentId, status, note } = await request.json();
  const userId = request.headers.get('x-user-id') || '';
  
  try {
    const arrangement = await prisma.arrangement.findUnique({
      where: { id: params.id },
      include: {
        exam: { select: { id: true, name: true } },
        examRoom: { select: { id: true, roomNumber: true } }
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
    
    if (!examSeat) {
      return new Response(
        JSON.stringify({
          error: '座位映射不存在',
          detail: `考生 ${studentId} 在考场 ${arrangement.examRoom.roomNumber} 中未找到座位安排`,
          suggestion: '请检查考生是否被正确分配到此考场'
        }),
        { status: 400 }
      );
    }
    
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
        seatNumber: examSeat.seatNumber,
        status,
        checkedAt: status !== 'PENDING' ? new Date() : null,
        checkedBy: userId,
        note
      },
      update: {
        status,
        seatNumber: examSeat.seatNumber,
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
        newValue: JSON.stringify({ status, note, seatNumber: examSeat.seatNumber })
      }
    });
    
    return new Response(
      JSON.stringify({
        ...record,
        examSeat: examSeat.seatNumber
      }),
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
