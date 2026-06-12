import express from 'express';
import { getDb } from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ExceptionType, exceptionTypeNames, ExceptionSeverity, ExceptionStatus } from '../types';
import { createException, handleException, rejectException } from '../utils/exceptionHandler';
import { logOperation } from '../utils/operationLogger';
import { convertToCamelCase, convertFields } from '../utils/fieldConverter';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { projectId, status, severity, type, page, pageSize } = req.query;

    let sql = 'SELECT * FROM exception_records WHERE 1=1';
    const params: string[] = [];

    if (projectId) {
      sql += ' AND project_id = ?';
      params.push(projectId as string);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status as string);
    }
    if (severity) {
      sql += ' AND severity = ?';
      params.push(severity as string);
    }
    if (type) {
      sql += ' AND type = ?';
      params.push(type as string);
    }

    sql += ' ORDER BY triggered_at DESC';

    const exceptions = await db.all(sql, params);

    let result = exceptions.map((ex) => {
      const exObj = convertFields.exception(ex);
      return {
        ...exObj,
        typeName: exceptionTypeNames[exObj.type as ExceptionType],
        severityName:
          exObj.severity === 'critical'
            ? '严重'
            : exObj.severity === 'high'
            ? '高'
            : exObj.severity === 'medium'
            ? '中'
            : '低',
        statusName:
          exObj.status === 'open'
            ? '待处理'
            : exObj.status === 'processing'
            ? '处理中'
            : exObj.status === 'resolved'
            ? '已解决'
            : '已关闭',
      };
    });

    const total = result.length;
    const p = page ? parseInt(page as string, 10) : 1;
    const ps = pageSize ? parseInt(pageSize as string, 10) : 10;
    const start = (p - 1) * ps;
    const paginated = result.slice(start, start + ps);

    res.json({ items: paginated, total });
  } catch (error) {
    console.error('Get exceptions error:', error);
    res.status(500).json({ error: '获取异常列表失败' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const exception = await db.get('SELECT * FROM exception_records WHERE id = ?', [req.params.id]);

    if (!exception) {
      res.status(404).json({ error: '异常记录不存在' });
      return;
    }

    const exceptionObj = convertFields.exception(exception);
    const result = {
      ...exceptionObj,
      typeName: exceptionTypeNames[exceptionObj.type as ExceptionType],
      severityName:
        exceptionObj.severity === 'critical'
          ? '严重'
          : exceptionObj.severity === 'high'
          ? '高'
          : exceptionObj.severity === 'medium'
          ? '中'
          : '低',
      statusName:
        exceptionObj.status === 'open'
          ? '待处理'
          : exceptionObj.status === 'processing'
          ? '处理中'
          : exceptionObj.status === 'resolved'
          ? '已解决'
          : '已关闭',
    };

    res.json(result);
  } catch (error) {
    console.error('Get exception error:', error);
    res.status(500).json({ error: '获取异常详情失败' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { projectId, type, title, description, severity } = req.body;
    const user = req.user!;

    if (!projectId || !type || !title || !description) {
      res.status(400).json({ error: '必填字段不能为空' });
      return;
    }

    const db = await getDb();
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }

    const projectObj = convertFields.project(project);

    const exception = await createException(
      projectId,
      projectObj.projectNo,
      projectObj.name,
      type as ExceptionType,
      title,
      description,
      user.id,
      'manual',
      undefined,
      user.id,
      user.name,
      user.role
    );

    res.json({
      ...exception,
      typeName: exceptionTypeNames[type as ExceptionType],
      severityName:
        severity === 'critical'
          ? '严重'
          : severity === 'high'
          ? '高'
          : severity === 'medium'
          ? '中'
          : '低',
      statusName: '待处理',
    });
  } catch (error) {
    console.error('Create exception error:', error);
    res.status(500).json({ error: '创建异常记录失败' });
  }
});

router.post('/:id/handle', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { resolution } = req.body;
    const user = req.user!;

    if (!resolution) {
      res.status(400).json({ error: '请填写处理方案' });
      return;
    }

    const result = await handleException(
      req.params.id,
      user.id,
      user.name,
      user.role,
      resolution
    );

    if (!result) {
      res.status(404).json({ error: '异常记录不存在' });
      return;
    }

    res.json({
      ...result,
      typeName: exceptionTypeNames[result.type as ExceptionType],
      severityName:
        result.severity === 'critical'
          ? '严重'
          : result.severity === 'high'
          ? '高'
          : result.severity === 'medium'
          ? '中'
          : '低',
      statusName: '已解决',
    });
  } catch (error) {
    console.error('Handle exception error:', error);
    res.status(500).json({ error: '处理异常失败' });
  }
});

router.post('/:id/reject', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { rejectReason } = req.body;
    const user = req.user!;

    if (!rejectReason) {
      res.status(400).json({ error: '请填写退回原因' });
      return;
    }

    const result = await rejectException(
      req.params.id,
      user.id,
      user.name,
      user.role,
      rejectReason
    );

    if (!result) {
      res.status(404).json({ error: '异常记录不存在' });
      return;
    }

    res.json({
      ...result,
      typeName: exceptionTypeNames[result.type as ExceptionType],
      severityName:
        result.severity === 'critical'
          ? '严重'
          : result.severity === 'high'
          ? '高'
          : result.severity === 'medium'
          ? '中'
          : '低',
      statusName: '已关闭',
    });
  } catch (error) {
    console.error('Reject exception error:', error);
    res.status(500).json({ error: '退回异常失败' });
  }
});

router.post('/trigger-sample', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { projectId, exceptionType, sampleType } = req.body;
    const user = req.user!;
    const type = (exceptionType || sampleType) as ExceptionType;

    if (!projectId || !type) {
      res.status(400).json({ error: '请指定项目和异常类型' });
      return;
    }

    const db = await getDb();
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }

    const projectObj = convertFields.project(project);

    const sampleTitles: Record<ExceptionType, string> = {
      arrangement_timeout: '开评标安排审核超时',
      expert_absent: '专家缺席异常',
      expert_late: '专家迟到预警',
      signin_incomplete: '专家签到未完成',
      room_conflict: '会议室时间冲突',
      document_missing: '招标文件缺失',
      financial_issue: '财务确认异常',
      other: '其他异常情况',
    };

    const sampleDescriptions: Record<ExceptionType, string> = {
      arrangement_timeout: '开评标安排提交审核已超过24小时，评审秘书尚未处理。请及时审核，避免影响开标进度。',
      expert_absent: '在专家签到过程中，发现有专家未按时到场且无法联系。需要立即协调更换替补专家。',
      expert_late: '部分专家签到时间比预计时间晚30分钟以上，可能影响评标进度。',
      signin_incomplete: '开标时间已到，但仍有专家未完成签到。请尽快确认签到情况。',
      room_conflict: '预约的开标会议室与其他项目存在时间冲突。请立即协调调整。',
      document_missing: '检查发现缺少必要的招标文件或资质证明。请立即补充。',
      financial_issue: '投标押金未按时到账，或代理费用计算存在问题。请财务确认。',
      other: '系统检测到其他异常情况，请相关责任人及时处理。',
    };

    const exception = await createException(
      projectId,
      projectObj.projectNo,
      projectObj.name,
      type,
      sampleTitles[type] || '异常样例',
      sampleDescriptions[type] || '系统检测到异常情况，请相关责任人及时处理。',
      'system',
      'system',
      `异常样例触发 - ${type}`,
      user.id,
      user.name,
      user.role
    );

    await logOperation(
      'exception',
      exception.id,
      '触发异常样例',
      `手动触发异常样例：${sampleTitles[type] || type}`,
      user.id,
      user.name,
      user.role,
      undefined,
      'open'
    );

    res.json({
      message: '异常样例已成功触发',
      exception: {
        ...exception,
        typeName: exceptionTypeNames[type] || type,
        statusName: '待处理',
      },
    });
  } catch (error) {
    console.error('Trigger sample exception error:', error);
    res.status(500).json({ error: '触发异常样例失败' });
  }
});

export default router;
