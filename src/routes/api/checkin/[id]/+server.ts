import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const arrangement = await prisma.arrangement.findUnique({
      where: { id: params.id },
      include: {
        exam: { select: { name: true, id: true } },
        examRoom: { select: { building: true, roomNumber: true, id: true } }
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
        examRoomId: arrangement.examRoom.id
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            admissionTicket: true,
            department: true,
            major: true
          }
        }
      },
      orderBy: { seatNumber: 'asc' }
    });
    
    const checkInRecords = await prisma.checkInRecord.findMany({
      where: { arrangementId: params.id },
      select: {
        studentId: true,
        status: true,
        checkedAt: true,
        note: true
      }
    });
    
    const recordMap = new Map(checkInRecords.map(r => [r.studentId, r]));
    
    const students = examSeats.map(seat => {
      const record = recordMap.get(seat.student.id);
      return {
        ...seat.student,
        seatNumber: seat.seatNumber,
        checkInStatus: record?.status || 'PENDING',
        checkedAt: record?.checkedAt,
        note: record?.note
      };
    });
    
    return new Response(
      JSON.stringify({ arrangement, students }),
      { status: 200 }
    );
  } catch (error) {
    console.error('获取签到详情失败:', error);
    return new Response(
      JSON.stringify({ error: '获取签到详情失败' }),
      { status: 500 }
    );
  }
};
