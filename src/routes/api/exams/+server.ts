import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async () => {
  try {
    const exams = await prisma.exam.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { date: 'asc' }
    });
    
    return new Response(
      JSON.stringify(exams),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '获取考试列表失败' }),
      { status: 500 }
    );
  }
};