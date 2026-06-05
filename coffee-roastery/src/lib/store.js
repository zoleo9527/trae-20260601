import { writable, derived, get } from 'svelte/store';

export const ROLES = ['烘焙师', '杯测员', '渠道客服'];

export const STATUS_MAP = {
  pending: { label: '待处理', color: '#e74c3c', next: 'recovering' },
  recovering: { label: '回收中', color: '#f39c12', next: 'reviewing' },
  reviewing: { label: '复盘中', color: '#3498db', next: 'resolved' },
  resolved: { label: '已完成', color: '#27ae60', next: null }
};

export const ROLE_TODO_MAP = {
  '渠道客服': (c) => c.status === 'pending',
  '杯测员': (c) => c.status === 'recovering' || c.status === 'reviewing',
  '烘焙师': (c) => c.status === 'reviewing'
};

export const greenBeans = writable([
  { id: 'GB-001', name: '耶加雪菲 G1', origin: '埃塞俄比亚', batchNo: 'YT-2026-04', weight: 120, arrivalDate: '2026-01-10', stockDate: '2026-01-15', fifoAlert: false },
  { id: 'GB-002', name: '哥伦比亚 慧兰', origin: '哥伦比亚', batchNo: 'CO-2026-03', weight: 85, arrivalDate: '2026-02-20', stockDate: '2026-03-01', fifoAlert: false },
  { id: 'GB-003', name: '巴西 喜拉多', origin: '巴西', batchNo: 'BR-2025-11', weight: 200, arrivalDate: '2025-11-05', stockDate: '2025-11-20', fifoAlert: true },
  { id: 'GB-004', name: '肯尼亚 AA', origin: '肯尼亚', batchNo: 'KN-2025-09', weight: 60, arrivalDate: '2025-09-15', stockDate: '2025-10-01', fifoAlert: true },
  { id: 'GB-005', name: '危地马拉 安提瓜', origin: '危地马拉', batchNo: 'GT-2026-01', weight: 95, arrivalDate: '2026-03-10', stockDate: '2026-03-18', fifoAlert: false }
]);

export const roastCurves = writable([
  { id: 'RC-001', beanId: 'GB-001', name: '耶加雪菲 浅烘 v3', version: 3, date: '2026-04-12', alert: false },
  { id: 'RC-002', beanId: 'GB-001', name: '耶加雪菲 浅烘 v2', version: 2, date: '2026-03-08', alert: true },
  { id: 'RC-003', beanId: 'GB-002', name: '慧兰 中烘 v1', version: 1, date: '2026-04-05', alert: false },
  { id: 'RC-004', beanId: 'GB-003', name: '喜拉多 中深烘 v2', version: 2, date: '2026-01-20', alert: true },
  { id: 'RC-005', beanId: 'GB-003', name: '喜拉多 中深烘 v1', version: 1, date: '2025-12-10', alert: true },
  { id: 'RC-006', beanId: 'GB-004', name: '肯尼亚 中烘 v1', version: 1, date: '2025-11-25', alert: false }
]);

export const customerOrders = writable([
  { id: 'CO-001', customer: '巢畔咖啡', items: [{ beanId: 'GB-001', curveId: 'RC-001', qty: 20 }], date: '2026-04-18' },
  { id: 'CO-002', customer: '鹿岛市集', items: [{ beanId: 'GB-003', curveId: 'RC-004', qty: 50 }], date: '2026-04-20' },
  { id: 'CO-003', customer: '山雾茶屋', items: [{ beanId: 'GB-001', curveId: 'RC-002', qty: 15 }], date: '2026-05-01' },
  { id: 'CO-004', customer: '云岫咖啡', items: [{ beanId: 'GB-004', curveId: 'RC-006', qty: 10 }], date: '2026-05-10' }
]);

export const complaintRecords = writable([
  {
    id: 'CR-001',
    orderId: 'CO-001',
    beanId: 'GB-001',
    curveId: 'RC-001',
    customer: '巢畔咖啡',
    status: 'pending',
    complaintDate: '2026-05-20',
    customerFeedback: '这批耶加雪菲喝起来有明显的焦苦味，完全不是之前的花果香调，怀疑烘焙出问题。',
    returnReason: '',
    recoveryAction: '',
    flavorReview: null,
    supplementaryNotes: [
      { author: '李客服', role: '渠道客服', content: '客户电话反馈，情绪比较激动，说连续两包都有问题，要求退换货。', timestamp: '2026-05-20 09:30' },
      { author: '李客服', role: '渠道客服', content: '已确认客户寄回样品，快递单号 SF1234567890。', timestamp: '2026-05-20 14:15' }
    ],
    history: [
      { action: '客诉登记', by: '李客服', role: '渠道客服', timestamp: '2026-05-20 09:30' }
    ]
  },
  {
    id: 'CR-002',
    orderId: 'CO-002',
    beanId: 'GB-003',
    curveId: 'RC-004',
    customer: '鹿岛市集',
    status: 'recovering',
    complaintDate: '2026-05-15',
    customerFeedback: '巴西豆这批有土腥味和陈豆感，和之前的中深烘完全不同，顾客投诉率很高。',
    returnReason: '生豆存储时间过长，FIFO未执行到位，混入陈豆',
    recoveryAction: '已安排换货30kg，旧批次退回仓库隔离处理',
    flavorReview: null,
    supplementaryNotes: [
      { author: '王客服', role: '渠道客服', content: '鹿岛反馈已有5位终端顾客投诉，要求紧急处理。', timestamp: '2026-05-15 10:00' },
      { author: '王客服', role: '渠道客服', content: '换货已发出，物流预计3天到。', timestamp: '2026-05-16 16:30' },
      { author: '陈杯测', role: '杯测员', content: '退回样品已收到，明日安排杯测。', timestamp: '2026-05-18 09:00' }
    ],
    history: [
      { action: '客诉登记', by: '王客服', role: '渠道客服', timestamp: '2026-05-15 10:00' },
      { action: '开始回收处理', by: '王客服', role: '渠道客服', timestamp: '2026-05-16 16:30' },
      { action: '样品移交杯测', by: '陈杯测', role: '杯测员', timestamp: '2026-05-18 09:00' }
    ]
  },
  {
    id: 'CR-003',
    orderId: 'CO-003',
    beanId: 'GB-001',
    curveId: 'RC-002',
    customer: '山雾茶屋',
    status: 'reviewing',
    complaintDate: '2026-05-08',
    customerFeedback: '耶加雪菲风味偏平，酸度不足，花香消失，和曲线标注的风味不符。',
    returnReason: '使用了旧版曲线 v2 烘焙，而非当前标准 v3',
    recoveryAction: '已使用 v3 曲线补烘15kg寄出',
    flavorReview: {
      acidity: 5,
      sweetness: 6,
      body: 4,
      aftertaste: 3,
      notes: '杯测确认：v2曲线出品花香几乎消失，酸质扁平，与v3曲线风味差距显著。v3曲线花香明确、酸质明亮。问题根因是烘焙时误用旧版曲线。',
      reviewer: '陈杯测',
      date: '2026-05-12'
    },
    supplementaryNotes: [
      { author: '张客服', role: '渠道客服', content: '客户表示理解，但要求后续使用正确曲线。', timestamp: '2026-05-08 11:20' },
      { author: '陈杯测', role: '杯测员', content: 'v2和v3曲线对比杯测完成，已出报告。', timestamp: '2026-05-12 15:00' },
      { author: '陈杯测', role: '杯测员', content: '建议烘焙师核查曲线版本管理流程。', timestamp: '2026-05-12 15:05' },
      { author: '林烘焙', role: '烘焙师', content: '确认是生产时选错曲线模板，已加强操作检查。', timestamp: '2026-05-13 08:30' }
    ],
    history: [
      { action: '客诉登记', by: '张客服', role: '渠道客服', timestamp: '2026-05-08 11:20' },
      { action: '开始回收处理', by: '张客服', role: '渠道客服', timestamp: '2026-05-09 10:00' },
      { action: '补烘发货', by: '张客服', role: '渠道客服', timestamp: '2026-05-10 14:00' },
      { action: '风味复盘开始', by: '陈杯测', role: '杯测员', timestamp: '2026-05-11 09:00' },
      { action: '风味复盘完成', by: '陈杯测', role: '杯测员', timestamp: '2026-05-12 15:00' },
      { action: '烘焙师确认', by: '林烘焙', role: '烘焙师', timestamp: '2026-05-13 08:30' }
    ]
  },
  {
    id: 'CR-004',
    orderId: 'CO-004',
    beanId: 'GB-004',
    curveId: 'RC-006',
    customer: '云岫咖啡',
    status: 'resolved',
    complaintDate: '2026-04-28',
    customerFeedback: '肯尼亚AA这批有明显的发酵过度味道，莓果酸变成了醋酸感。',
    returnReason: '生豆存储条件不当导致轻微发酵，加上烘焙曲线未针对豆况调整',
    recoveryAction: '退回全部10kg，换用新批次生豆重烘后补发',
    flavorReview: {
      acidity: 2,
      sweetness: 3,
      body: 5,
      aftertaste: 2,
      notes: '杯测确认：醋酸感突出，莓果风味变质，系生豆轻微发酵所致。新批次生豆杯测正常，莓果酸甜平衡，烘焙曲线微调后出品符合预期。',
      reviewer: '陈杯测',
      date: '2026-05-02'
    },
    supplementaryNotes: [
      { author: '赵客服', role: '渠道客服', content: '客户第一时间拍照反馈豆表有异常色斑。', timestamp: '2026-04-28 10:00' },
      { author: '赵客服', role: '渠道客服', content: '退货已完成，补发预计5月5日到。', timestamp: '2026-04-30 16:00' },
      { author: '陈杯测', role: '杯测员', content: '退回豆确实有发酵味，已标记该批次生豆隔离。', timestamp: '2026-05-01 10:30' },
      { author: '陈杯测', role: '杯测员', content: '新批次杯测通过，建议补发。', timestamp: '2026-05-02 14:00' },
      { author: '林烘焙', role: '烘焙师', content: '已调整肯尼亚曲线参数，一爆后延长15s发展期。', timestamp: '2026-05-03 09:00' },
      { author: '赵客服', role: '渠道客服', content: '客户确认补发豆品质正常，客诉关闭。', timestamp: '2026-05-06 11:00' }
    ],
    history: [
      { action: '客诉登记', by: '赵客服', role: '渠道客服', timestamp: '2026-04-28 10:00' },
      { action: '开始回收处理', by: '赵客服', role: '渠道客服', timestamp: '2026-04-29 09:00' },
      { action: '退货入库隔离', by: '赵客服', role: '渠道客服', timestamp: '2026-04-30 16:00' },
      { action: '风味复盘开始', by: '陈杯测', role: '杯测员', timestamp: '2026-05-01 10:30' },
      { action: '风味复盘完成', by: '陈杯测', role: '杯测员', timestamp: '2026-05-02 14:00' },
      { action: '烘焙师确认并调整曲线', by: '林烘焙', role: '烘焙师', timestamp: '2026-05-03 09:00' },
      { action: '客诉关闭', by: '赵客服', role: '渠道客服', timestamp: '2026-05-06 11:00' }
    ]
  },
  {
    id: 'CR-005',
    orderId: 'CO-001',
    beanId: 'GB-001',
    curveId: 'RC-001',
    customer: '巢畔咖啡',
    status: 'recovering',
    complaintDate: '2026-05-25',
    customerFeedback: '第二批耶加雪菲也有问题，酸度太高偏尖酸，花香弱，和上次v3曲线的出品不一致。',
    returnReason: '疑似同曲线不同烘焙日出品波动',
    recoveryAction: '已安排样品退回待杯测',
    flavorReview: null,
    supplementaryNotes: [
      { author: '李客服', role: '渠道客服', content: '同客户第二次投诉，比上次更不满意，要求技术负责人直接对接。', timestamp: '2026-05-25 10:00' },
      { author: '李客服', role: '渠道客服', content: '已协调陈杯测加急安排，样品明日到。', timestamp: '2026-05-25 14:00' }
    ],
    history: [
      { action: '客诉登记', by: '李客服', role: '渠道客服', timestamp: '2026-05-25 10:00' },
      { action: '开始回收处理', by: '李客服', role: '渠道客服', timestamp: '2026-05-25 14:00' }
    ]
  }
]);

export const alerts = derived(
  [greenBeans, roastCurves, complaintRecords],
  ([$greenBeans, $roastCurves, $complaintRecords]) => {
    const result = [];

    const fifoViolations = $greenBeans.filter(b => b.fifoAlert);
    if (fifoViolations.length > 0) {
      result.push({
        type: 'fifo',
        level: 'error',
        title: '库存先进先出失控',
        detail: `${fifoViolations.map(b => b.name).join('、')} 到货时间较早但仍在使用，存在陈豆混用风险`,
        beanIds: fifoViolations.map(b => b.id)
      });
    }

    const curveConflicts = $roastCurves.filter(c => c.alert);
    if (curveConflicts.length > 0) {
      result.push({
        type: 'curve',
        level: 'warning',
        title: '烘焙曲线版本混乱',
        detail: `${curveConflicts.map(c => c.name).join('、')} 存在多版本共存且未标记废弃，易误用旧版`,
        curveIds: curveConflicts.map(c => c.id)
      });
    }

    const beanComplaints = {};
    $complaintRecords.forEach(c => {
      if (c.status !== 'resolved') {
        const key = c.beanId;
        if (!beanComplaints[key]) beanComplaints[key] = [];
        beanComplaints[key].push(c);
      }
    });
    Object.entries(beanComplaints).forEach(([beanId, complaints]) => {
      if (complaints.length > 1) {
        const beanName = $greenBeans.find(b => b.id === beanId)?.name || beanId;
        const flavors = complaints.map(c => c.customerFeedback.substring(0, 10)).join('；');
        result.push({
          type: 'flavor',
          level: 'warning',
          title: '客诉风味不一致',
          detail: `${beanName} 有 ${complaints.length} 条未关闭客诉，反馈方向不同：${flavors}`,
          complaintIds: complaints.map(c => c.id)
        });
      }
    });

    return result;
  }
);

export const roleTodos = derived(
  complaintRecords,
  ($complaintRecords) => {
    const todos = {};
    ROLES.forEach(role => {
      todos[role] = $complaintRecords.filter(c => ROLE_TODO_MAP[role](c));
    });
    return todos;
  }
);

export function advanceStatus(recordId) {
  complaintRecords.update(records =>
    records.map(r => {
      if (r.id !== recordId) return r;
      const next = STATUS_MAP[r.status]?.next;
      if (!next) return r;
      return { ...r, status: next };
    })
  );
}

export function addNote(recordId, author, role, content) {
  complaintRecords.update(records =>
    records.map(r => {
      if (r.id !== recordId) return r;
      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      return {
        ...r,
        supplementaryNotes: [...r.supplementaryNotes, { author, role, content, timestamp: ts }],
        history: [...r.history, { action: '添加备注', by: author, role, timestamp: ts }]
      };
    })
  );
}

export function updateReturnReason(recordId, reason) {
  complaintRecords.update(records =>
    records.map(r => {
      if (r.id !== recordId) return r;
      return { ...r, returnReason: reason };
    })
  );
}

export function updateRecoveryAction(recordId, action) {
  complaintRecords.update(records =>
    records.map(r => {
      if (r.id !== recordId) return r;
      return { ...r, recoveryAction: action };
    })
  );
}

export function submitFlavorReview(recordId, review) {
  complaintRecords.update(records =>
    records.map(r => {
      if (r.id !== recordId) return r;
      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      return {
        ...r,
        flavorReview: { ...review, date: ts },
        history: [...r.history, { action: '风味复盘完成', by: review.reviewer, role: '杯测员', timestamp: ts + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') }]
      };
    })
  );
}

export function getBeanName(beanId) {
  const beans = get(greenBeans);
  const found = beans.find(b => b.id === beanId);
  return found ? found.name : beanId;
}

export function getCurveName(curveId) {
  const curves = get(roastCurves);
  const found = curves.find(c => c.id === curveId);
  return found ? found.name : curveId;
}
