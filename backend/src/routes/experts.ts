import express from 'express';
import { getDb } from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { convertFields } from '../utils/fieldConverter';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { status, keyword } = req.query;

    let sql = 'SELECT * FROM experts WHERE 1=1';
    const params: string[] = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status as string);
    }

    sql += ' ORDER BY name';

    const experts = await db.all(sql, params);

    let result = experts.map((e) => convertFields.expert(e));

    if (keyword) {
      const kw = (keyword as string).toLowerCase();
      result = result.filter(
        (e: any) =>
          e.name?.toLowerCase().includes(kw) ||
          e.expertNo?.toLowerCase().includes(kw) ||
          e.organization?.toLowerCase().includes(kw) ||
          e.expertise?.some((ex: string) => ex.toLowerCase().includes(kw))
      );
    }

    res.json(result);
  } catch (error) {
    console.error('Get experts error:', error);
    res.status(500).json({ error: '获取专家列表失败' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const expert = await db.get('SELECT * FROM experts WHERE id = ?', [req.params.id]);

    if (!expert) {
      res.status(404).json({ error: '专家不存在' });
      return;
    }

    res.json(convertFields.expert(expert));
  } catch (error) {
    console.error('Get expert error:', error);
    res.status(500).json({ error: '获取专家详情失败' });
  }
});

export default router;
