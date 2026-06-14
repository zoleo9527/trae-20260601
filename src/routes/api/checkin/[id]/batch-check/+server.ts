import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const POST: RequestHandler = async ({ params, request }) => {
  const { students } = await request.json();
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
    
    const examSeats = await prisma.examSeat.findMany({
      where: {
        examId: arrangement.exam.id,
        examRoomId: arrangement.examRoom.id,
        studentId: { in: students.map(s => s.studentId) }
      },
      select: {
        studentId: true,
        seatNumber: true
      }
    });
    
    const seatMap = new Map(examSeats.map(s => [s.studentId, s.seatNumber]));
    
    const results = await Promise.all(
      students.map(async ({ studentId, status }) => {
        try {
          const seatNumber = seatMap.get(studentId) || '1';
          
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
              checkedAt: new Date(),
              checkedBy: userId
            },
            update: {
              status,
              seatNumber,
              checkedAt: new Date(),
              checkedBy: userId
            }
          });
          
          await prisma.operationLog.create({
            data: {
              userId,
              action: 'BATCH_CHECK_IN',
              entityType: 'CheckInRecord',
              entityId: record.id,
              newValue: JSON.stringify({ status, seatNumber })
            }
          });
          
          return { success: true, studentId };
        } catch (e) {
          return { success: false, studentId };
        }
      })
    );
    
    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return new Response(
      JSON.stringify({ success, failed }),
      { status: 200 }
    );
  } catch (error) {
    console.error('批量签到失败:', error);
    return new Response(
      JSON.stringify({ error: '批量签到失败' }),
      { status: 500 }
    );
  }
};
