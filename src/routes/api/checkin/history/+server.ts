import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const examId = url.searchParams.get('examId');
  const status = url.searchParams.get('status');
  
  try {
    const records = await prisma.checkInRecord.findMany({
      where: {
        ...(status ? { status } : {}),
        arrangement: examId ? { examId } : undefined
      },
      include: {
        arrangement: {
          include: {
            exam: { select: { name: true } },
            examRoom: { select: { building: true, roomNumber: true } }
          }
        },
        student: {
          select: {
            name: true,
            studentId: true,
            admissionTicket: true,
            department: true
          }
        }
      },
      orderBy: { checkedAt: 'desc' },
      take: 100
    });
    
    return new Response(
      JSON.stringify({ records }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '获取签到记录失败' }),
      { status: 500 }
    );
  }
};