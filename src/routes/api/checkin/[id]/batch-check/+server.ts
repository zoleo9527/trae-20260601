import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const POST: RequestHandler = async ({ params, request }) => {
  const { students } = await request.json();
  const userId = request.headers.get('x-user-id') || '';
  
  try {
    const results = await Promise.all(
      students.map(async ({ studentId, status }) => {
        try {
          const record = await prisma.checkInRecord.upsert({
            where: {
              arrangementId_studentId: {
                arrangementId: params.id,
                studentId
              }
            },
            create: {
              arrangementId: params.id,
              studentId,
              seatNumber: '1',
              status,
              checkedAt: new Date(),
              checkedBy: userId
            },
            update: {
              status,
              checkedAt: new Date(),
              checkedBy: userId
            }
          });
          
          await prisma.operationLog.create({
            data: {
              userId,
              action: 'BATCH_CHECK_IN',
              entityType: 'CheckInRecord',
              entityId: record.id,
              newValue: JSON.stringify({ status })
            }
          });
          
          return { success: true, studentId };
        } catch (e) {
          return { success: false, studentId };
        }
      })
    );
    
    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return new Response(
      JSON.stringify({ success, failed }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '批量签到失败' }),
      { status: 500 }
    );
  }
};