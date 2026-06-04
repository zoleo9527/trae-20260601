import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getUserFromSession, SESSION_COOKIE } from '@/lib/auth';


function generateBookingNo() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TJ${dateStr}${random}`;
}

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
    try {
      const {
        companyName,
        contactPerson,
        contactPhone,
        scheduledDate,
        expectedCount,
        packageType,
        pricePerPerson,
        remark,
      } = req.body;

      const bookingNo = generateBookingNo();

      const booking = await prisma.groupBooking.create({
        data: {
          bookingNo,
          companyName,
          contactPerson,
          contactPhone,
          scheduledDate: new Date(scheduledDate),
          expectedCount: parseInt(expectedCount),
          packageType,
          pricePerPerson: parseFloat(pricePerPerson) || null,
          totalAmount: parseFloat(pricePerPerson) * parseInt(expectedCount) || null,
          remark,
          createdById: user.id,
        },
      });

      await prisma.timeline.create({
        data: {
          bookingId: booking.id,
          action: 'BOOKING_CREATED',
          description: `创建团检预约`,
          createdById: user.id,
        },
      });

      await prisma.timeline.create({
        data: {
          bookingId: booking.id,
          action: 'BOOKING_SUBMITTED',
          description: `提交审核，等待确认`,
          createdById: user.id,
        },
      });

      await prisma.groupBooking.update({
        where: { id: booking.id },
        data: { status: 'PENDING' },
      });

      res.status(201).json({ id: booking.id, bookingNo });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '创建失败' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
