import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const examId = url.searchParams.get('examId');
  const recordType = url.searchParams.get('type');
  const status = url.searchParams.get('status');
  
  try {
    let checkInRecords: any[] = [];
    let anomalies: any[] = [];
    
    if (!recordType || recordType === 'CHECK_IN') {
      checkInRecords = await prisma.checkInRecord.findMany({
        where: {
          ...(status ? { status } : {}),
          arrangement: examId ? { examId } : undefined
        },
        include: {
          arrangement: {
            include: {
              exam: { select: { name: true, id: true } },
              examRoom: { select: { building: true, roomNumber: true } },
              invigilator: { select: { name: true } }
            }
          },
          student: {
            select: {
              name: true,
              studentId: true,
              admissionTicket: true,
              department: true,
              id: true
            }
          },
          checker: {
            select: { name: true }
          }
        },
        orderBy: { checkedAt: 'desc' },
        take: 100
      });
      
      checkInRecords = checkInRecords.map(r => ({
        ...r,
        type: 'CHECK_IN' as const,
        studentId: r.student.id
      }));
    }
    
    if (!recordType || recordType === 'ANOMALY') {
      const anomalyWhere: any = {
        arrangement: examId ? { examId } : undefined
      };
      
      if (status && ['REPORTED', 'PROCESSED'].includes(status)) {
        anomalyWhere.status = status;
      }
      
      anomalies = await prisma.anomaly.findMany({
        where: anomalyWhere,
        include: {
          arrangement: {
            include: {
              exam: { select: { name: true, id: true } },
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
          },
          reporter: {
            select: { name: true }
          },
          processor: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      
      anomalies = anomalies.map(a => ({
        ...a,
        type: 'ANOMALY' as const,
        seatNumber: '-',
        anomalyType: a.type,
        status: a.status,
        checkedAt: null,
        note: a.description
      }));
    }
    
    const records = [...checkInRecords, ...anomalies].sort((a, b) => {
      const dateA = a.type === 'CHECK_IN' ? a.checkedAt : a.createdAt;
      const dateB = b.type === 'CHECK_IN' ? b.checkedAt : b.createdAt;
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });
    
    return new Response(
      JSON.stringify({ records }),
      { status: 200 }
    );
  } catch (error) {
    console.error('获取签到记录失败:', error);
    return new Response(
      JSON.stringify({ error: '获取签到记录失败' }),
      { status: 500 }
    );
  }
};
