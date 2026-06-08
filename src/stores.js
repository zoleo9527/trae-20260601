import { writable } from 'svelte/store';

const initialSchedules = [
  {
    id: 'HT-2026-001',
    pondNo: 'A-03号塘',
    species: '草鱼',
    estimatedWeight: 12500,
    planDate: '2026-06-08',
    customer: '鲜鱼坊水产批发',
    contact: '张经理 138****5678',
    status: 'pending_tech',
    currentHandler: '养殖技术员',
    handlerName: '李建国',
    blocker: '待确认捕捞日期与人员安排',
    isAbnormal: false,
    inspectionRecords: [
      { date: '2026-06-05', recorder: '李建国', content: '水体溶氧8.2mg/L，鱼群活动正常，预计规格达标' },
      { date: '2026-06-02', recorder: '李建国', content: '投喂量增至每日420kg，生长速度符合预期' }
    ],
    feedRecords: [
      { date: '2026-06-05', type: '成鱼配合饲料', amount: 420, recorder: '王仓管' },
      { date: '2026-06-04', type: '成鱼配合饲料', amount: 400, recorder: '王仓管' }
    ],
    medicineRecords: [
      { date: '2026-05-28', type: 'EM菌', amount: '2.5kg', purpose: '水质调节', recorder: '李建国' }
    ],
    history: [
      { time: '2026-06-05 14:30', actor: '系统', action: '创建出塘排期', remark: '根据生长周期自动生成' },
      { time: '2026-06-05 15:00', actor: '场长 陈场长', action: '指派技术员', remark: '安排李建国负责A-03号塘出塘准备' }
    ],
    acceptance: null
  },
  {
    id: 'HT-2026-002',
    pondNo: 'B-01号塘',
    species: '鲫鱼',
    estimatedWeight: 8600,
    planDate: '2026-06-07',
    customer: '城东农贸市场',
    contact: '刘老板 139****1234',
    status: 'pending_feed',
    currentHandler: '饲料仓管',
    handlerName: '王仓管',
    blocker: '待确认停料时间与出塘前饲料库存',
    isAbnormal: true,
    abnormalReason: '原计划今日出塘，但饲料仓管未确认停料安排',
    inspectionRecords: [
      { date: '2026-06-06', recorder: '赵技术员', content: '鱼体光泽好，无病害，平均规格约450g/尾' },
      { date: '2026-06-04', recorder: '赵技术员', content: '水质指标正常，已建议提前24小时停料' }
    ],
    feedRecords: [
      { date: '2026-06-06', type: '鲫鱼配合饲料', amount: 180, recorder: '王仓管' },
      { date: '2026-06-05', type: '鲫鱼配合饲料', amount: 180, recorder: '王仓管' }
    ],
    medicineRecords: [],
    history: [
      { time: '2026-06-03 09:00', actor: '系统', action: '创建出塘排期', remark: '客户提前预定' },
      { time: '2026-06-04 11:00', actor: '养殖技术员 赵技术员', action: '完成塘口检查', remark: '符合出塘条件，建议6月7日出塘' },
      { time: '2026-06-06 17:00', actor: '系统', action: '异常提醒', remark: '饲料仓管未确认停料安排，可能影响明日出塘' }
    ],
    acceptance: null
  },
  {
    id: 'HT-2026-003',
    pondNo: 'C-05号塘',
    species: '鲈鱼',
    estimatedWeight: 6200,
    planDate: '2026-06-06',
    customer: '精品海鲜行',
    contact: '陈总 137****9999',
    status: 'pending_accept',
    currentHandler: '客户验收',
    handlerName: '待客户确认',
    blocker: '客户已现场验收，但签字确认未回传',
    isAbnormal: false,
    inspectionRecords: [
      { date: '2026-06-06', recorder: '李建国', content: '鲈鱼活力强，平均体重约600g，无损伤' }
    ],
    feedRecords: [
      { date: '2026-06-05', type: '鲈鱼配合饲料', amount: 150, recorder: '王仓管' },
      { date: '2026-06-04', type: '鲈鱼配合饲料', amount: 150, recorder: '王仓管' }
    ],
    medicineRecords: [
      { date: '2026-05-30', type: '维生素C', amount: '1kg', purpose: '抗应激', recorder: '李建国' }
    ],
    history: [
      { time: '2026-06-02 10:00', actor: '场长 陈场长', action: '创建出塘排期', remark: '精品海鲜行预定6000斤鲈鱼' },
      { time: '2026-06-05 16:00', actor: '养殖技术员 李建国', action: '完成塘口检查', remark: '符合出塘标准' },
      { time: '2026-06-05 17:30', actor: '饲料仓管 王仓管', action: '确认停料', remark: '已提前24小时停料' },
      { time: '2026-06-06 08:00', actor: '场长 陈场长', action: '组织捕捞', remark: '实际捕捞6200斤，已装车' },
      { time: '2026-06-06 11:30', actor: '客户 陈总', action: '现场验收', remark: '客户现场查看，对规格满意，待回传验收单' }
    ],
    acceptance: {
      actualWeight: 6180,
      checkItems: [
        { name: '鱼体活力', result: 'pass', remark: '活力强，无死亡' },
        { name: '规格均匀度', result: 'pass', remark: '平均600g左右，偏差小' },
        { name: '体表损伤', result: 'pass', remark: '无明显损伤' },
        { name: '药残检测', result: 'pending', remark: '待第三方报告' }
      ],
      signUrl: null,
      acceptTime: '2026-06-06 11:30',
      acceptedBy: '陈总（现场）',
      completed: false
    }
  },
  {
    id: 'HT-2026-004',
    pondNo: 'A-01号塘',
    species: '鳙鱼',
    estimatedWeight: 15000,
    planDate: '2026-06-05',
    customer: '绿色食品公司',
    contact: '王采购 136****8888',
    status: 'completed',
    currentHandler: '已完成',
    handlerName: '-',
    blocker: null,
    isAbnormal: false,
    inspectionRecords: [
      { date: '2026-06-05', recorder: '赵技术员', content: '鳙鱼生长良好，平均规格达标' }
    ],
    feedRecords: [
      { date: '2026-06-04', type: '浮性配合饲料', amount: 300, recorder: '王仓管' }
    ],
    medicineRecords: [],
    history: [
      { time: '2026-06-01 09:00', actor: '系统', action: '创建出塘排期', remark: '自动排期' },
      { time: '2026-06-03 14:00', actor: '养殖技术员 赵技术员', action: '完成塘口检查', remark: '符合出塘标准' },
      { time: '2026-06-04 10:00', actor: '饲料仓管 王仓管', action: '确认停料', remark: '已安排停料' },
      { time: '2026-06-05 07:00', actor: '场长 陈场长', action: '组织捕捞', remark: '捕捞完成，实际14800斤' },
      { time: '2026-06-05 14:00', actor: '客户 王采购', action: '验收完成', remark: '验收合格，已签字确认' }
    ],
    acceptance: {
      actualWeight: 14800,
      checkItems: [
        { name: '鱼体活力', result: 'pass', remark: '良好' },
        { name: '规格均匀度', result: 'pass', remark: '均匀' },
        { name: '体表损伤', result: 'pass', remark: '无损伤' },
        { name: '药残检测', result: 'pass', remark: '合格' }
      ],
      signUrl: '已签字',
      acceptTime: '2026-06-05 14:00',
      acceptedBy: '王采购',
      completed: true
    }
  }
];

export const schedules = writable(initialSchedules);
export const currentView = writable('list');
export const selectedScheduleId = writable(null);

export const handlers = {
  pending_tech: { role: '养殖技术员', color: '#3B82F6' },
  pending_feed: { role: '饲料仓管', color: '#F59E0B' },
  pending_manager: { role: '场长', color: '#8B5CF6' },
  pending_accept: { role: '客户验收', color: '#10B981' },
  completed: { role: '已完成', color: '#6B7280' }
};
