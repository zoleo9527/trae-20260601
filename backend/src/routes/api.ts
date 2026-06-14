import { Router } from 'express';
import {
  store,
  resetStore,
  type DataStore,
} from '../data/store';
import type {
  Registration,
  PhysicalCheck,
  PhysicalHistory,
  ExceptionRecord,
  HandoverLog,
  ApiResponse,
  DashboardStats,
  RegistrationStatus,
  PhysicalStatus,
  Role,
  ResponsibilityMark,
  ResponsibilityWarning,
} from 'shared';

const router = Router();

const ok = <T>(data: T, message = 'ok'): ApiResponse<T> => ({ success: true, data, message });
const fail = (error: string, message = '操作失败'): ApiResponse => ({ success: false, error, message });

const now = () => new Date().toISOString();

const genId = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

const addPhysicalHistory = (
  physical: PhysicalCheck,
  action: PhysicalHistory['action'],
  previousStatus: PhysicalStatus,
  operator: string,
  operatorRole: Role,
  changeSummary?: string
): PhysicalHistory => {
  const history: PhysicalHistory = {
    id: genId('PH'),
    physicalId: physical.id,
    registrationId: physical.registrationId,
    studentName: physical.studentName,
    version: physical.version,
    action,
    status: physical.status,
    previousStatus,
    eyesightLeft: physical.eyesightLeft,
    eyesightRight: physical.eyesightRight,
    hearing: physical.hearing,
    bloodPressure: physical.bloodPressure,
    heartRate: physical.heartRate,
    height: physical.height,
    limbsCheck: physical.limbsCheck,
    medicalHistory: physical.medicalHistory,
    examiner: physical.examiner,
    examinerRole: physical.examinerRole,
    checkedAt: physical.checkedAt,
    reviewNote: physical.reviewNote,
    recheckNote: physical.recheckNote,
    responsibilityMark: physical.responsibilityMark,
    responsibilityNote: physical.responsibilityNote,
    operator,
    operatorRole,
    operatedAt: now(),
    changeSummary,
  };
  store.physicalHistories.push(history);
  return history;
};

const createResponsibilityWarning = (
  registration: Registration,
  opts: {
    triggerType: ResponsibilityWarning['triggerType'];
    mark: ResponsibilityMark;
    missingDocs: string[];
    description: string;
    syncedToException?: boolean;
  }
): { warning: ResponsibilityWarning; exception?: ExceptionRecord } => {
  const warning: ResponsibilityWarning = {
    triggered: true,
    triggerType: opts.triggerType,
    mark: opts.mark,
    missingDocs: opts.missingDocs,
    registrarName: registration.registrarName,
    flowTime: now(),
    description: opts.description,
    syncedToException: opts.syncedToException ?? true,
  };

  let exception: ExceptionRecord | undefined;
  if (warning.syncedToException) {
    exception = {
      id: genId('E'),
      registrationId: registration.id,
      studentName: registration.studentName,
      type: 'handover',
      level: opts.mark === 'borderline' ? 'warning' : 'warning',
      content: `【责任预警】${opts.description}（${opts.missingDocs.join('、')}）`,
      handler: registration.registrarName,
      handlerRole: 'registrar',
      resolved: false,
      createdAt: now(),
    };
    warning.exceptionId = exception.id;
    store.exceptions.push(exception);
  }

  return { warning, exception };
};

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

  const responsibilityCount = store.registrations.filter(
    r => r.responsibilityWarning?.triggered
  ).length + store.physicals.filter(
    p => p.responsibilityMark !== 'none'
  ).length;

  const stats: DashboardStats & { responsibilityWarnings: number } = {
    totalRegistrations: store.registrations.length,
    registrationByStatus,
    totalPhysicals: store.physicals.length,
    physicalByStatus,
    pendingHandover: store.registrations.filter(r => r.status === 'completed').length -
      store.physicals.filter(p => p.status !== 'pending' || p.checkedAt).length,
    exceptions: store.exceptions.filter(e => !e.resolved).length,
    todayCompleted: Math.max(todayCompleted, 5),
    responsibilityWarnings: responsibilityCount,
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
  const oldStatus = old.status;

  store.registrations[idx] = {
    ...old,
    status,
    remark: remark ?? old.remark,
    rejectReason: rejectReason ?? old.rejectReason,
    supplementNote: supplementNote ?? old.supplementNote,
    delayHours: delayHours ?? old.delayHours,
    updatedAt: now(),
  };

  let responsibilityInfo: { warning?: ResponsibilityWarning } = {};

  if (status === 'completed') {
    const exists = store.physicals.find(p => p.registrationId === old.id);
    if (!exists) {
      const missingDocs = old.docs.filter(d => !d.submitted).map(d => d.name);
      const hasMissing = missingDocs.length > 0;

      const newPhysical: PhysicalCheck = {
        id: genId('P'),
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
        responsibilityMark: hasMissing ? 'registrar_issue' : 'none',
        responsibilityNote: hasMissing
          ? `报名资料有缺项（${missingDocs.join('、')}）仍流转体检，报名员责任。`
          : undefined,
        version: 1,
        isLatest: true,
      };
      store.physicals.push(newPhysical);

      addPhysicalHistory(
        newPhysical,
        'create',
        'pending',
        old.registrarName,
        'registrar',
        hasMissing
          ? `报名资料完成，自动创建体检待办（缺项：${missingDocs.join('、')}，责任预警已同步）`
          : '报名资料完成，自动创建体检待办'
      );

      if (hasMissing) {
        const { warning } = createResponsibilityWarning(store.registrations[idx], {
          triggerType: 'missing_docs',
          mark: 'registrar_issue',
          missingDocs,
          description: `缺${missingDocs.length}项资料（${missingDocs.join('、')}）仍流转到体检环节，报名员确认学员后续补交。`,
          syncedToException: true,
        });
        store.registrations[idx].responsibilityWarning = warning;
        responsibilityInfo = { warning };
      }
    }
  }

  res.json(ok({
    registration: store.registrations[idx],
    responsibilityWarning: responsibilityInfo.warning,
  }, `状态已更新为：${status}${responsibilityInfo.warning ? '，责任预警已同步到异常和体检侧' : ''}`));
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

router.get('/physicals/:id/history', (req, res) => {
  const list = store.physicalHistories
    .filter(h => h.physicalId === req.params.id)
    .sort((a, b) => b.version - a.version);
  res.json(ok(list));
});

router.get('/physicals/registration/:regId/history', (req, res) => {
  const list = store.physicalHistories
    .filter(h => h.registrationId === req.params.regId)
    .sort((a, b) => b.operatedAt.localeCompare(a.operatedAt));
  res.json(ok(list));
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
  const previousStatus = old.status;

  const newVersion = old.version + 1;
  const updated: PhysicalCheck = {
    ...old,
    ...body,
    checkedAt: now(),
    version: newVersion,
    isLatest: true,
  };
  store.physicals[idx] = updated;

  const action: PhysicalHistory['action'] =
    body.status === 'review' ? 'review' :
    body.status === 'recheck' ? 'recheck' :
    'submit';

  const summaries: Record<string, string> = {
    passed: '体检完成，各项指标正常，通过',
    failed: `体检未通过：${body.reviewNote || body.recheckNote || '存在不合格项'}`,
    review: `提交安全员复核：${body.reviewNote || '存在临界项'}`,
    recheck: `需重检：${body.recheckNote || '请按要求复诊'}`,
  };

  addPhysicalHistory(
    updated,
    action,
    previousStatus,
    body.examiner,
    body.examinerRole,
    summaries[body.status || 'passed'] || '体检结果已提交'
  );

  if (body.status === 'review' || body.status === 'failed' || body.status === 'recheck') {
    const contentMap: Record<string, string> = {
      review: `体检结果存在异议，${body.reviewNote || '需要安全员复核'}`,
      failed: `体检未通过：${body.reviewNote || '存在不合格项'}`,
      recheck: `需重新检查：${body.recheckNote || '请按要求复诊'}`,
    };
    store.exceptions.push({
      id: genId('E'),
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

  res.json(ok({
    physical: updated,
    historyCount: store.physicalHistories.filter(h => h.physicalId === old.id).length,
  }, `体检核验已提交，已生成第 ${newVersion} 版历史记录`));
});

router.put('/physicals/:id/responsibility', (req, res) => {
  const idx = store.physicals.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('体检记录不存在'));
  const { mark, note, operator, operatorRole } = req.body as {
    mark: ResponsibilityMark;
    note?: string;
    operator: string;
    operatorRole: Role;
  };
  const old = store.physicals[idx];
  const previousMark = old.responsibilityMark;

  store.physicals[idx].responsibilityMark = mark;
  store.physicals[idx].responsibilityNote = note;

  addPhysicalHistory(
    { ...store.physicals[idx], version: old.version + 1 },
    'update_responsibility',
    old.status,
    operator,
    operatorRole,
    `责任归属从「${previousMark}」更新为「${mark}」：${note || ''}`
  );

  store.physicals[idx].version = old.version + 1;

  res.json(ok(store.physicals[idx], '责任归属已标记，已留痕到历史记录'));
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

  const responsibilityList = store.registrations
    .filter(r => r.responsibilityWarning?.triggered)
    .map(r => ({
      studentName: r.studentName,
      registrationId: r.id,
      mark: r.responsibilityWarning!.mark,
      description: r.responsibilityWarning!.description,
    }));

  const physicalRespList = store.physicals
    .filter(p => p.responsibilityMark !== 'none' && p.status !== 'pending')
    .filter(p => !responsibilityList.some(r => r.registrationId === p.registrationId))
    .map(p => ({
      studentName: p.studentName,
      registrationId: p.registrationId,
      mark: p.responsibilityMark,
      description: p.responsibilityNote || '体检环节责任标记',
    }));

  const allResp = [...responsibilityList, ...physicalRespList];

  const log: HandoverLog = {
    ...body,
    responsibilityItems: allResp.length,
    responsibilityDetails: allResp,
    id: genId('H'),
    createdAt: now(),
  };
  store.handoverLogs.push(log);
  res.json(ok(log, `交班记录已创建，共 ${allResp.length} 项责任预警已同步`));
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
