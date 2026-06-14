import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const POST: RequestHandler = async ({ params, request }) => {
  const { students } = await request.json();
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
    
    const missingStudents = students.filter(s => !seatMap.has(s.studentId));
    if (missingStudents.length > 0) {
      return new Response(
        JSON.stringify({
          error: '部分考生座位映射不存在',
          detail: `以下考生在考场 ${arrangement.examRoom.roomNumber} 中未找到座位安排：${missingStudents.map(s => s.studentId).join(', ')}`,
          missingStudents: missingStudents.map(s => s.studentId),
          suggestion: '请检查考生是否被正确分配到此考场'
        }),
        { status: 400 }
      );
    }
    
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
          
          return { success: true, studentId, seatNumber };
        } catch (e) {
          return { success: false, studentId, error: e.message };
        }
      })
    );
    
    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return new Response(
      JSON.stringify({ success, failed, results }),
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
