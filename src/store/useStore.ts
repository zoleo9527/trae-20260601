import { create } from 'zustand';
import type {
  Patient,
  Course,
  ReassessmentRecord,
  ApprovalRecord,
  FollowupPlan,
  CommunicationResult,
} from '@/types';

interface AppState {
  patients: Patient[];
  courses: Course[];
  reassessments: ReassessmentRecord[];
  approvals: ApprovalRecord[];
  followupPlans: FollowupPlan[];
  currentRole: '治疗师' | '主任' | '前台';

  setRole: (role: '治疗师' | '主任' | '前台') => void;
  submitReassessment: (id: string) => void;
  approveReassessment: (id: string, approval: ApprovalRecord) => void;
  rejectReassessment: (id: string, approval: ApprovalRecord) => void;
  addCommunication: (planId: string, record: { communicator: string; result: CommunicationResult; reason: string }) => void;
}

const mockPatients: Patient[] = [
  {
    id: 'p1',
    name: '王建国',
    gender: '男',
    age: 58,
    diagnosis: '脑卒中后右侧偏瘫',
    avatar: 'WJG',
  },
  {
    id: 'p2',
    name: '李美玲',
    gender: '女',
    age: 45,
    diagnosis: '腰椎间盘突出',
    avatar: 'LML',
  },
  {
    id: 'p3',
    name: '张浩然',
    gender: '男',
    age: 72,
    diagnosis: '膝关节置换术后',
    avatar: 'ZHR',
  },
];

const mockCourses: Course[] = [
  {
    id: 'c1',
    patientId: 'p1',
    totalSessions: 24,
    completedSessions: 22,
    startDate: '2026-04-10',
    painScoreAdmission: 6,
    painScoreCurrent: 2,
    painHistory: [
      { date: '04-10', score: 6 },
      { date: '04-17', score: 5 },
      { date: '04-24', score: 4.5 },
      { date: '05-01', score: 4 },
      { date: '05-08', score: 3.5 },
      { date: '05-15', score: 3 },
      { date: '05-22', score: 2.5 },
      { date: '05-29', score: 2 },
      { date: '06-05', score: 2 },
    ],
    unfinishedItems: [],
  },
  {
    id: 'c2',
    patientId: 'p2',
    totalSessions: 18,
    completedSessions: 16,
    startDate: '2026-04-15',
    painScoreAdmission: 7,
    painScoreCurrent: 5,
    painHistory: [
      { date: '04-15', score: 7 },
      { date: '04-22', score: 6.5 },
      { date: '04-29', score: 6 },
      { date: '05-06', score: 5.8 },
      { date: '05-13', score: 5.5 },
      { date: '05-20', score: 5.3 },
      { date: '05-27', score: 5 },
      { date: '06-03', score: 5 },
    ],
    unfinishedItems: ['核心稳定性训练-仰卧位屈膝', '核心稳定性训练-桥式运动', '核心稳定性训练-侧平板支撑'],
  },
  {
    id: 'c3',
    patientId: 'p3',
    totalSessions: 20,
    completedSessions: 14,
    startDate: '2026-04-20',
    painScoreAdmission: 5,
    painScoreCurrent: 3,
    painHistory: [
      { date: '04-20', score: 5 },
      { date: '04-27', score: 4.5 },
      { date: '05-04', score: 4 },
      { date: '05-11', score: 3.8 },
      { date: '05-18', score: 3.5 },
      { date: '05-25', score: 3.2 },
      { date: '06-01', score: 3 },
    ],
    unfinishedItems: ['步态训练-单腿支撑相', '步态训练-摆动相控制', '上下阶梯训练-交替下阶梯'],
  },
];

const mockReassessments: ReassessmentRecord[] = [
  {
    id: 'r1',
    courseId: 'c1',
    patientId: 'p1',
    therapistId: 't1',
    therapistName: '陈晓明',
    conclusion: '结案',
    conclusionReason: '功能恢复达预期目标，上肢Fugl-Meyer评分从32分提升至58分，日常生活活动能力Barthel指数从45分提升至85分，可独立完成穿脱衣物、进食等日常活动。',
    status: '已审批',
    functionalScore: 85,
    painVAS: 2,
    romMeasurement: '右肩屈曲150°，右肘屈曲145°，右腕背伸40°',
    subjectiveEvaluation: '患者对康复效果满意，可独立完成大部分日常活动，疼痛明显缓解。',
    submittedAt: '2026-06-02 09:30',
  },
  {
    id: 'r2',
    courseId: 'c2',
    patientId: 'p2',
    therapistId: 't2',
    therapistName: '林雨薇',
    conclusion: '换方案',
    conclusionReason: '当前方案疼痛缓解不明显，VAS从7分降至5分，核心稳定性训练3项未达标。建议调整为麦肯基疗法配合核心激活训练，加强椎间盘回纳和脊柱稳定性。',
    status: '已审批',
    functionalScore: 45,
    painVAS: 5,
    romMeasurement: '腰椎前屈40°，后伸20°，左侧屈15°，右侧屈18°',
    subjectiveEvaluation: '患者诉久坐后腰部酸痛加重，晨起僵硬感明显，对当前训练方案信心不足。',
    submittedAt: '2026-06-03 14:20',
  },
  {
    id: 'r3',
    courseId: 'c3',
    patientId: 'p3',
    therapistId: 't1',
    therapistName: '陈晓明',
    conclusion: '续疗',
    conclusionReason: '疼痛有所缓解，步态较前改善但仍有3项训练未达标。膝关节活动度持续改善中，建议继续当前方案延长6次训练以巩固疗效。',
    status: '已审批',
    functionalScore: 60,
    painVAS: 3,
    romMeasurement: '右膝屈曲110°，右膝伸直-5°，步行速度0.8m/s',
    subjectiveEvaluation: '患者膝关节活动度改善，步行能力较前进步，但上下阶梯仍需扶手辅助。',
    submittedAt: '2026-06-04 10:15',
  },
];

const mockApprovals: ApprovalRecord[] = [
  {
    id: 'a1',
    reassessmentId: 'r1',
    directorId: 'd1',
    directorName: '赵德明',
    action: '通过',
    suggestion: '同意结案。患者功能恢复良好，建议出院后继续居家训练方案：每日上肢主动活动30分钟、手功能训练20分钟。3个月后门诊复查。',
    suggestedSessions: null,
    notes: '恢复良好，符合结案标准',
    approvedAt: '2026-06-02 16:45',
  },
  {
    id: 'a2',
    reassessmentId: 'r2',
    directorId: 'd1',
    directorName: '赵德明',
    action: '通过',
    suggestion: '同意换方案。新方案以麦肯基疗法为核心，配合核心激活训练。建议新疗程12次，每周3次，4周完成。重点关注椎间盘回纳效果及核心肌群激活程度。',
    suggestedSessions: 12,
    notes: '当前方案效果不佳需调整，新方案要定期评估',
    approvedAt: '2026-06-03 17:30',
  },
  {
    id: 'a3',
    reassessmentId: 'r3',
    directorId: 'd1',
    directorName: '赵德明',
    action: '通过',
    suggestion: '同意续疗。建议续6次训练，继续当前方案，重点突破步态训练和阶梯训练。可增加水疗辅助训练以减轻关节负重。',
    suggestedSessions: 6,
    notes: '进展尚可但需延长时间',
    approvedAt: '2026-06-04 15:20',
  },
];

const mockFollowupPlans: FollowupPlan[] = [
  {
    id: 'f1',
    reassessmentId: 'r1',
    patientId: 'p1',
    planType: '结案',
    planDetails: '出院居家训练方案：每日上肢主动活动30分钟、手功能训练20分钟、步行训练30分钟。3个月后门诊复查评估。',
    totalFee: 0,
    paymentStatus: '无需缴费',
    scheduleItems: [],
    communicationRecords: [
      {
        id: 'cr1',
        followupPlanId: 'f1',
        communicator: '前台-张小燕',
        result: '已同意',
        reason: '患者对康复效果满意，同意结案并按医嘱进行居家训练',
        communicatedAt: '2026-06-05 09:00',
      },
    ],
  },
  {
    id: 'f2',
    reassessmentId: 'r2',
    patientId: 'p2',
    planType: '换方案',
    planDetails: '新方案：麦肯基疗法配合核心激活训练，每周3次，共12次。重点：椎间盘回纳手法、核心肌群激活、腰椎稳定性训练。',
    totalFee: 3600,
    paymentStatus: '待缴费',
    scheduleItems: [
      { date: '06-09', session: '麦肯基疗法+核心激活' },
      { date: '06-11', session: '麦肯基疗法+腰椎稳定' },
      { date: '06-13', session: '麦肯基疗法+核心激活' },
      { date: '06-16', session: '椎间盘回纳+核心激活' },
      { date: '06-18', session: '麦肯基疗法+腰椎稳定' },
      { date: '06-20', session: '麦肯基疗法+核心激活' },
      { date: '06-23', session: '椎间盘回纳+核心激活' },
      { date: '06-25', session: '麦肯基疗法+腰椎稳定' },
      { date: '06-27', session: '麦肯基疗法+核心激活' },
      { date: '06-30', session: '综合训练+中期评估' },
      { date: '07-02', session: '麦肯基疗法+核心激活' },
      { date: '07-04', session: '综合训练+末期评估' },
    ],
    communicationRecords: [
      {
        id: 'cr2',
        followupPlanId: 'f2',
        communicator: '前台-张小燕',
        result: '已同意',
        reason: '患者同意换方案，对麦肯基疗法有信心，待确认新疗程费用',
        communicatedAt: '2026-06-05 10:30',
      },
    ],
  },
  {
    id: 'f3',
    reassessmentId: 'r3',
    patientId: 'p3',
    planType: '续疗',
    planDetails: '继续当前方案延长6次训练，增加水疗辅助。重点：步态训练（单腿支撑相、摆动相控制）和上下阶梯训练。',
    totalFee: 1800,
    paymentStatus: '待确认',
    scheduleItems: [
      { date: '06-09', session: '步态训练+水疗' },
      { date: '06-11', session: '阶梯训练+步态训练' },
      { date: '06-13', session: '步态训练+水疗' },
      { date: '06-16', session: '阶梯训练+综合训练' },
      { date: '06-18', session: '步态训练+水疗' },
      { date: '06-20', session: '综合训练+末期评估' },
    ],
    communicationRecords: [
      {
        id: 'cr3',
        followupPlanId: 'f3',
        communicator: '前台-张小燕',
        result: '已暂停',
        reason: '家属要求暂停，原因：家庭照护困难，主要照护者（老伴）需住院治疗，预计2周后恢复训练',
        communicatedAt: '2026-06-05 14:00',
      },
    ],
  },
];

export const useStore = create<AppState>((set) => ({
  patients: mockPatients,
  courses: mockCourses,
  reassessments: mockReassessments,
  approvals: mockApprovals,
  followupPlans: mockFollowupPlans,
  currentRole: '治疗师',

  setRole: (role) => set({ currentRole: role }),

  submitReassessment: (id) =>
    set((state) => ({
      reassessments: state.reassessments.map((r) =>
        r.id === id ? { ...r, status: '已提交' as const, submittedAt: new Date().toLocaleString('zh-CN') } : r
      ),
    })),

  approveReassessment: (id, approval) =>
    set((state) => ({
      reassessments: state.reassessments.map((r) =>
        r.id === id ? { ...r, status: '已审批' as const } : r
      ),
      approvals: [...state.approvals, approval],
    })),

  rejectReassessment: (id, approval) =>
    set((state) => ({
      reassessments: state.reassessments.map((r) =>
        r.id === id ? { ...r, status: '已退回' as const } : r
      ),
      approvals: [...state.approvals, approval],
    })),

  addCommunication: (planId, record) =>
    set((state) => ({
      followupPlans: state.followupPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              communicationRecords: [
                ...plan.communicationRecords,
                {
                  id: `cr-${Date.now()}`,
                  followupPlanId: planId,
                  ...record,
                  communicatedAt: new Date().toLocaleString('zh-CN'),
                },
              ],
            }
          : plan
      ),
    })),
}));
