import { Router } from 'express';
import { singerScheduleService } from '../services/index.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const managerId = req.headers['x-manager-id'] as string;
    if (!managerId) {
      return res.status(401).json({ error: '缺少经理ID' });
    }

    const result = await singerScheduleService.createSchedule(req.body, managerId);
    res.status(201).json(result);
  } catch (error: any) {
    if (error.message.includes('冲突')) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Error creating singer schedule:', error);
    res.status(500).json({ error: '创建演出排班失败' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: '缺少日期参数' });
    }

    const { SingerScheduleRepository } = await import('../repositories/index.js');
    const repo = new SingerScheduleRepository();
    const schedules = repo.findByDate(date as string);
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching singer schedules:', error);
    res.status(500).json({ error: '获取演出排班失败' });
  }
});

router.post('/:id/reschedule', async (req, res) => {
  try {
    const managerId = req.headers['x-manager-id'] as string;
    if (!managerId) {
      return res.status(401).json({ error: '缺少经理ID' });
    }

    const { newDate, newStartTime, newEndTime, reason } = req.body;

    const result = await singerScheduleService.reschedule(
      req.params.id,
      newDate,
      newStartTime,
      newEndTime,
      managerId,
      reason
    );
    res.json(result);
  } catch (error: any) {
    if (error.message.includes('冲突')) {
      return res.status(409).json({ error: error.message });
    }
    if (error.message === '排班记录不存在') {
      return res.status(404).json({ error: '排班记录不存在' });
    }
    console.error('Error rescheduling singer:', error);
    res.status(500).json({ error: '演出改期失败' });
  }
});

router.get('/check-conflicts', async (req, res) => {
  try {
    const { date, startTime, endTime, excludeId } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const { SingerScheduleRepository } = await import('../repositories/index.js');
    const repo = new SingerScheduleRepository();
    const conflicts = repo.findConflicts(
      date as string,
      startTime as string,
      endTime as string,
      excludeId as string
    );

    res.json({
      hasConflict: conflicts.length > 0,
      conflicts,
      message: conflicts.length > 0 ? `检测到 ${conflicts.length} 条冲突` : '无冲突'
    });
  } catch (error) {
    console.error('Error checking singer conflicts:', error);
    res.status(500).json({ error: '检查冲突失败' });
  }
});

export default router;
