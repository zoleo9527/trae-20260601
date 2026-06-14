import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async () => {
  try {
    const arrangements = await prisma.arrangement.findMany({
      where: { status: 'CONFIRMED' },
      include: {
        invigilator: {
          select: { name: true, department: true }
        }
      }
    });
    
    const workloadMap = new Map<string, { invigilator: any; count: number; hours: number }>();
    
    arrangements.forEach(arr => {
      const key = arr.invigilatorId;
      if (!workloadMap.has(key)) {
        workloadMap.set(key, {
          invigilator: arr.invigilator,
          count: 0,
          hours: 0
        });
      }
      
      const item = workloadMap.get(key)!;
      item.count++;
      
      const start = parseInt(arr.startTime.split(':')[0]);
      const end = parseInt(arr.endTime.split(':')[0]);
      item.hours += end - start;
    });
    
    const workload = Array.from(workloadMap.values())
      .sort((a, b) => b.count - a.count);
    
    return new Response(
      JSON.stringify({ workload }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '获取工作量统计失败' }),
      { status: 500 }
    );
  }
};