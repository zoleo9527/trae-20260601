import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const status = url.searchParams.get('status');
  const date = url.searchParams.get('date');
  
  try {
    const arrangements = await prisma.arrangement.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(date ? { date: new Date(date) } : {})
      },
      include: {
        exam: {
          select: {
            name: true,
            date: true,
            startTime: true,
            endTime: true
          }
        },
        examRoom: {
          select: {
            building: true,
            roomNumber: true
          }
        },
        invigilator: {
          select: {
            name: true,
            department: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { startTime: 'asc' }
      ]
    });
    
    return new Response(
      JSON.stringify({ arrangements }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '获取监考安排失败' }),
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  
  try {
    const arrangement = await prisma.arrangement.create({
      data: {
        examId: data.examId,
        examRoomId: data.examRoomId,
        invigilatorId: data.invigilatorId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status || 'PENDING',
        createdBy: data.createdBy
      },
      include: {
        exam: true,
        examRoom: true,
        invigilator: true
      }
    });
    
    await prisma.operationLog.create({
      data: {
        userId: data.createdBy,
        action: 'CREATE_ARRANGEMENT',
        entityType: 'Arrangement',
        entityId: arrangement.id,
        newValue: JSON.stringify({
          examId: data.examId,
          examRoomId: data.examRoomId,
          invigilatorId: data.invigilatorId
        })
      }
    });
    
    await prisma.todoItem.create({
      data: {
        type: 'ARRANGEMENT_CONFIRM',
        title: '确认监考安排',
        description: `请确认 ${arrangement.exam.name} 的监考任务`,
        priority: 'HIGH',
        dueDate: new Date(new Date(data.date).getTime() - 2 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        assigneeId: data.invigilatorId,
        relatedId: arrangement.id
      }
    });
    
    return new Response(
      JSON.stringify(arrangement),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '创建监考安排失败' }),
      { status: 500 }
    );
  }
};