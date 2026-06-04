import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getUserFromSession, SESSION_COOKIE } from '@/lib/auth';


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = req.cookies[SESSION_COOKIE];
  const user = await getUserFromSession(userId || '');

  if (!user) {
    return res.status(401).json({ error: '未登录' });
  }

  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: '无权限操作' });
  }

  if (req.method === 'POST') {
    const { id } = req.query;
    const { reason } = req.body;

    try {
      const booking = await prisma.groupBooking.findUnique({
        where: { id: id as string },
      });

      if (!booking) {
        return res.status(404).json({ error: '预约不存在' });
      }

      if (booking.status !== 'PENDING') {
        return res.status(400).json({ error: '只有待审核状态的预约可以驳回' });
      }

      await prisma.groupBooking.update({
        where: { id: id as string },
        data: {
          status: 'REJECTED',
          handledById: user.id,
          remark: booking.remark ? `${booking.remark}\n驳回原因：${reason}` : `驳回原因：${reason}`,
        },
      });

      await prisma.timeline.create({
        data: {
          bookingId: id as string,
          action: 'BOOKING_REJECTED',
          description: `驳回预约：${reason}`,
          createdById: user.id,
        },
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '操作失败' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
