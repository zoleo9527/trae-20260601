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

  const { id } = req.query;

  if (req.method === 'POST') {
    const { type, description } = req.body;

    if (!type || !description) {
      return res.status(400).json({ error: '异常类型和说明不能为空' });
    }

    try {
      const booking = await prisma.groupBooking.findUnique({
        where: { id: id as string },
      });

      if (!booking) {
        return res.status(404).json({ error: '预约不存在' });
      }

      const exception = await prisma.exceptionRecord.create({
        data: {
          bookingId: id as string,
          type,
          description,
          createdById: user.id,
        },
      });

      await prisma.timeline.create({
        data: {
          bookingId: id as string,
          action: 'EXCEPTION_ADDED',
          description: `添加异常说明：${type} - ${description}`,
          createdById: user.id,
        },
      });

      res.status(200).json({ success: true, exceptionId: exception.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '操作失败' });
    }
  } else if (req.method === 'PUT') {
    const { exceptionId } = req.body;

    if (!exceptionId) {
      return res.status(400).json({ error: '缺少异常记录ID' });
    }

    try {
      const exception = await prisma.exceptionRecord.findUnique({
        where: { id: exceptionId },
      });

      if (!exception) {
        return res.status(404).json({ error: '异常记录不存在' });
      }

      if (exception.isHandled) {
        return res.status(400).json({ error: '该异常已处理' });
      }

      await prisma.exceptionRecord.update({
        where: { id: exceptionId },
        data: {
          isHandled: true,
          handledById: user.id,
          handledAt: new Date(),
        },
      });

      await prisma.timeline.create({
        data: {
          bookingId: id as string,
          action: 'EXCEPTION_HANDLED',
          description: `处理异常：${exception.type} - ${exception.description}`,
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
