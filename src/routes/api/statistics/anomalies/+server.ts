import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async () => {
  try {
    const anomalies = await prisma.anomaly.findMany();
    
    const typeMap = new Map<string, number>();
    
    anomalies.forEach(anomaly => {
      const count = typeMap.get(anomaly.type) || 0;
      typeMap.set(anomaly.type, count + 1);
    });
    
    const byType = Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    
    return new Response(
      JSON.stringify({
        total: anomalies.length,
        byType
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '获取异常统计失败' }),
      { status: 500 }
    );
  }
};