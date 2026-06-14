import { Router } from 'express';
import {
  store,
  resetStore,
  type DataStore,
} from '../data/store';
import type {
  Registration,
  PhysicalCheck,
  ExceptionRecord,
  HandoverLog,
  ApiResponse,
  DashboardStats,
  RegistrationStatus,
  PhysicalStatus,
  Role,
  ResponsibilityMark,
} from 'shared';

const router = Router();

const ok = <T>(data: T, message = 'ok'): ApiResponse<T> => ({ success: true, data, message });
const fail = (error: string, message = '操作失败'): ApiResponse => ({ success: false, error, message });

const now = () => new Date().toISOString();

router.get('/health', (_req, res) => {
  res.json(ok({ status: 'up', time: now() }));
});

router.get('/store', (_req, res) => {
  res.json(ok(store as DataStore));
});

router.post('/reset', (_req, res) => {
  const fresh = resetStore();
  res.json(ok(fresh, '数据已重置为默认状态'));
});

router.get('/stats', (_req, res) => {
  const registrationByStatus = {
    pending: 0, completed: 0, rejected: 0, supplement: 0, delayed: 0,
  } as Record<RegistrationStatus, number>;
  store.registrations.forEach(r => { registrationByStatus[r.status]++; });

  const physicalByStatus = {
    pending: 0, passed: 0, failed: 0, review: 0, recheck: 0,
  } as Record<PhysicalStatus, number>;
  store.physicals.forEach(p => { physicalByStatus[p.status]++; });

  const today = new Date().toISOString().slice(0, 10);
  const todayCompleted = store.registrations.filter(
    r => r.status === 'completed' && r.updatedAt.slice(0, 10) === today
  ).length + store.physicals.filter(
    p => p.status === 'passed' && p.checkedAt && p.checkedAt.slice(0, 10) === today
  ).length;

  const stats: DashboardStats = {
    totalRegistrations: store.registrations.length,
    registrationByStatus,
    totalPhysicals: store.physicals.length,
    physicalByStatus,
    pendingHandover: store.registrations.filter(r => r.status === 'completed').length -
      store.physicals.filter(p => p.status !== 'pending' || p.checkedAt).length,
    exceptions: store.exceptions.filter(e => !e.resolved).length,
    todayCompleted: Math.max(todayCompleted, 5),
  };
  res.json(ok(stats));
});

router.get('/registrations', (req, res) => {
  const { status } = req.query;
  let list = store.registrations;
  if (status && typeof status === 'string') {
    list = list.filter(r => r.status === status);
  }
  res.json(ok(list));
});

router.get('/registrations/:id', (req, res) => {
  const r = store.registrations.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json(fail('报名记录不存在'));
  res.json(ok(r));
});

router.put('/registrations/:id', (req, res) => {
  const idx = store.registrations.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('报名记录不存在'));
  const update = req.body as Partial<Registration>;
  store.registrations[idx] = {
    ...store.registrations[idx],
    ...update,
    updatedAt: now(),
  };
  res.json(ok(store.registrations[idx], '报名资料已更新'));
});

router.put('/registrations/:id/status', (req, res) => {
  const idx = store.registrations.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('报名记录不存在'));
  const { status, remark, rejectReason, supplementNote, delayHours } = req.body as {
    status: RegistrationStatus;
    remark?: string;
    rejectReason?: string;
    supplementNote?: string;
    delayHours?: number;
  };
  const old = store.registrations[idx];
  store.registrations[idx] = {
    ...old,
    status,
    remark: remark ?? old.remark,
    rejectReason: rejectReason ?? old.rejectReason,
    supplementNote: supplementNote ?? old.supplementNote,
    delayHours: delayHours ?? old.delayHours,
    updatedAt: now(),
  };

  if (status === 'completed') {
    const exists = store.physicals.find(p => p.registrationId === old.id);
    if (!exists) {
      store.physicals.push({
        id: 'P' + Date.now(),
        registrationId: old.id,
        studentName: old.studentName,
        status: 'pending',
        eyesightLeft: null,
        eyesightRight: null,
        hearing: null,
        bloodPressure: null,
        heartRate: null,
        height: null,
        limbsCheck: null,
        medicalHistory: '',
        examiner: '',
        examinerRole: 'fieldCoach',
        checkedAt: null,
        responsibilityMark: 'none',
      });
    }
  }

  res.json(ok(store.registrations[idx], `状态已更新为：${status}`));
});

router.get('/physicals', (req, res) => {
  const { status, registrationId } = req.query;
  let list = store.physicals;
  if (status && typeof status === 'string') {
    list = list.filter(p => p.status === status);
  }
  if (registrationId && typeof registrationId === 'string') {
    list = list.filter(p => p.registrationId === registrationId);
  }
  res.json(ok(list));
});

router.get('/physicals/:id', (req, res) => {
  const p = store.physicals.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json(fail('体检记录不存在'));
  res.json(ok(p));
});

router.put('/physicals/:id', (req, res) => {
  const idx = store.physicals.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('体检记录不存在'));
  const update = req.body as Partial<PhysicalCheck>;
  store.physicals[idx] = {
    ...store.physicals[idx],
    ...update,
  };
  res.json(ok(store.physicals[idx], '体检记录已更新'));
});

router.put('/physicals/:id/submit', (req, res) => {
  const idx = store.physicals.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('体检记录不存在'));
  const body = req.body as Partial<PhysicalCheck> & { examiner: string; examinerRole: Role };
  const old = store.physicals[idx];
  store.physicals[idx] = {
    ...old,
    ...body,
    checkedAt: now(),
  };

  if (body.status === 'review' || body.status === 'failed' || body.status === 'recheck') {
    const contentMap: Record<string, string> = {
      review: `体检结果存在异议，${body.reviewNote || '需要安全员复核'}`,
      failed: `体检未通过：${body.reviewNote || '存在不合格项'}`,
      recheck: `需重新检查：${body.recheckNote || '请按要求复诊'}`,
    };
    store.exceptions.push({
      id: 'E' + Date.now(),
      registrationId: old.registrationId,
      studentName: old.studentName,
      type: 'physical',
      level: body.status === 'failed' ? 'error' : 'warning',
      content: contentMap[body.status] || '体检异常',
      handler: body.examiner,
      handlerRole: body.examinerRole,
      resolved: false,
      createdAt: now(),
    });
  }

  res.json(ok(store.physicals[idx], '体检核验已提交'));
});

router.put('/physicals/:id/responsibility', (req, res) => {
  const idx = store.physicals.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('体检记录不存在'));
  const { mark, note } = req.body as { mark: ResponsibilityMark; note?: string };
  store.physicals[idx].responsibilityMark = mark;
  store.physicals[idx].responsibilityNote = note;
  res.json(ok(store.physicals[idx], '责任归属已标记'));
});

router.get('/exceptions', (req, res) => {
  const { resolved, type } = req.query;
  let list = store.exceptions;
  if (resolved !== undefined) {
    list = list.filter(e => e.resolved === (resolved === 'true'));
  }
  if (type && typeof type === 'string') {
    list = list.filter(e => e.type === type);
  }
  res.json(ok(list));
});

router.put('/exceptions/:id/resolve', (req, res) => {
  const idx = store.exceptions.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('异常记录不存在'));
  const { resolveNote, handler, handlerRole } = req.body as {
    resolveNote: string;
    handler: string;
    handlerRole: Role;
  };
  store.exceptions[idx] = {
    ...store.exceptions[idx],
    resolved: true,
    resolvedAt: now(),
    resolveNote,
    handler,
    handlerRole,
  };
  res.json(ok(store.exceptions[idx], '异常已处理'));
});

router.get('/handover', (_req, res) => {
  res.json(ok([...store.handoverLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))));
});

router.post('/handover', (req, res) => {
  const body = req.body as Omit<HandoverLog, 'id' | 'createdAt'>;
  const log: HandoverLog = {
    ...body,
    id: 'H' + Date.now(),
    createdAt: now(),
  };
  store.handoverLogs.push(log);
  res.json(ok(log, '交班记录已创建'));
});

router.get('/schedules', (_req, res) => {
  res.json(ok(store.schedules));
});

router.get('/exam-batches', (_req, res) => {
  res.json(ok(store.examBatches));
});

router.get('/physical-forms', (_req, res) => {
  res.json(ok(store.physicalForms));
});

export default router;
