import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const POST: RequestHandler = async ({ params, request }) => {
  const { type, description, studentId } = await request.json();
  const userId = request.headers.get('x-user-id') || '';
  
  try {
    const anomaly = await prisma.anomaly.create({
      data: {
        type,
        description,
        arrangementId: params.id,
        reportedBy: userId,
        status: 'REPORTED',
        studentId: studentId || null
      }
    });
    
    const techSupport = await prisma.user.findFirst({
      where: { role: 'TECH_SUPPORT' }
    });
    
    if (techSupport) {
      await prisma.todoItem.create({
        data: {
          type: 'ANOMALY_HANDLE',
          title: `处理异常：${type}`,
          description,
          priority: type === 'ADMISSION_ERROR' ? 'HIGH' : 'MEDIUM',
          status: 'PENDING',
          assigneeId: techSupport.id,
          relatedId: anomaly.id
        }
      });
    }
    
    await prisma.operationLog.create({
      data: {
        userId,
        action: 'REPORT_ANOMALY',
        entityType: 'Anomaly',
        entityId: anomaly.id,
        newValue: JSON.stringify({ type, description, studentId })
      }
    });
    
    return new Response(
      JSON.stringify(anomaly),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '上报异常失败' }),
      { status: 500 }
    );
  }
};