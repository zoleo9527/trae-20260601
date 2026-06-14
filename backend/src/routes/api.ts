import { Router } from 'express';
import {
  store,
  resetStore,
  type DataStore,
  DEMO_ACCOUNTS,
  STAGE_FLOW,
} from '../data/store';
import type {
  CarSource,
  CarSourceStatus,
  InspectionReport,
  LoanApplication,
  LoanDoc,
  TransferOrder,
  StatusChangeLog,
  ApiResponse,
  DashboardStats,
  Role,
  TransferStage,
  UrgencyAction,
} from 'shared';

const formatMoney = (amount: number): string =>
  amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0 });

const router = Router();

const ok = <T>(data: T, message = 'ok'): ApiResponse<T> => ({ success: true, data, message });
const fail = (error: string, message = '操作失败'): ApiResponse => ({ success: false, error, message });

const now = () => new Date().toISOString();

const genId = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

const addStatusLog = (
  orderId: string,
  stage: TransferStage,
  action: StatusChangeLog['action'],
  operator: string,
  operatorRole: Role,
  remark?: string,
  fromStage?: TransferStage
): StatusChangeLog => {
  const log: StatusChangeLog = {
    id: genId('S'),
    orderId,
    stage,
    fromStage,
    action,
    operator,
    operatorRole,
    operatedAt: now(),
    remark,
  };
  store.statusLogs.push(log);
  return log;
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

router.get('/demo-accounts', (_req, res) => {
  res.json(ok(DEMO_ACCOUNTS));
});

router.get('/stats', (req, res) => {
  const { role } = req.query;
  const currentRole = (role as Role) || undefined;

  const ordersByStage: Record<TransferStage, number> = {
    purchase: 0,
    appraisal: 0,
    transfer: 0,
    loan_review: 0,
    loan_funding: 0,
    completed: 0,
  };
  store.orders.forEach(o => { ordersByStage[o.stage]++; });

  const carSourcesByStatus: Record<CarSourceStatus, number> = {
    pending: 0,
    normal: 0,
    accident_missed: 0,
    prep_over_budget: 0,
  };
  store.carSources.forEach(c => { carSourcesByStatus[c.status]++; });

  const myPending = currentRole
    ? store.orders.filter(o => o.currentHandlerRole === currentRole && o.stage !== 'completed').length
    : store.orders.filter(o => o.stage !== 'completed').length;

  const urgentOrders = store.orders.filter(o => o.urgencyAction === 'urge').length;
  const returnedOrders = store.orders.filter(o => o.urgencyAction === 'return').length;
  const supplementOrders = store.orders.filter(o => o.urgencyAction === 'supplement').length;

  const today = new Date().toISOString().slice(0, 10);
  const todayCompleted = store.orders.filter(
    o => (o.loanCompletedAt || o.transferCompletedAt || o.updatedAt).slice(0, 10) === today && o.stage === 'completed'
  ).length;

  const totalLoanAmount = store.loans
    .filter(l => l.status === 'approved' || l.fundedAt)
    .reduce((sum, l) => sum + l.loanAmount, 0);

  const stats: DashboardStats = {
    totalOrders: store.orders.length,
    ordersByStage,
    myPending,
    urgentOrders,
    returnedOrders,
    supplementOrders,
    todayCompleted: todayCompleted || 1,
    totalLoanAmount,
    carSourcesByStatus,
  };
  res.json(ok(stats));
});

router.get('/car-sources', (req, res) => {
  const { status } = req.query;
  let list = store.carSources;
  if (status && typeof status === 'string') {
    list = list.filter(c => c.status === status);
  }
  res.json(ok(list));
});

router.get('/car-sources/:id', (req, res) => {
  const c = store.carSources.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json(fail('车源不存在'));
  res.json(ok(c));
});

router.get('/inspections', (req, res) => {
  const { orderId, carSourceId } = req.query;
  let list = store.inspections;
  if (orderId && typeof orderId === 'string') {
    list = list.filter(i => i.orderId === orderId);
  }
  if (carSourceId && typeof carSourceId === 'string') {
    list = list.filter(i => i.carSourceId === carSourceId);
  }
  res.json(ok(list));
});

router.get('/inspections/:id', (req, res) => {
  const i = store.inspections.find(x => x.id === req.params.id);
  if (!i) return res.status(404).json(fail('检测报告不存在'));
  res.json(ok(i));
});

router.put('/inspections/:id/complete', (req, res) => {
  const idx = store.inspections.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('检测报告不存在'));

  const { resultSummary, operator, operatorRole, items } = req.body as {
    resultSummary?: string;
    operator: string;
    operatorRole: Role;
    items?: { id: string; result: 'normal' | 'abnormal' | 'n/a'; note?: string }[];
  };

  if (operatorRole !== 'appraiser') {
    return res.status(403).json(fail('仅评估师可完成复检'));
  }

  const old = store.inspections[idx];
  const updatedItems = items && items.length > 0
    ? old.items.map(existing => {
        const updated = items.find(i => i.id === existing.id);
        return updated ? { ...existing, result: updated.result, note: updated.note ?? existing.note } : existing;
      })
    : old.items;

  store.inspections[idx] = {
    ...old,
    status: 'passed',
    items: updatedItems,
    resultSummary: resultSummary || old.resultSummary,
    updatedAt: now(),
  };

  const orderIdx = store.orders.findIndex(o => o.id === old.orderId);
  if (orderIdx >= 0) {
    store.orders[orderIdx] = {
      ...store.orders[orderIdx],
      urgencyAction: 'none',
      urgencyBy: undefined,
      urgencyAt: undefined,
      urgencyNote: undefined,
      currentHandlerRole: STAGE_FLOW[store.orders[orderIdx].stage].role,
      currentHandler: DEMO_ACCOUNTS[STAGE_FLOW[store.orders[orderIdx].stage].role].user,
      updatedAt: now(),
    };
    addStatusLog(old.orderId, store.orders[orderIdx].stage, 'pass', operator, operatorRole, `复检完成：${resultSummary || old.resultSummary || '通过复检'}`);
  }

  res.json(ok(store.inspections[idx], '复检完成，订单已恢复正常流转'));
});

router.get('/loans', (req, res) => {
  const { orderId, status } = req.query;
  let list = store.loans;
  if (orderId && typeof orderId === 'string') {
    list = list.filter(l => l.orderId === orderId);
  }
  if (status && typeof status === 'string') {
    list = list.filter(l => l.status === status);
  }
  res.json(ok(list));
});

router.get('/loans/:id', (req, res) => {
  const l = store.loans.find(x => x.id === req.params.id);
  if (!l) return res.status(404).json(fail('贷款申请不存在'));
  res.json(ok(l));
});

router.put('/loans/:id/complete', (req, res) => {
  const idx = store.loans.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('贷款申请不存在'));

  const { operator, operatorRole, docIds, remark } = req.body as {
    operator: string;
    operatorRole: Role;
    docIds?: string[];
    remark?: string;
  };

  if (operatorRole !== 'financeSpecialist') {
    return res.status(403).json(fail('仅金融专员可完成贷款补件'));
  }

  const old = store.loans[idx];
  const updatedDocs = old.docs.map(d => {
    if (docIds && docIds.includes(d.id)) {
      return { ...d, submitted: true, placeholder: undefined };
    }
    return d;
  });

  const allSubmitted = updatedDocs.every(d => d.submitted);
  const newStatus: LoanApplication['status'] = allSubmitted ? 'pending' : old.status;

  store.loans[idx] = {
    ...old,
    status: newStatus,
    docs: updatedDocs,
    updatedAt: now(),
  };

  const orderIdx = store.orders.findIndex(o => o.id === old.orderId);
  if (orderIdx >= 0) {
    const orderStage = store.orders[orderIdx].stage;
    store.orders[orderIdx] = {
      ...store.orders[orderIdx],
      urgencyAction: allSubmitted ? 'none' : store.orders[orderIdx].urgencyAction,
      urgencyBy: allSubmitted ? undefined : store.orders[orderIdx].urgencyBy,
      urgencyAt: allSubmitted ? undefined : store.orders[orderIdx].urgencyAt,
      urgencyNote: allSubmitted ? undefined : store.orders[orderIdx].urgencyNote,
      currentHandlerRole: STAGE_FLOW[orderStage].role,
      currentHandler: DEMO_ACCOUNTS[STAGE_FLOW[orderStage].role].user,
      updatedAt: now(),
    };
    const submittedNames = docIds && docIds.length > 0
      ? updatedDocs.filter(d => docIds.includes(d.id)).map(d => d.name).join('、')
      : '相关资料';
    addStatusLog(old.orderId, orderStage, 'pass', operator, operatorRole, `贷款补件完成（${submittedNames}）${remark ? '：' + remark : ''}`);
  }

  res.json(ok(store.loans[idx], allSubmitted ? '贷款补件全部完成，订单已恢复正常流转' : '部分资料已补件完成'));
});

router.get('/orders', (req, res) => {
  const { stage, role, handlerRole, urgency } = req.query;
  let list = [...store.orders];

  if (stage && typeof stage === 'string') {
    list = list.filter(o => o.stage === stage);
  }
  if (handlerRole && typeof handlerRole === 'string') {
    list = list.filter(o => o.currentHandlerRole === handlerRole);
  }
  if (role && typeof role === 'string') {
    const r = role as Role;
    list = list.filter(o => {
      if (o.stage === 'completed') return true;
      if (r === 'purchaseManager') return o.stage === 'purchase' || o.stage === 'transfer';
      if (r === 'appraiser') return o.stage === 'appraisal';
      if (r === 'financeSpecialist') return o.stage === 'loan_review' || o.stage === 'loan_funding';
      return false;
    });
  }
  if (urgency && typeof urgency === 'string') {
    list = list.filter(o => o.urgencyAction === urgency);
  }

  list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  res.json(ok(list));
});

const canAccessOrder = (o: TransferOrder, role?: Role): boolean => {
  if (!role) return true;
  if (o.stage === 'completed') return true;
  if (role === 'purchaseManager') return o.stage === 'purchase' || o.stage === 'transfer';
  if (role === 'appraiser') return o.stage === 'appraisal';
  if (role === 'financeSpecialist') return o.stage === 'loan_review' || o.stage === 'loan_funding';
  return false;
};

router.get('/orders/:id', (req, res) => {
  const o = store.orders.find(x => x.id === req.params.id);
  if (!o) return res.status(404).json(fail('订单不存在'));

  const { role } = req.query;
  const currentRole = role ? (role as Role) : undefined;
  if (!canAccessOrder(o, currentRole)) {
    return res.status(403).json(fail(`当前订单由${DEMO_ACCOUNTS[o.currentHandlerRole].name}处理，您无权查看详情`));
  }

  const inspection = store.inspections.find(i => i.orderId === o.id);
  const loan = store.loans.find(l => l.orderId === o.id);
  const carSource = store.carSources.find(c => c.id === o.carSourceId);
  const logs = store.statusLogs
    .filter(l => l.orderId === o.id)
    .sort((a, b) => a.operatedAt.localeCompare(b.operatedAt));

  res.json(ok({ order: o, inspection, loan, carSource, statusLogs: logs }));
});

router.get('/orders/:id/logs', (req, res) => {
  const logs = store.statusLogs
    .filter(l => l.orderId === req.params.id)
    .sort((a, b) => a.operatedAt.localeCompare(b.operatedAt));
  res.json(ok(logs));
});

router.put('/orders/:id/urgency', (req, res) => {
  const idx = store.orders.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('订单不存在'));

  const { action, note, operator, operatorRole, docIds } = req.body as {
    action: UrgencyAction;
    note?: string;
    operator: string;
    operatorRole: Role;
    docIds?: string[];
  };

  const old = store.orders[idx];

  if (action === 'return' && old.stage !== 'purchase') {
    const flow = STAGE_FLOW[old.stage];
    if (flow.prev) {
      store.orders[idx] = {
        ...old,
        stage: flow.prev,
        currentHandlerRole: STAGE_FLOW[flow.prev].role,
        currentHandler: DEMO_ACCOUNTS[STAGE_FLOW[flow.prev].role].user,
        urgencyAction: action,
        urgencyBy: operator,
        urgencyAt: now(),
        urgencyNote: note,
        updatedAt: now(),
      };
      addStatusLog(old.id, flow.prev, 'return', operator, operatorRole, note, old.stage);
      return res.json(ok(store.orders[idx], `已退回上一环节：${flow.prev}`));
    }
  }

  if (action === 'supplement') {
    if (old.stage === 'appraisal' || old.stage === 'transfer') {
      const inspIdx = store.inspections.findIndex(i => i.orderId === old.id);
      if (inspIdx >= 0) {
        store.inspections[inspIdx] = {
          ...store.inspections[inspIdx],
          status: 'recheck',
          resultSummary: note || store.inspections[inspIdx].resultSummary,
          updatedAt: now(),
        };
        addStatusLog(old.id, old.stage, 'supplement', operator, operatorRole, `检测报告标记复检：${note || '需复检确认'}`);
      }
    }
    if (old.stage === 'loan_review' || old.stage === 'loan_funding') {
      const loanIdx = store.loans.findIndex(l => l.orderId === old.id);
      if (loanIdx >= 0) {
        const updatedDocs = store.loans[loanIdx].docs.map(d => {
          if (docIds && docIds.includes(d.id)) {
            return { ...d, submitted: false, placeholder: note || '需补材料' };
          }
          return d;
        });
        store.loans[loanIdx] = {
          ...store.loans[loanIdx],
          status: 'supplement',
          docs: updatedDocs,
          updatedAt: now(),
        };
        const docNames = docIds && docIds.length > 0
          ? store.loans[loanIdx].docs.filter(d => docIds.includes(d.id)).map(d => d.name).join('、')
          : '相关资料';
        addStatusLog(old.id, old.stage, 'supplement', operator, operatorRole, `贷款资料补件（${docNames}）：${note || '需补充材料'}`);
      }
    }
  }

  store.orders[idx] = {
    ...old,
    urgencyAction: action,
    urgencyBy: operator,
    urgencyAt: now(),
    urgencyNote: note,
    updatedAt: now(),
  };

  const logAction: StatusChangeLog['action'] =
    action === 'urge' ? 'urge' :
    action === 'supplement' ? 'supplement' :
    action === 'return' ? 'return' : 'submit';

  if (action !== 'supplement') {
    addStatusLog(old.id, old.stage, logAction, operator, operatorRole, note);
  }

  const actionLabel = action === 'urge' ? '催办' : action === 'return' ? '退回' : action === 'supplement' ? '补材料' : '标记';
  res.json(ok(store.orders[idx], `已${actionLabel}${note ? '：' + note : ''}`));
});

router.put('/orders/:id/advance', (req, res) => {
  const idx = store.orders.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('订单不存在'));

  const { transferRemark, operator, operatorRole } = req.body as {
    transferRemark?: string;
    operator: string;
    operatorRole: Role;
  };

  const old = store.orders[idx];
  const flow = STAGE_FLOW[old.stage];

  if (!flow.next) {
    return res.status(400).json(fail('当前已是最终环节，无法继续推进'));
  }

  if (old.stage === 'loan_funding') {
    return res.status(400).json(fail('贷款放款阶段需通过"确认放款"操作完成，不可直接推进'));
  }

  if (old.urgencyAction === 'supplement') {
    return res.status(400).json(fail('当前订单标记为"补材料"，需完成补件并清除补材料状态后才能推进'));
  }

  if (old.currentHandlerRole !== operatorRole) {
    return res.status(403).json(fail(`当前环节由${DEMO_ACCOUNTS[old.currentHandlerRole].name}处理，您无权推进`));
  }

  const nextStage = flow.next;
  const nextRole = STAGE_FLOW[nextStage].role;

  let update: Partial<TransferOrder> = {
    stage: nextStage,
    currentHandlerRole: nextRole,
    currentHandler: DEMO_ACCOUNTS[nextRole].user,
    urgencyAction: 'none',
    urgencyBy: undefined,
    urgencyAt: undefined,
    urgencyNote: undefined,
    updatedAt: now(),
  };

  if (transferRemark && nextStage === 'loan_review') {
    update.transferRemark = transferRemark;
  }
  if (old.stage === 'transfer') {
    update.transferCompletedAt = now();
  }

  store.orders[idx] = { ...old, ...update };

  if (nextStage === 'loan_review') {
    const existingLoan = store.loans.find(l => l.orderId === old.id);
    if (!existingLoan) {
      const defaultDocs: LoanDoc[] = [
        { id: 'L1', name: '身份证', submitted: true },
        { id: 'L2', name: '收入证明', submitted: false, placeholder: '待客户提供' },
        { id: 'L3', name: '银行流水', submitted: false, placeholder: '待客户提供近6个月' },
        { id: 'L4', name: '征信报告', submitted: false, placeholder: '待客户授权查询' },
        { id: 'L5', name: '购车合同', submitted: true },
      ];
      const loanAmount = Math.round(old.dealPrice * 0.6);
      const newLoan: LoanApplication = {
        id: genId('L'),
        orderId: old.id,
        carSourceId: old.carSourceId,
        plateNumber: old.plateNumber,
        buyerName: old.buyerName,
        buyerPhone: old.buyerPhone,
        loanAmount,
        loanTerm: 36,
        status: 'pending',
        financeSpecialist: DEMO_ACCOUNTS.financeSpecialist.user,
        docs: defaultDocs,
        appliedAt: now(),
        approvedAt: null,
        fundedAt: null,
        createdAt: now(),
        updatedAt: now(),
      };
      store.loans.push(newLoan);
      addStatusLog(old.id, nextStage, 'submit', DEMO_ACCOUNTS.financeSpecialist.user, 'financeSpecialist', `系统自动创建贷款申请，金额${formatMoney(loanAmount)}，36期`);
    } else {
      store.loans = store.loans.map(l =>
        l.orderId === old.id
          ? { ...l, status: 'pending', updatedAt: now() }
          : l
      );
    }
  }

  if (nextStage === 'loan_funding') {
    store.loans = store.loans.map(l =>
      l.orderId === old.id
        ? { ...l, status: 'approved', approvedAt: now(), updatedAt: now() }
        : l
    );
  }

  addStatusLog(old.id, nextStage, 'pass', operator, operatorRole, transferRemark, old.stage);

  const stageLabelMap: Record<TransferStage, string> = {
    purchase: '收车建档',
    appraisal: '检测评估',
    transfer: '成交过户',
    loan_review: '贷款审核',
    loan_funding: '贷款放款',
    completed: '交易完成',
  };

  res.json(ok(store.orders[idx], `已推进到下一环节：${stageLabelMap[nextStage]}`));
});

router.put('/orders/:id/transfer-remark', (req, res) => {
  const idx = store.orders.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('订单不存在'));

  const { remark, operator, operatorRole } = req.body as {
    remark: string;
    operator: string;
    operatorRole: Role;
  };

  store.orders[idx] = {
    ...store.orders[idx],
    transferRemark: remark,
    updatedAt: now(),
  };

  addStatusLog(req.params.id, store.orders[idx].stage, 'submit', operator, operatorRole, `更新成交过户备注：${remark.slice(0, 50)}`);
  res.json(ok(store.orders[idx], '成交过户备注已更新，贷款放款环节可查看'));
});

router.put('/orders/:id/loan-remark', (req, res) => {
  const idx = store.orders.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('订单不存在'));

  const { remark, operator, operatorRole } = req.body as {
    remark: string;
    operator: string;
    operatorRole: Role;
  };

  store.orders[idx] = {
    ...store.orders[idx],
    loanRemark: remark,
    updatedAt: now(),
  };

  addStatusLog(req.params.id, store.orders[idx].stage, 'submit', operator, operatorRole, `更新贷款放款备注：${remark.slice(0, 50)}`);
  res.json(ok(store.orders[idx], '贷款放款备注已更新'));
});

router.put('/loans/:id/fund', (req, res) => {
  const idx = store.loans.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('贷款申请不存在'));

  const { operator, operatorRole } = req.body as {
    operator: string;
    operatorRole: Role;
  };

  store.loans[idx] = {
    ...store.loans[idx],
    status: 'approved',
    fundedAt: now(),
    updatedAt: now(),
  };

  const orderIdx = store.orders.findIndex(o => o.id === store.loans[idx].orderId);
  if (orderIdx >= 0) {
    store.orders[orderIdx] = {
      ...store.orders[orderIdx],
      stage: 'completed',
      currentHandlerRole: 'financeSpecialist',
      currentHandler: DEMO_ACCOUNTS.financeSpecialist.user,
      urgencyAction: 'none',
      urgencyBy: undefined,
      urgencyAt: undefined,
      urgencyNote: undefined,
      loanCompletedAt: now(),
      updatedAt: now(),
    };
    addStatusLog(store.loans[idx].orderId, 'completed', 'fund', operator, operatorRole, '贷款已放款，交易完成', 'loan_funding');
  }

  res.json(ok({ loan: store.loans[idx], order: orderIdx >= 0 ? store.orders[orderIdx] : undefined }, '贷款已放款，交易完成'));
});

router.put('/loans/:id/supplement', (req, res) => {
  const idx = store.loans.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('贷款申请不存在'));

  const { note, operator, operatorRole, docs } = req.body as {
    note: string;
    operator: string;
    operatorRole: Role;
    docs?: { id: string; name?: string; submitted: boolean; placeholder?: string }[];
  };

  let mergedDocs = store.loans[idx].docs;
  if (docs && docs.length > 0) {
    mergedDocs = store.loans[idx].docs.map(existing => {
      const updated = docs.find(d => d.id === existing.id);
      if (updated) {
        return {
          ...existing,
          submitted: updated.submitted,
          placeholder: updated.placeholder ?? existing.placeholder,
        };
      }
      return existing;
    });
  }

  store.loans[idx] = {
    ...store.loans[idx],
    status: 'supplement',
    updatedAt: now(),
    docs: mergedDocs,
  };

  const orderIdx = store.orders.findIndex(o => o.id === store.loans[idx].orderId);
  if (orderIdx >= 0) {
    store.orders[orderIdx] = {
      ...store.orders[orderIdx],
      urgencyAction: 'supplement',
      urgencyBy: operator,
      urgencyAt: now(),
      urgencyNote: note,
      updatedAt: now(),
    };
    addStatusLog(store.loans[idx].orderId, store.orders[orderIdx].stage, 'supplement', operator, operatorRole, note);
  }

  res.json(ok(store.loans[idx], `已标记补材料：${note}`));
});

router.put('/inspections/:id/recheck', (req, res) => {
  const idx = store.inspections.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json(fail('检测报告不存在'));

  const { note, operator, operatorRole } = req.body as {
    note: string;
    operator: string;
    operatorRole: Role;
  };

  store.inspections[idx] = {
    ...store.inspections[idx],
    status: 'recheck',
    resultSummary: note,
    updatedAt: now(),
  };

  const orderIdx = store.orders.findIndex(o => o.id === store.inspections[idx].orderId);
  if (orderIdx >= 0) {
    store.orders[orderIdx] = {
      ...store.orders[orderIdx],
      urgencyAction: 'supplement',
      urgencyBy: operator,
      urgencyAt: now(),
      urgencyNote: note,
      updatedAt: now(),
    };
    addStatusLog(store.inspections[idx].orderId, store.orders[orderIdx].stage, 'supplement', operator, operatorRole, `检测需复检：${note}`);
  }

  res.json(ok(store.inspections[idx], `已标记需复检：${note}`));
});

router.get('/status-logs', (req, res) => {
  const { orderId, role } = req.query;
  let list = [...store.statusLogs];

  if (orderId && typeof orderId === 'string') {
    list = list.filter(l => l.orderId === orderId);
  }
  if (role && typeof role === 'string') {
    list = list.filter(l => l.operatorRole === role);
  }

  list.sort((a, b) => b.operatedAt.localeCompare(a.operatedAt));
  res.json(ok(list.slice(0, 50)));
});

export default router;
