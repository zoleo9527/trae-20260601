import { db } from '../models/database';
import {
    BrandDemand,
    CaseRecord,
    ScriptVersion,
    StatusLog,
    Talent,
    TodoItem,
    User
} from '../types';

const seedData = () => {
  db.reset();

  const users: User[] = [
    { id: 'user_biz_1', name: '张商务', role: 'business' },
    { id: 'user_biz_2', name: '李商务', role: 'business' },
    { id: 'user_dir_1', name: '王编导', role: 'director' },
    { id: 'user_dir_2', name: '赵编导', role: 'director' },
    { id: 'user_agent_1', name: '陈经纪', role: 'talent_agent' },
    { id: 'user_agent_2', name: '刘经纪', role: 'talent_agent' },
    { id: 'user_fin_1', name: '周财务', role: 'finance' }
  ];
  users.forEach(u => db.users.push(u));

  const talents: Talent[] = [
    {
      id: 'talent_1',
      name: '美食博主小A',
      platform: '抖音',
      followers: 500000,
      category: '美食',
      contact: '13800138001',
      agentId: 'user_agent_1',
      createdAt: '2024-01-15T00:00:00Z'
    },
    {
      id: 'talent_2',
      name: '美妆达人小B',
      platform: '小红书',
      followers: 1200000,
      category: '美妆',
      contact: '13800138002',
      agentId: 'user_agent_1',
      createdAt: '2024-02-20T00:00:00Z'
    },
    {
      id: 'talent_3',
      name: '数码评测师小C',
      platform: 'B站',
      followers: 800000,
      category: '数码',
      contact: '13800138003',
      agentId: 'user_agent_2',
      createdAt: '2024-03-10T00:00:00Z'
    },
    {
      id: 'talent_4',
      name: '健身教练小D',
      platform: '抖音',
      followers: 300000,
      category: '健身',
      contact: '13800138004',
      agentId: 'user_agent_2',
      createdAt: '2024-01-25T00:00:00Z'
    }
  ];
  talents.forEach(t => db.talents.push(t));

  const brandDemands: BrandDemand[] = [
    {
      id: 'demand_1',
      brandName: '某奶茶品牌',
      productName: '新品果茶系列',
      budget: 50000,
      demandDescription: '推广夏季新品果茶，突出清爽口感',
      businessId: 'user_biz_1',
      createdAt: '2024-05-01T00:00:00Z',
      deadline: '2024-05-30T00:00:00Z'
    },
    {
      id: 'demand_2',
      brandName: '某护肤品牌',
      productName: '保湿精华液',
      budget: 80000,
      demandDescription: '双11预热推广，强调成分天然',
      businessId: 'user_biz_1',
      createdAt: '2024-05-10T00:00:00Z',
      deadline: '2024-06-15T00:00:00Z'
    },
    {
      id: 'demand_3',
      brandName: '某手机品牌',
      productName: '新款智能手机',
      budget: 150000,
      demandDescription: '新品发布会预热，突出拍照功能',
      businessId: 'user_biz_2',
      createdAt: '2024-05-15T00:00:00Z',
      deadline: '2024-06-20T00:00:00Z'
    },
    {
      id: 'demand_4',
      brandName: '某运动品牌',
      productName: '健身器械套装',
      budget: 60000,
      demandDescription: '618促销推广，适合家庭使用',
      businessId: 'user_biz_2',
      createdAt: '2024-05-20T00:00:00Z',
      deadline: '2024-06-10T00:00:00Z'
    },
    {
      id: 'demand_5',
      brandName: '某咖啡品牌',
      productName: '冷萃咖啡系列',
      budget: 45000,
      demandDescription: '夏季冷萃咖啡推广',
      businessId: 'user_biz_1',
      createdAt: '2024-05-25T00:00:00Z',
      deadline: '2024-06-25T00:00:00Z'
    },
    {
      id: 'demand_6',
      brandName: '某零食品牌',
      productName: '坚果礼盒',
      budget: 55000,
      demandDescription: '端午礼品推广',
      businessId: 'user_biz_2',
      createdAt: '2024-05-28T00:00:00Z',
      deadline: '2024-06-08T00:00:00Z'
    }
  ];
  brandDemands.forEach(d => db.brandDemands.push(d));

  const scriptVersions: ScriptVersion[] = [
    {
      id: 'script_1_v1',
      demandId: 'demand_1',
      version: 1,
      content: '脚本内容：街头采访+产品试喝',
      status: 'approved',
      createdBy: 'user_dir_1',
      createdAt: '2024-05-05T00:00:00Z'
    },
    {
      id: 'script_2_v1',
      demandId: 'demand_2',
      version: 1,
      content: '脚本内容：护肤步骤+成分讲解',
      status: 'approved',
      createdBy: 'user_dir_1',
      createdAt: '2024-05-12T00:00:00Z'
    },
    {
      id: 'script_3_v1',
      demandId: 'demand_3',
      version: 1,
      content: '脚本内容：开箱评测+拍照对比',
      status: 'approved',
      createdBy: 'user_dir_2',
      createdAt: '2024-05-18T00:00:00Z'
    },
    {
      id: 'script_4_v1',
      demandId: 'demand_4',
      version: 1,
      content: '脚本内容：居家健身教程+产品展示',
      status: 'revised',
      createdBy: 'user_dir_2',
      createdAt: '2024-05-22T00:00:00Z',
      remark: '需要增加更多产品特写'
    },
    {
      id: 'script_5_v1',
      demandId: 'demand_5',
      version: 1,
      content: '脚本内容：办公室咖啡场景',
      status: 'pending_review',
      createdBy: 'user_dir_1',
      createdAt: '2024-05-26T00:00:00Z'
    },
    {
      id: 'script_6_v1',
      demandId: 'demand_6',
      version: 1,
      content: '脚本内容：端午送礼场景',
      status: 'draft',
      createdBy: 'user_dir_2',
      createdAt: '2024-05-29T00:00:00Z'
    }
  ];
  scriptVersions.forEach(s => db.scriptVersions.push(s));

  const now = new Date();
  const caseRecords: CaseRecord[] = [
    {
      id: 'case_1',
      demandId: 'demand_1',
      talentId: 'talent_1',
      scriptId: 'script_1_v1',
      status: 'completed',
      currentHandler: null,
      settlementData: {
        views: 1200000,
        likes: 85000,
        comments: 3200,
        shares: 1500,
        clickRate: 8.5,
        conversionRate: 2.3,
        actualFee: 50000,
        platformFee: 5000,
        talentFee: 35000
      },
      dataSubmittedAt: '2024-05-25T10:00:00Z',
      dataSubmittedBy: 'user_agent_1',
      settlementReviewedAt: '2024-05-28T14:00:00Z',
      settlementReviewedBy: 'user_biz_1',
      paidAt: '2024-05-30T00:00:00Z',
      paidAmount: 35000,
      createdAt: '2024-05-01T00:00:00Z',
      updatedAt: '2024-05-30T00:00:00Z'
    },
    {
      id: 'case_2',
      demandId: 'demand_2',
      talentId: 'talent_2',
      scriptId: 'script_2_v1',
      status: 'settlement_pending_review',
      currentHandler: 'business',
      settlementData: {
        views: 2500000,
        likes: 150000,
        comments: 8500,
        shares: 3200,
        clickRate: 10.2,
        conversionRate: 3.1,
        actualFee: 80000,
        platformFee: 8000,
        talentFee: 56000
      },
      dataSubmittedAt: '2024-06-02T09:00:00Z',
      dataSubmittedBy: 'user_agent_1',
      supplementaryRemark: '补充了小红书收藏数据：12000',
      supplementaryAt: '2024-06-03T11:00:00Z',
      settlementReviewedAt: '2024-06-04T15:00:00Z',
      settlementReviewedBy: 'user_fin_1',
      createdAt: '2024-05-10T00:00:00Z',
      updatedAt: '2024-06-04T15:00:00Z'
    },
    {
      id: 'case_3',
      demandId: 'demand_3',
      talentId: 'talent_3',
      scriptId: 'script_3_v1',
      status: 'data_rejected',
      currentHandler: 'talent_agent',
      rejectReason: '缺少B站投币、收藏数据，请补充完整后重新提交',
      rejectAt: '2024-06-03T16:00:00Z',
      rejectBy: 'user_biz_2',
      settlementData: {
        views: 800000,
        likes: 45000,
        comments: 2100,
        shares: 800,
        clickRate: 6.8,
        conversionRate: 1.8,
        actualFee: 150000,
        platformFee: 15000,
        talentFee: 105000
      },
      dataSubmittedAt: '2024-06-02T14:00:00Z',
      dataSubmittedBy: 'user_agent_2',
      createdAt: '2024-05-15T00:00:00Z',
      updatedAt: '2024-06-03T16:00:00Z'
    },
    {
      id: 'case_4',
      demandId: 'demand_4',
      talentId: 'talent_4',
      scriptId: 'script_4_v1',
      status: 'delayed',
      currentHandler: 'director',
      delayedDays: 7,
      delayRemark: '达人档期调整，脚本需要重新修改',
      delayAt: '2024-06-01T10:00:00Z',
      createdAt: '2024-05-20T00:00:00Z',
      updatedAt: '2024-06-05T00:00:00Z'
    },
    {
      id: 'case_5',
      demandId: 'demand_5',
      talentId: 'talent_1',
      scriptId: 'script_5_v1',
      status: 'pending_approval',
      currentHandler: 'business',
      createdAt: '2024-05-25T00:00:00Z',
      updatedAt: '2024-05-26T00:00:00Z'
    },
    {
      id: 'case_6',
      demandId: 'demand_6',
      talentId: 'talent_2',
      scriptId: 'script_6_v1',
      status: 'scripting',
      currentHandler: 'director',
      createdAt: '2024-05-28T00:00:00Z',
      updatedAt: '2024-05-29T00:00:00Z'
    }
  ];
  caseRecords.forEach(c => db.caseRecords.push(c));

  const statusLogs: StatusLog[] = [
    {
      id: db.generateId(),
      caseId: 'case_1',
      fromStatus: null,
      toStatus: 'pending_script',
      operatorId: 'user_biz_1',
      operatorRole: 'business',
      createdAt: '2024-05-01T00:00:00Z'
    },
    {
      id: db.generateId(),
      caseId: 'case_1',
      fromStatus: 'pending_script',
      toStatus: 'scripting',
      operatorId: 'user_dir_1',
      operatorRole: 'director',
      createdAt: '2024-05-02T00:00:00Z'
    },
    {
      id: db.generateId(),
      caseId: 'case_1',
      fromStatus: 'scripting',
      toStatus: 'pending_approval',
      operatorId: 'user_dir_1',
      operatorRole: 'director',
      createdAt: '2024-05-05T00:00:00Z'
    },
    {
      id: db.generateId(),
      caseId: 'case_1',
      fromStatus: 'pending_approval',
      toStatus: 'shooting',
      operatorId: 'user_biz_1',
      operatorRole: 'business',
      createdAt: '2024-05-06T00:00:00Z'
    },
    {
      id: db.generateId(),
      caseId: 'case_1',
      fromStatus: 'shooting',
      toStatus: 'pending_data',
      operatorId: 'user_dir_1',
      operatorRole: 'director',
      createdAt: '2024-05-20T00:00:00Z'
    },
    {
      id: db.generateId(),
      caseId: 'case_1',
      fromStatus: 'pending_data',
      toStatus: 'data_submitted',
      operatorId: 'user_agent_1',
      operatorRole: 'talent_agent',
      createdAt: '2024-05-25T10:00:00Z'
    },
    {
      id: db.generateId(),
      caseId: 'case_1',
      fromStatus: 'data_submitted',
      toStatus: 'pending_settlement',
      operatorId: 'user_biz_1',
      operatorRole: 'business',
      createdAt: '2024-05-26T00:00:00Z'
    },
    {
      id: db.generateId(),
      caseId: 'case_1',
      fromStatus: 'pending_settlement',
      toStatus: 'settlement_pending_review',
      operatorId: 'user_fin_1',
      operatorRole: 'finance',
      createdAt: '2024-05-27T00:00:00Z'
    },
    {
      id: db.generateId(),
      caseId: 'case_1',
      fromStatus: 'settlement_pending_review',
      toStatus: 'completed',
      operatorId: 'user_biz_1',
      operatorRole: 'business',
      remark: '数据核对无误，同意结算',
      createdAt: '2024-05-28T14:00:00Z'
    }
  ];
  statusLogs.forEach(l => db.statusLogs.push(l));

  const todoItems: TodoItem[] = [
    {
      id: db.generateId(),
      caseId: 'case_2',
      title: '复核结案费用：某护肤品牌-保湿精华液',
      description: '结案数据已提交，费用结算待复核',
      role: 'business',
      priority: 'high',
      dueDate: '2024-06-06T00:00:00Z',
      createdAt: '2024-06-04T15:00:00Z'
    },
    {
      id: db.generateId(),
      caseId: 'case_3',
      title: '补充结案数据：某手机品牌-新款智能手机',
      description: '数据被驳回，缺少投币、收藏数据',
      role: 'talent_agent',
      priority: 'high',
      dueDate: '2024-06-05T00:00:00Z',
      createdAt: '2024-06-03T16:00:00Z'
    },
    {
      id: db.generateId(),
      caseId: 'case_4',
      title: '处理延期项目：某运动品牌-健身器械套装',
      description: '项目已延期7天，需要重新调整脚本和排期',
      role: 'director',
      priority: 'high',
      dueDate: '2024-06-08T00:00:00Z',
      createdAt: '2024-06-05T00:00:00Z'
    },
    {
      id: db.generateId(),
      caseId: 'case_5',
      title: '审批脚本：某咖啡品牌-冷萃咖啡系列',
      description: '脚本已提交，待商务审批',
      role: 'business',
      priority: 'medium',
      dueDate: '2024-06-07T00:00:00Z',
      createdAt: '2024-05-26T00:00:00Z'
    },
    {
      id: db.generateId(),
      caseId: 'case_6',
      title: '完成脚本撰写：某零食品牌-坚果礼盒',
      description: '脚本撰写中，需要尽快完成',
      role: 'director',
      priority: 'medium',
      dueDate: '2024-06-06T00:00:00Z',
      createdAt: '2024-05-29T00:00:00Z'
    }
  ];
  todoItems.forEach(t => db.todoItems.push(t));

  console.log('Seed data loaded successfully!');
  console.log(`Users: ${db.users.length}`);
  console.log(`Talents: ${db.talents.length}`);
  console.log(`Brand Demands: ${db.brandDemands.length}`);
  console.log(`Script Versions: ${db.scriptVersions.length}`);
  console.log(`Case Records: ${db.caseRecords.length}`);
  console.log(`Todo Items: ${db.todoItems.length}`);
  console.log(`Status Logs: ${db.statusLogs.length}`);
};

seedData();

export default seedData;
