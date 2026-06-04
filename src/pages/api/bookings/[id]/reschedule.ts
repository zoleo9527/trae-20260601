import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getUserFromSession, SESSION_COOKIE } from '@/lib/auth';

import { format } from 'date-fns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = req.cookies[SESSION_COOKIE];
  const user = await getUserFromSession(userId || '');

  if (!user) {
    return res.status(401).json({ error: '未登录' });
  }

  if (req.method === 'POST') {
    const { id } = req.query;
    const { newDate } = req.body;

    try {
      const booking = await prisma.groupBooking.findUnique({
        where: { id: id as string },
      });

      if (!booking) {
        return res.status(404).json({ error: '预约不存在' });
      }

      if (!['PENDING', 'CONFIRMED', 'SUPPLEMENTED', 'RESCHEDULED'].includes(booking.status)) {
        return res.status(400).json({ error: '当前状态不支持改期' });
      }

      const oldDate = format(new Date(booking.scheduledDate), 'yyyy-MM-dd');
      const newDateStr = format(new Date(newDate), 'yyyy-MM-dd');

      await prisma.groupBooking.update({
        where: { id: id as string },
        data: {
          scheduledDate: new Date(newDate),
          status: 'RESCHEDULED',
          handledById: user.id,
        },
      });

      await prisma.timeline.create({
        data: {
          bookingId: id as string,
          action: 'BOOKING_RESCHEDULED',
          description: `预约改期`,
          oldValue: oldDate,
          newValue: newDateStr,
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
