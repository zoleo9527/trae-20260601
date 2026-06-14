import { PrismaClient, UserRole, BusinessStatus, DocumentIssue, ComplaintType, AuthorizationResult } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const [hallManager, accountManager, operationSupervisor] = await Promise.all([
    prisma.user.upsert({
      where: { username: 'hall01' },
      update: {},
      create: {
        username: 'hall01',
        password: hashedPassword,
        name: '张经理',
        role: UserRole.HALL_MANAGER,
      },
    }),
    prisma.user.upsert({
      where: { username: 'account01' },
      update: {},
      create: {
        username: 'account01',
        password: hashedPassword,
        name: '李经理',
        role: UserRole.ACCOUNT_MANAGER,
      },
    }),
    prisma.user.upsert({
      where: { username: 'supervisor01' },
      update: {},
      create: {
        username: 'supervisor01',
        password: hashedPassword,
        name: '王主管',
        role: UserRole.OPERATION_SUPERVISOR,
      },
    }),
  ]);

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { idCard: '110101199001011234' },
      update: {},
      create: {
        name: '陈先生',
        idCard: '110101199001011234',
        phone: '13800138001',
        customerLevel: 'VIP',
      },
    }),
    prisma.customer.upsert({
      where: { idCard: '110101198505055678' },
      update: {},
      create: {
        name: '刘女士',
        idCard: '110101198505055678',
        phone: '13900139002',
        customerLevel: '普通',
      },
    }),
    prisma.customer.upsert({
      where: { idCard: '110101197808089012' },
      update: {},
      create: {
        name: '王先生',
        idCard: '110101197808089012',
        phone: '13700137003',
        customerLevel: '钻石',
      },
    }),
  ]);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const case1 = await prisma.businessCase.create({
    data: {
      caseNumber: `CASE${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}0001`,
      businessType: '个人贷款申请',
      amount: 500000,
      status: BusinessStatus.PENDING_AUTHORIZATION,
      priority: 1,
      timeoutWarning: true,
      customerId: customers[0].id,
      assigneeId: accountManager.id,
      acceptorId: hallManager.id,
      acceptedAt: new Date(today.getTime() + 9 * 60 * 60 * 1000),
      processingAt: new Date(today.getTime() + 9 * 30 * 60 * 1000),
      authPendingAt: new Date(today.getTime() + 10 * 60 * 60 * 1000),
      documentCheck: {
        create: {
          idCardCopy: true,
          idCardOriginal: true,
          accountBook: false,
          proofOfAddress: true,
          incomeProof: false,
          issues: [DocumentIssue.MISSING_COPY],
          issueNote: '缺少户口簿复印件和收入证明',
          checkedById: hallManager.id,
          checkedAt: new Date(today.getTime() + 9 * 15 * 60 * 1000),
        },
      },
      dueDiligence: {
        create: {
          customerId: customers[0].id,
          riskLevel: '中',
          pepCheck: false,
          sanctionCheck: false,
          adverseMedia: false,
          sourceOfFunds: '工资收入',
          purpose: '购房贷款',
          needsSupplement: true,
          supplementNote: '需要补充近6个月银行流水',
          completedById: accountManager.id,
          completedAt: new Date(today.getTime() + 9 * 45 * 60 * 1000),
        },
      },
      timeline: {
        create: [
          {
            eventType: 'QUEUE',
            status: BusinessStatus.QUEUED,
            description: '客户取号排队',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() + 8 * 50 * 60 * 1000),
          },
          {
            eventType: 'ACCEPT',
            status: BusinessStatus.ACCEPTED,
            description: '大堂经理受理业务',
            note: '客户携带身份证原件及复印件',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000),
          },
          {
            eventType: 'DOCUMENT_CHECK',
            status: BusinessStatus.DOCUMENT_CHECKING,
            description: '资料检查发现缺页',
            note: '缺少户口簿复印件和收入证明，已告知客户',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() + 9 * 15 * 60 * 1000),
          },
          {
            eventType: 'DUE_DILIGENCE',
            status: BusinessStatus.DUE_DILIGENCE,
            description: '尽调审查需要补件',
            note: '需要补充近6个月银行流水',
            createdById: accountManager.id,
            createdAt: new Date(today.getTime() + 9 * 45 * 60 * 1000),
          },
          {
            eventType: 'PROCESSING',
            status: BusinessStatus.PROCESSING,
            description: '柜面业务处理中',
            note: '客户已补交资料，正在录入系统',
            createdById: accountManager.id,
            createdAt: new Date(today.getTime() + 10 * 60 * 60 * 1000),
          },
          {
            eventType: 'AUTH_REQUEST',
            status: BusinessStatus.PENDING_AUTHORIZATION,
            description: '提交授权复核',
            note: '贷款金额50万，需运营主管授权',
            createdById: accountManager.id,
            createdAt: new Date(today.getTime() + 10 * 30 * 60 * 1000),
          },
        ],
      },
    },
  });

  const case2 = await prisma.businessCase.create({
    data: {
      caseNumber: `CASE${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}0002`,
      businessType: '大额现金支取',
      amount: 300000,
      status: BusinessStatus.RETURNED,
      priority: 0,
      timeoutWarning: false,
      customerId: customers[1].id,
      assigneeId: accountManager.id,
      acceptorId: hallManager.id,
      acceptedAt: new Date(today.getTime() + 8 * 30 * 60 * 1000),
      processingAt: new Date(today.getTime() + 8 * 45 * 60 * 1000),
      documentCheck: {
        create: {
          idCardCopy: true,
          idCardOriginal: true,
          accountBook: true,
          proofOfAddress: true,
          incomeProof: true,
          issues: [],
          checkedById: hallManager.id,
          checkedAt: new Date(today.getTime() + 8 * 40 * 60 * 1000),
        },
      },
      dueDiligence: {
        create: {
          customerId: customers[1].id,
          riskLevel: '低',
          pepCheck: false,
          sanctionCheck: false,
          adverseMedia: false,
          sourceOfFunds: '存款',
          purpose: '日常支出',
          needsSupplement: false,
          completedById: accountManager.id,
          completedAt: new Date(today.getTime() + 9 * 60 * 60 * 1000),
        },
      },
      authReviews: {
        create: [
          {
            reviewLevel: 1,
            result: AuthorizationResult.RETURNED,
            reason: '请确认客户是否填写大额支取登记薄',
            note: '根据人行规定，单日累计支取5万以上需要登记',
            reviewedById: operationSupervisor.id,
            reviewRequestAt: new Date(today.getTime() + 9 * 15 * 60 * 1000),
            reviewedAt: new Date(today.getTime() + 9 * 30 * 60 * 1000),
          },
        ],
      },
      timeline: {
        create: [
          {
            eventType: 'QUEUE',
            status: BusinessStatus.QUEUED,
            description: '客户取号排队',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() + 8 * 20 * 60 * 1000),
          },
          {
            eventType: 'ACCEPT',
            status: BusinessStatus.ACCEPTED,
            description: '大堂经理受理业务',
            note: '客户要支取30万现金',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() + 8 * 30 * 60 * 1000),
          },
          {
            eventType: 'DOCUMENT_CHECK',
            status: BusinessStatus.DOCUMENT_CHECKING,
            description: '资料检查通过',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() + 8 * 40 * 60 * 1000),
          },
          {
            eventType: 'PROCESSING',
            status: BusinessStatus.PROCESSING,
            description: '柜面业务处理中',
            note: '正在录入支取信息',
            createdById: accountManager.id,
            createdAt: new Date(today.getTime() + 8 * 45 * 60 * 1000),
          },
          {
            eventType: 'AUTH_REQUEST',
            status: BusinessStatus.PENDING_AUTHORIZATION,
            description: '提交授权复核',
            note: '大额支取需要主管授权',
            createdById: accountManager.id,
            createdAt: new Date(today.getTime() + 9 * 15 * 60 * 1000),
          },
          {
            eventType: 'AUTH_RETURN',
            status: BusinessStatus.RETURNED,
            description: '授权被退回',
            note: '需要补充大额支取登记',
            createdById: operationSupervisor.id,
            createdAt: new Date(today.getTime() + 9 * 30 * 60 * 1000),
          },
        ],
      },
    },
  });

  const case3 = await prisma.businessCase.create({
    data: {
      caseNumber: `CASE${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}0003`,
      businessType: '个人账户开户',
      amount: null,
      status: BusinessStatus.TIMEOUT,
      priority: 0,
      timeoutWarning: true,
      customerId: customers[2].id,
      assigneeId: accountManager.id,
      acceptorId: hallManager.id,
      acceptedAt: new Date(today.getTime() - 2 * 60 * 60 * 1000),
      complaints: {
        create: [
          {
            type: ComplaintType.PROCESS_TIMEOUT,
            description: '开户业务等待时间过长，已超过30分钟',
            reportedById: hallManager.id,
          },
        ],
      },
      documentCheck: {
        create: {
          idCardCopy: true,
          idCardOriginal: true,
          accountBook: false,
          proofOfAddress: false,
          incomeProof: false,
          issues: [DocumentIssue.MISSING_COPY],
          issueNote: '缺少住址证明',
          checkedById: hallManager.id,
          checkedAt: new Date(today.getTime() - 1.5 * 60 * 60 * 1000),
        },
      },
      timeline: {
        create: [
          {
            eventType: 'QUEUE',
            status: BusinessStatus.QUEUED,
            description: '客户取号排队',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() - 2.5 * 60 * 60 * 1000),
          },
          {
            eventType: 'ACCEPT',
            status: BusinessStatus.ACCEPTED,
            description: '大堂经理受理业务',
            note: '钻石客户，优先办理',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() - 2 * 60 * 60 * 1000),
          },
          {
            eventType: 'DOCUMENT_CHECK',
            status: BusinessStatus.DOCUMENT_CHECKING,
            description: '资料检查发现缺页',
            note: '缺少住址证明，客户回去取',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() - 1.5 * 60 * 60 * 1000),
          },
          {
            eventType: 'TIMEOUT',
            status: BusinessStatus.TIMEOUT,
            description: '业务超时',
            note: '客户取资料未归，业务超时',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() - 30 * 60 * 1000),
          },
        ],
      },
    },
  });

  const case4 = await prisma.businessCase.create({
    data: {
      caseNumber: `CASE${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}0004`,
      businessType: '转账汇款',
      amount: 800000,
      status: BusinessStatus.PENDING_AUTHORIZATION,
      priority: 2,
      timeoutWarning: false,
      customerId: customers[2].id,
      assigneeId: accountManager.id,
      acceptorId: hallManager.id,
      acceptedAt: new Date(today.getTime() + 11 * 60 * 60 * 1000),
      processingAt: new Date(today.getTime() + 11 * 15 * 60 * 1000),
      authPendingAt: new Date(today.getTime() + 11 * 30 * 60 * 1000),
      documentCheck: {
        create: {
          idCardCopy: true,
          idCardOriginal: true,
          accountBook: true,
          proofOfAddress: true,
          incomeProof: true,
          issues: [],
          checkedById: hallManager.id,
          checkedAt: new Date(today.getTime() + 11 * 10 * 60 * 1000),
        },
      },
      dueDiligence: {
        create: {
          customerId: customers[2].id,
          riskLevel: '中',
          pepCheck: true,
          sanctionCheck: false,
          adverseMedia: false,
          sourceOfFunds: '投资理财',
          purpose: '向境外账户转账',
          needsSupplement: false,
          completedById: accountManager.id,
          completedAt: new Date(today.getTime() + 11 * 25 * 60 * 1000),
        },
      },
      authReviews: {
        create: [
          {
            reviewLevel: 1,
            result: AuthorizationResult.ESCALATED,
            reason: '跨境转账金额较大，需二级授权',
            note: '金额80万，跨境转账，建议升级授权级别',
            reviewedById: operationSupervisor.id,
            reviewRequestAt: new Date(today.getTime() + 11 * 30 * 60 * 1000),
            reviewedAt: new Date(today.getTime() + 11 * 45 * 60 * 1000),
          },
        ],
      },
      timeline: {
        create: [
          {
            eventType: 'QUEUE',
            status: BusinessStatus.QUEUED,
            description: '客户取号排队',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() + 10 * 50 * 60 * 1000),
          },
          {
            eventType: 'ACCEPT',
            status: BusinessStatus.ACCEPTED,
            description: '大堂经理受理业务',
            note: '钻石客户，跨境转账80万',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() + 11 * 60 * 60 * 1000),
          },
          {
            eventType: 'DOCUMENT_CHECK',
            status: BusinessStatus.DOCUMENT_CHECKING,
            description: '资料检查通过',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() + 11 * 10 * 60 * 1000),
          },
          {
            eventType: 'DUE_DILIGENCE',
            status: BusinessStatus.DUE_DILIGENCE,
            description: '尽调审查通过',
            note: 'PEP检查通过，资金来源清晰',
            createdById: accountManager.id,
            createdAt: new Date(today.getTime() + 11 * 25 * 60 * 1000),
          },
          {
            eventType: 'PROCESSING',
            status: BusinessStatus.PROCESSING,
            description: '柜面业务处理中',
            createdById: accountManager.id,
            createdAt: new Date(today.getTime() + 11 * 15 * 60 * 1000),
          },
          {
            eventType: 'AUTH_REQUEST',
            status: BusinessStatus.PENDING_AUTHORIZATION,
            description: '提交授权复核',
            note: '跨境大额转账，需要授权',
            createdById: accountManager.id,
            createdAt: new Date(today.getTime() + 11 * 30 * 60 * 1000),
          },
          {
            eventType: 'AUTH_ESCALATE',
            status: BusinessStatus.PENDING_AUTHORIZATION,
            description: '授权升级',
            note: '已升级到二级授权，等待上级主管复核',
            createdById: operationSupervisor.id,
            createdAt: new Date(today.getTime() + 11 * 45 * 60 * 1000),
          },
        ],
      },
    },
  });

  const case5 = await prisma.businessCase.create({
    data: {
      caseNumber: `CASE${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}0005`,
      businessType: '定期存款',
      amount: 100000,
      status: BusinessStatus.COMPLETED,
      priority: 0,
      timeoutWarning: false,
      customerId: customers[1].id,
      assigneeId: accountManager.id,
      acceptorId: hallManager.id,
      acceptedAt: new Date(today.getTime() + 7 * 30 * 60 * 1000),
      processingAt: new Date(today.getTime() + 7 * 40 * 60 * 1000),
      completedAt: new Date(today.getTime() + 8 * 10 * 60 * 1000),
      documentCheck: {
        create: {
          idCardCopy: true,
          idCardOriginal: true,
          accountBook: true,
          proofOfAddress: true,
          incomeProof: true,
          issues: [],
          checkedById: hallManager.id,
          checkedAt: new Date(today.getTime() + 7 * 35 * 60 * 1000),
        },
      },
      timeline: {
        create: [
          {
            eventType: 'QUEUE',
            status: BusinessStatus.QUEUED,
            description: '客户取号排队',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() + 7 * 20 * 60 * 1000),
          },
          {
            eventType: 'ACCEPT',
            status: BusinessStatus.ACCEPTED,
            description: '大堂经理受理业务',
            note: '一年定期存款10万',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() + 7 * 30 * 60 * 1000),
          },
          {
            eventType: 'DOCUMENT_CHECK',
            status: BusinessStatus.DOCUMENT_CHECKING,
            description: '资料检查通过',
            createdById: hallManager.id,
            createdAt: new Date(today.getTime() + 7 * 35 * 60 * 1000),
          },
          {
            eventType: 'PROCESSING',
            status: BusinessStatus.PROCESSING,
            description: '柜面业务处理中',
            createdById: accountManager.id,
            createdAt: new Date(today.getTime() + 7 * 40 * 60 * 1000),
          },
          {
            eventType: 'COMPLETE',
            status: BusinessStatus.COMPLETED,
            description: '业务完成',
            note: '存单已交付客户',
            createdById: accountManager.id,
            createdAt: new Date(today.getTime() + 8 * 10 * 60 * 1000),
          },
        ],
      },
    },
  });

  console.log('Seed data created successfully!');
  console.log('Users:');
  console.log('  大堂经理: hall01 / 123456');
  console.log('  客户经理: account01 / 123456');
  console.log('  运营主管: supervisor01 / 123456');
  console.log(`Created 5 business cases`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
