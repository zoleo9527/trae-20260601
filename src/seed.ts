import { v4 as uuidv4 } from 'uuid';
import {
  User, Client, Project, WorkflowRecord, Todo,
  UserRole, WorkflowStage, RecordStatus, TodoStatus, TodoType,
  DraftContent, Material, Note, WorkflowEvent, ResponsibilityEntry
} from './types';
import { initializeData } from './dataStore';
import { TodoService } from './services/TodoService';

function createSeedData() {
  const users: User[] = [
    {
      id: 'tc-001',
      name: '张税务',
      role: UserRole.TAX_CONSULTANT,
      email: 'zhangtax@example.com',
      projectIds: ['proj-001', 'proj-002'],
      clientIds: ['client-001', 'client-002'],
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'tc-002',
      name: '李税务',
      role: UserRole.TAX_CONSULTANT,
      email: 'litax@example.com',
      projectIds: ['proj-003'],
      clientIds: ['client-003'],
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'pm-001',
      name: '王经理',
      role: UserRole.PROJECT_MANAGER,
      email: 'wangpm@example.com',
      projectIds: ['proj-001', 'proj-002', 'proj-003'],
      clientIds: ['client-001', 'client-002', 'client-003'],
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'cf-001',
      name: '陈财务',
      role: UserRole.CLIENT_FINANCE,
      email: 'chenfinance@example.com',
      projectIds: ['proj-001'],
      clientIds: ['client-001'],
      createdAt: new Date('2024-02-01')
    },
    {
      id: 'cf-002',
      name: '赵财务',
      role: UserRole.CLIENT_FINANCE,
      email: 'zhaofinance@example.com',
      projectIds: ['proj-002'],
      clientIds: ['client-002'],
      createdAt: new Date('2024-02-15')
    },
    {
      id: 'cf-003',
      name: '孙财务',
      role: UserRole.CLIENT_FINANCE,
      email: 'sunfinance@example.com',
      projectIds: ['proj-003'],
      clientIds: ['client-003'],
      createdAt: new Date('2024-03-01')
    }
  ];

  const clients: Client[] = [
    {
      id: 'client-001',
      name: '科技创新有限公司',
      industry: '软件开发',
      taxTypes: ['企业所得税', '增值税'],
      contactPerson: '陈财务',
      contactEmail: 'chenfinance@example.com',
      createdAt: new Date('2024-01-10')
    },
    {
      id: 'client-002',
      name: '智能制造股份有限公司',
      industry: '高端制造',
      taxTypes: ['企业所得税', '增值税', '关税'],
      contactPerson: '赵财务',
      contactEmail: 'zhaofinance@example.com',
      createdAt: new Date('2024-01-20')
    },
    {
      id: 'client-003',
      name: '新能源科技有限公司',
      industry: '新能源',
      taxTypes: ['企业所得税', '增值税', '环境保护税'],
      contactPerson: '孙财务',
      contactEmail: 'sunfinance@example.com',
      createdAt: new Date('2024-02-10')
    }
  ];

  const projects: Project[] = [
    {
      id: 'proj-001',
      name: '2024年度企业所得税汇算清缴',
      clientId: 'client-001',
      taxConsultantId: 'tc-001',
      projectManagerId: 'pm-001',
      status: 'active',
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'proj-002',
      name: '2024Q1增值税申报',
      clientId: 'client-002',
      taxConsultantId: 'tc-001',
      projectManagerId: 'pm-001',
      status: 'active',
      createdAt: new Date('2024-03-01')
    },
    {
      id: 'proj-003',
      name: '2024年度研发费用加计扣除',
      clientId: 'client-003',
      taxConsultantId: 'tc-002',
      projectManagerId: 'pm-001',
      status: 'active',
      createdAt: new Date('2024-02-20')
    }
  ];

  const now = new Date();
  const records: WorkflowRecord[] = [
    {
      id: 'record-001',
      projectId: 'proj-001',
      clientId: 'client-001',
      taxPeriod: '2024Q1',
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: now,
      currentStage: WorkflowStage.RETURNED,
      status: RecordStatus.PENDING_REVISION,
      draftInfo: {
        taxConsultantId: 'tc-001',
        draftContent: {
          taxType: '企业所得税',
          taxableAmount: 5000000,
          taxAmount: 1250000,
          applicablePolicies: [
            {
              id: 'pol-001',
              name: '企业所得税法',
              code: 'ECL-2024',
              effectiveDate: new Date('2024-01-01'),
              description: '企业所得税基本法规'
            },
            {
              id: 'pol-002',
              name: '研发费用加计扣除',
              code: 'RDD-2024',
              effectiveDate: new Date('2024-01-01'),
              description: '研发费用按100%加计扣除'
            }
          ],
          specialAdjustments: [
            {
              id: 'adj-001',
              type: 'decrease',
              amount: 500000,
              reason: '研发费用加计扣除',
              policyBasis: '研发费用加计扣除政策'
            }
          ],
          riskNotes: '注意研发费用归集的完整性，确保符合加计扣除条件',
          calculations: [
            {
              id: 'calc-001',
              description: '应纳税所得额计算',
              formula: '收入 - 成本 - 费用 - 研发加计扣除',
              inputs: { income: 10000000, costs: 3000000, expenses: 2000000, rdDeduction: 500000 },
              result: 4500000
            }
          ],
          conclusions: [
            {
              id: 'conc-001',
              content: '本年度应纳税所得额为450万元，适用25%税率',
              policyBasis: '企业所得税法第四条',
              confidence: 'high'
            }
          ],
          sourceDocuments: []
        },
        sourceDocuments: [
          {
            id: 'doc-001',
            name: '利润表2024Q1.pdf',
            type: 'financial',
            url: '/uploads/doc-001.pdf',
            uploadedBy: 'tc-001',
            uploadedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)
          }
        ],
        calculations: [],
        conclusions: [],
        attachments: [],
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: now
      },
      confirmationInfo: {
        clientFinanceId: 'cf-001',
        requiredMaterials: [
          {
            id: 'mat-001',
            name: '银行对账单',
            description: '2024年1-3月银行对账单原件',
            required: true,
            source: 'client',
            status: 'provided',
            providedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            id: 'mat-002',
            name: '研发项目立项文件',
            description: '研发项目立项书和预算文件',
            required: true,
            source: 'client',
            status: 'pending'
          }
        ],
        materialsStatus: [
          { materialId: 'mat-001', status: 'provided', providedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
          { materialId: 'mat-002', status: 'pending' }
        ],
        confirmationStatus: 'returned',
        deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
      },
      returnInfo: {
        returnedBy: 'cf-001',
        returnReason: {
          category: 'calculation_error',
          description: '研发费用归集金额有误，需要核实',
          priority: 'high',
          relatedSection: 'specialAdjustments'
        },
        specificIssues: [
          {
            id: 'issue-001',
            title: '研发人员工资归集不全',
            description: '研发部门3名人员的工资未全额计入研发费用',
            location: 'specialAdjustments[0]',
            severity: 'high',
            screenshots: ['/screenshots/issue-001.png']
          },
          {
            id: 'issue-002',
            title: '设备折旧计算错误',
            description: '研发设备折旧年限与税务口径不一致',
            location: 'calculations[0]',
            severity: 'medium'
          }
        ],
        suggestedFixes: [
          '补充研发人员工资明细',
          '调整设备折旧计算方法',
          '重新计算研发费用总额'
        ],
        returnedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        expectedFixDeadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        isResponsibilityClear: true,
        responsibilityNotes: '研发费用归集属于税务顾问责任，需补充完整材料',
        isResolved: false
      },
      returnHistory: [],
      supplementaryNotes: [
        {
          id: 'note-001',
          authorId: 'tc-001',
          authorRole: UserRole.TAX_CONSULTANT,
          content: '已完成研发费用的初步归集，但客户反馈部分人员工资遗漏',
          type: 'technical',
          relatedTo: 'issue-001',
          createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
          isVisibleToClient: true
        },
        {
          id: 'note-002',
          authorId: 'cf-001',
          authorRole: UserRole.CLIENT_FINANCE,
          content: '研发部门确实有3名人员的工资未提供完整明细，请尽快补充',
          type: 'client_communication',
          relatedTo: 'issue-001',
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          isVisibleToClient: true
        },
        {
          id: 'note-003',
          authorId: 'pm-001',
          authorRole: UserRole.PROJECT_MANAGER,
          content: '已与客户财务沟通，会尽快提供补充材料。税务顾问需预留时间修改',
          type: 'internal',
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          isVisibleToClient: false
        }
      ],
      workflowHistory: [
        {
          eventType: 'DRAFT_CREATED',
          actorId: 'tc-001',
          actorRole: UserRole.TAX_CONSULTANT,
          timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          details: { taxType: '企业所得税' },
          newStage: WorkflowStage.DRAFT_CREATED
        },
        {
          eventType: 'DRAFT_SUBMITTED',
          actorId: 'tc-001',
          actorRole: UserRole.TAX_CONSULTANT,
          timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
          details: {},
          previousStage: WorkflowStage.DRAFT_CREATED,
          newStage: WorkflowStage.AWAITING_CONFIRMATION
        },
        {
          eventType: 'MATERIALS_PROVIDED',
          actorId: 'cf-001',
          actorRole: UserRole.CLIENT_FINANCE,
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          details: { materialsProvided: 1 }
        },
        {
          eventType: 'RECORD_RETURNED',
          actorId: 'cf-001',
          actorRole: UserRole.CLIENT_FINANCE,
          timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          details: { returnCategory: 'calculation_error', priority: 'high' },
          newStage: WorkflowStage.RETURNED
        }
      ],
      responsibilityTrace: [
        {
          stage: WorkflowStage.DRAFT_CREATED,
          responsibleRole: UserRole.TAX_CONSULTANT,
          responsibleUserId: 'tc-001',
          action: '创建申报底稿',
          timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          isComplete: true
        },
        {
          stage: WorkflowStage.AWAITING_CONFIRMATION,
          responsibleRole: UserRole.TAX_CONSULTANT,
          responsibleUserId: 'tc-001',
          action: '提交申报底稿',
          timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
          isComplete: true
        },
        {
          stage: WorkflowStage.RETURNED,
          responsibleRole: UserRole.CLIENT_FINANCE,
          responsibleUserId: 'cf-001',
          action: '退回申报底稿（研发费用计算错误）',
          timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          isComplete: true,
          notes: '退回原因：研发费用归集金额有误'
        },
        {
          stage: WorkflowStage.REVISION_IN_PROGRESS,
          responsibleRole: UserRole.TAX_CONSULTANT,
          responsibleUserId: 'tc-001',
          action: '修订申报底稿',
          timestamp: now,
          isComplete: false,
          notes: '待补充研发人员工资明细'
        }
      ]
    },
    {
      id: 'record-002',
      projectId: 'proj-002',
      clientId: 'client-002',
      taxPeriod: '2024Q1',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: now,
      currentStage: WorkflowStage.CONFIRMATION_IN_PROGRESS,
      status: RecordStatus.PENDING_CONFIRMATION,
      draftInfo: {
        taxConsultantId: 'tc-001',
        draftContent: {
          taxType: '增值税',
          taxableAmount: 8000000,
          taxAmount: 1040000,
          applicablePolicies: [
            {
              id: 'pol-003',
              name: '增值税暂行条例',
              code: 'VAT-2024',
              effectiveDate: new Date('2024-01-01'),
              description: '增值税基本法规'
            }
          ],
          specialAdjustments: [
            {
              id: 'adj-002',
              type: 'decrease',
              amount: 200000,
              reason: '进项税额转出',
              policyBasis: '增值税暂行条例'
            }
          ],
          riskNotes: '注意进项税额抵扣的合规性',
          calculations: [
            {
              id: 'calc-002',
              description: '应纳税额计算',
              formula: '销项税额 - 进项税额 + 进项转出',
              inputs: { outputTax: 1040000, inputTax: 800000, transferOut: 200000 },
              result: 440000
            }
          ],
          conclusions: [
            {
              id: 'conc-002',
              content: '本期应纳增值税44万元',
              policyBasis: '增值税暂行条例',
              confidence: 'high'
            }
          ],
          sourceDocuments: []
        },
        sourceDocuments: [],
        calculations: [],
        conclusions: [],
        attachments: [],
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: now
      },
      confirmationInfo: {
        clientFinanceId: 'cf-002',
        requiredMaterials: [
          {
            id: 'mat-003',
            name: '增值税专用发票',
            description: '本期取得的增值税专用发票抵扣联',
            required: true,
            source: 'client',
            status: 'provided',
            providedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
          },
          {
            id: 'mat-004',
            name: '银行回单',
            description: '本期银行收款回单',
            required: true,
            source: 'client',
            status: 'pending'
          }
        ],
        materialsStatus: [
          { materialId: 'mat-003', status: 'provided', providedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
          { materialId: 'mat-004', status: 'pending' }
        ],
        confirmationStatus: 'in_progress',
        deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
      },
      returnHistory: [],
      supplementaryNotes: [],
      workflowHistory: [
        {
          eventType: 'DRAFT_CREATED',
          actorId: 'tc-001',
          actorRole: UserRole.TAX_CONSULTANT,
          timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          details: { taxType: '增值税' },
          newStage: WorkflowStage.DRAFT_CREATED
        },
        {
          eventType: 'DRAFT_SUBMITTED',
          actorId: 'tc-001',
          actorRole: UserRole.TAX_CONSULTANT,
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          details: {},
          previousStage: WorkflowStage.DRAFT_CREATED,
          newStage: WorkflowStage.AWAITING_CONFIRMATION
        }
      ],
      responsibilityTrace: [
        {
          stage: WorkflowStage.DRAFT_CREATED,
          responsibleRole: UserRole.TAX_CONSULTANT,
          responsibleUserId: 'tc-001',
          action: '创建增值税申报底稿',
          timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          isComplete: true
        }
      ]
    },
    {
      id: 'record-003',
      projectId: 'proj-001',
      clientId: 'client-001',
      taxPeriod: '2023',
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      currentStage: WorkflowStage.CONFIRMED,
      status: RecordStatus.COMPLETED,
      draftInfo: {
        taxConsultantId: 'tc-001',
        draftContent: {
          taxType: '企业所得税',
          taxableAmount: 4000000,
          taxAmount: 1000000,
          applicablePolicies: [],
          specialAdjustments: [],
          riskNotes: '',
          calculations: [],
          conclusions: [],
          sourceDocuments: []
        },
        sourceDocuments: [],
        calculations: [],
        conclusions: [],
        attachments: [],
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
      },
      confirmationInfo: {
        clientFinanceId: 'cf-001',
        requiredMaterials: [],
        materialsStatus: [],
        confirmationStatus: 'confirmed',
        confirmationResult: {
          isApproved: true,
          approvedItems: ['应纳税所得额', '税额计算', '研发费用加计扣除'],
          concerns: [],
          clientRepresentative: '陈财务',
          confirmedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
        },
        confirmedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        deadline: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)
      },
      returnHistory: [],
      supplementaryNotes: [],
      workflowHistory: [],
      responsibilityTrace: []
    }
  ];

  const todos: Todo[] = [];

  initializeData(users, clients, projects, records, todos);

  const todoService = new TodoService();
  todoService.generateTodosFromRecords();

  console.log('种子数据已加载:');
  console.log(`- 用户: ${users.length} 个`);
  console.log(`- 客户: ${clients.length} 个`);
  console.log(`- 项目: ${projects.length} 个`);
  console.log(`- 记录: ${records.length} 条`);
  console.log(`- 待办: ${require('./dataStore').getAllTodos().length} 条`);
}

createSeedData();
