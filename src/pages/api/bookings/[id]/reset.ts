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

  if (req.method === 'POST') {
    const { id } = req.query;

    try {
      const booking = await prisma.groupBooking.findUnique({
        where: { id: id as string },
        include: {
          _count: {
            select: { personnel: true },
          },
        },
      });

      if (!booking) {
        return res.status(404).json({ error: '预约不存在' });
      }

      await prisma.$transaction([
        prisma.personnel.deleteMany({
          where: { bookingId: id as string },
        }),
        prisma.personnelImport.deleteMany({
          where: { bookingId: id as string },
        }),
        prisma.groupBooking.update({
          where: { id: id as string },
          data: {
            actualCount: 0,
          },
        }),
        prisma.timeline.create({
          data: {
            bookingId: id as string,
            action: 'DATA_RESET',
            description: `重置人员数据，清除 ${booking._count.personnel} 条记录`,
            createdById: user.id,
          },
        }),
      ]);

      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '重置失败' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
