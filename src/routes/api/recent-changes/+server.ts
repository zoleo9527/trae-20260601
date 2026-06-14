import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const hours = parseInt(url.searchParams.get('hours') || '24');
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  try {
    const changes = await prisma.operationLog.findMany({
      where: {
        createdAt: { gte: since }
      },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    return new Response(
      JSON.stringify({ changes }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '获取变更记录失败' }),
      { status: 500 }
    );
  }
};