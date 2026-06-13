import type { Appeal } from '../types';

export const mockAppeals: Appeal[] = [
  {
    id: 'AP20260601001',
    settlementId: 'ST20260601002',
    position: '仓库分拣员',
    company: '广州XX物流有限公司',
    recruiterId: 'user-004',
    recruiterName: '赵六',
    hrId: 'user-005',
    hrName: '周八',
    appealReason: '候选人离职时间不符合返费条件',
    status: 'pending_operator_arbitration',
    evidence: [
      {
        role: '企业HR',
        files: ['离职证明.pdf', '考勤记录.xlsx'],
        description: '候选人入职3天后离职，考勤记录显示仅工作2天'
      },
      {
        role: '招聘顾问',
        files: ['岗位调整通知.pdf', '候选人沟通记录.png'],
        description: '企业单方面调整岗位导致候选人离职，非候选人主动离职'
      }
    ],
    history: [
      {
        time: '2026-05-16 09:00',
        role: '企业HR',
        operator: '周八',
        action: '发起异常申诉',
        remark: '候选人孙七在入职后3天离职，不符合返费条件，申请撤销结算'
      },
      {
        time: '2026-05-16 10:00',
        role: '招聘顾问',
        operator: '赵六',
        action: '补充说明',
        remark: '候选人离职是因为企业调整岗位，非候选人主动离职，应正常结算'
      },
      {
        time: '2026-05-16 11:00',
        role: '运营',
        operator: '吴九',
        action: '开始仲裁',
        remark: '已收到双方材料，开始仲裁流程'
      }
    ],
    createdAt: '2026-05-16 09:00',
    updatedAt: '2026-05-16 11:00'
  },
  {
    id: 'AP20260601002',
    settlementId: 'ST20260601004',
    position: '工厂质检员',
    company: '东莞XX制造有限公司',
    recruiterId: 'user-004',
    recruiterName: '赵六',
    hrId: 'user-003',
    hrName: '王五',
    appealReason: '返费金额计算错误',
    status: 'resolved',
    evidence: [
      {
        role: '企业HR',
        files: ['返费协议.pdf', '工资单.xlsx'],
        description: '根据协议，返费应为3000元，而非3500元'
      },
      {
        role: '招聘顾问',
        files: ['岗位说明.pdf'],
        description: '该岗位为特殊岗位，返费标准为3500元'
      }
    ],
    history: [
      {
        time: '2026-05-18 10:00',
        role: '企业HR',
        operator: '王五',
        action: '发起异常申诉',
        remark: '返费金额计算错误，应为3000元'
      },
      {
        time: '2026-05-18 11:00',
        role: '招聘顾问',
        operator: '赵六',
        action: '补充说明',
        remark: '该岗位为特殊岗位，返费标准为3500元，有岗位说明为证'
      },
      {
        time: '2026-05-18 14:00',
        role: '运营',
        operator: '吴九',
        action: '仲裁结果',
        remark: '经核实，该岗位确实为特殊岗位，返费标准为3500元，驳回申诉'
      }
    ],
    createdAt: '2026-05-18 10:00',
    updatedAt: '2026-05-18 14:00'
  },
  {
    id: 'AP20260601003',
    settlementId: 'ST20260601005',
    position: '销售代表',
    company: '北京XX科技有限公司',
    recruiterId: 'user-002',
    recruiterName: '张三',
    hrId: 'user-005',
    hrName: '周八',
    appealReason: '候选人信息与实际不符',
    status: 'pending_recruiter_response',
    evidence: [
      {
        role: '企业HR',
        files: ['候选人简历.pdf', '实际工作表现.docx'],
        description: '候选人简历显示有3年销售经验，但实际工作表现不符'
      }
    ],
    history: [
      {
        time: '2026-05-20 09:00',
        role: '企业HR',
        operator: '周八',
        action: '发起异常申诉',
        remark: '候选人信息与实际不符，申请撤销返费'
      },
      {
        time: '2026-05-20 10:00',
        role: '运营',
        operator: '吴九',
        action: '转交招聘顾问',
        remark: '请招聘顾问补充说明材料'
      }
    ],
    createdAt: '2026-05-20 09:00',
    updatedAt: '2026-05-20 10:00'
  },
  {
    id: 'AP20260601004',
    settlementId: 'ST20260601008',
    position: '保洁员',
    company: '成都XX清洁服务有限公司',
    recruiterId: 'user-004',
    recruiterName: '赵六',
    hrId: 'user-003',
    hrName: '王五',
    appealReason: '返费金额异议',
    status: 'rejected',
    evidence: [
      {
        role: '企业HR',
        files: ['返费标准说明.pdf'],
        description: '该岗位返费标准应为2000元，而非2500元'
      },
      {
        role: '招聘顾问',
        files: ['候选人工作记录.xlsx'],
        description: '候选人工作表现优秀，应按高标准结算'
      }
    ],
    history: [
      {
        time: '2026-05-24 15:00',
        role: '企业HR',
        operator: '王五',
        action: '发起异常申诉',
        remark: '返费金额异议，申请调整'
      },
      {
        time: '2026-05-24 16:00',
        role: '招聘顾问',
        operator: '赵六',
        action: '补充说明',
        remark: '候选人工作表现优秀，应按高标准结算'
      },
      {
        time: '2026-05-24 17:00',
        role: '运营',
        operator: '吴九',
        action: '仲裁结果',
        remark: '经核实，该岗位返费标准确为2000元，支持申诉，调整结算金额'
      }
    ],
    createdAt: '2026-05-24 15:00',
    updatedAt: '2026-05-24 17:00'
  },
  {
    id: 'AP20260601005',
    settlementId: 'ST20260601009',
    position: '厨师',
    company: '武汉XX餐饮有限公司',
    recruiterId: 'user-004',
    recruiterName: '赵六',
    hrId: 'user-005',
    hrName: '周八',
    appealReason: '候选人技能不符',
    status: 'pending_operator_arbitration',
    evidence: [
      {
        role: '企业HR',
        files: ['技能测试结果.pdf', '工作表现评估.docx'],
        description: '候选人技能测试未达标，实际工作表现不佳'
      },
      {
        role: '招聘顾问',
        files: ['候选人资质证书.pdf', '面试记录.xlsx'],
        description: '候选人持有厨师资质证书，面试表现良好'
      }
    ],
    history: [
      {
        time: '2026-05-25 15:00',
        role: '企业HR',
        operator: '周八',
        action: '发起异常申诉',
        remark: '候选人技能不符，申请撤销返费'
      },
      {
        time: '2026-05-25 16:00',
        role: '招聘顾问',
        operator: '赵六',
        action: '补充说明',
        remark: '候选人持有厨师资质证书，面试表现良好，应正常结算'
      },
      {
        time: '2026-05-25 17:00',
        role: '运营',
        operator: '吴九',
        action: '开始仲裁',
        remark: '已收到双方材料，开始仲裁流程'
      }
    ],
    createdAt: '2026-05-25 15:00',
    updatedAt: '2026-05-25 17:00'
  }
];
