import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const arrangement = await prisma.arrangement.findUnique({
      where: { id: params.id },
      include: {
        exam: true,
        examRoom: true,
        invigilator: {
          select: {
            id: true,
            name: true,
            department: true,
            phone: true
          }
        }
      }
    });
    
    if (!arrangement) {
      return new Response(
        JSON.stringify({ error: '监考安排不存在' }),
        { status: 404 }
      );
    }
    
    return new Response(
      JSON.stringify(arrangement),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '获取监考安排失败' }),
      { status: 500 }
    );
  }
};