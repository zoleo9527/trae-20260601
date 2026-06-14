import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const arrangement = await prisma.arrangement.findUnique({
      where: { id: params.id },
      include: {
        exam: { select: { name: true } },
        examRoom: { select: { building: true, roomNumber: true } }
      }
    });
    
    if (!arrangement) {
      return new Response(
        JSON.stringify({ error: '监考安排不存在' }),
        { status: 404 }
      );
    }
    
    const checkInRecords = await prisma.checkInRecord.findMany({
      where: { arrangementId: params.id },
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
      }
    });
    
    const students = checkInRecords.map(record => ({
      ...record.student,
      seatNumber: record.seatNumber,
      checkInStatus: record.status
    }));
    
    return new Response(
      JSON.stringify({ arrangement, students }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '获取签到详情失败' }),
      { status: 500 }
    );
  }
};