import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const examId = url.searchParams.get('examId');
  
  try {
    const records = await prisma.checkInRecord.findMany({
      where: {
        arrangement: examId ? { examId } : undefined
      }
    });
    
    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const absentRate = total > 0 ? (absent / total) * 100 : 0;
    
    return new Response(
      JSON.stringify({
        total,
        present,
        absent,
        late,
        absentRate
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '获取缺考统计失败' }),
      { status: 500 }
    );
  }
};