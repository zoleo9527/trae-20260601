import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async () => {
  try {
    const pendingArrangements = await prisma.arrangement.findMany({
      where: { status: 'PENDING' },
      include: {
        exam: true,
        invigilator: true
      }
    });
    
    const anomalies = await prisma.anomaly.findMany({
      where: { status: 'PENDING' },
      include: {
        arrangement: {
          include: { exam: true }
        }
      }
    });
    
    const risks: any[] = [];
    
    pendingArrangements.forEach(arr => {
      const daysUntilExam = Math.ceil(
        (new Date(arr.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilExam <= 3 && daysUntilExam > 0) {
        risks.push({
          type: '监考安排待确认',
          description: `${arr.exam.name} - ${arr.invigilator.name} 的监考任务尚未确认，距离考试仅剩 ${daysUntilExam} 天`,
          severity: daysUntilExam === 1 ? 'HIGH' : 'MEDIUM',
          relatedData: { arrangementId: arr.id }
        });
      }
    });
    
    anomalies.forEach(anomaly => {
      risks.push({
        type: '异常待处理',
        description: `${anomaly.arrangement.exam.name} - ${anomaly.type}: ${anomaly.description}`,
        severity: anomaly.type === 'ADMISSION_ERROR' ? 'HIGH' : 'MEDIUM',
        relatedData: { anomalyId: anomaly.id }
      });
    });
    
    return new Response(
      JSON.stringify({ risks }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '获取风险预警失败' }),
      { status: 500 }
    );
  }
};