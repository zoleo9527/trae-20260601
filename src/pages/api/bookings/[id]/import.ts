import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getUserFromSession, SESSION_COOKIE } from '@/lib/auth';


function generateImportNo() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `IM${dateStr}${random}`;
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
    const { id } = req.query;
    const { fileName, personnel } = req.body;

    try {
      const booking = await prisma.groupBooking.findUnique({
        where: { id: id as string },
      });

      if (!booking) {
        return res.status(404).json({ error: '预约不存在' });
      }

      const importRecord = await prisma.personnelImport.create({
        data: {
          importNo: generateImportNo(),
          bookingId: id as string,
          status: 'PROCESSING',
          fileName,
          totalCount: personnel.length,
          createdById: user.id,
        },
      });

      let successCount = 0;
      let failCount = 0;

      for (const p of personnel) {
        try {
          const name = p.姓名 || p.name;
          if (!name) {
            failCount++;
            continue;
          }

          await prisma.personnel.create({
            data: {
              bookingId: id as string,
              importId: importRecord.id,
              name,
              gender: p.性别 || p.gender || null,
              age: parseInt(p.年龄 || p.age) || null,
              idCard: p.身份证号 || p.idCard || null,
              phone: p.电话 || p.phone || null,
              department: p.部门 || p.department || null,
              position: p.职位 || p.position || null,
            },
          });
          successCount++;
        } catch (e) {
          failCount++;
        }
      }

      await prisma.personnelImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'COMPLETED',
          successCount,
          failCount,
        },
      });

      await prisma.groupBooking.update({
        where: { id: id as string },
        data: {
          actualCount: {
            increment: successCount,
          },
        },
      });

      await prisma.timeline.create({
        data: {
          bookingId: id as string,
          importId: importRecord.id,
          action: 'PERSONNEL_IMPORTED',
          description: `导入 ${successCount} 名体检人员，失败 ${failCount} 人`,
          createdById: user.id,
        },
      });

      res.status(200).json({ 
        success: true, 
        importId: importRecord.id,
        successCount,
        failCount,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '导入失败' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
