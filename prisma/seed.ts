import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      id: 'user-001',
      username: 'specialist1',
      name: '张专员',
      role: 'project_specialist',
      passwordHash: '$2a$10$dummyHashForDemo1',
    },
    {
      id: 'user-002',
      username: 'secretary1',
      name: '李秘书',
      role: 'review_secretary',
      passwordHash: '$2a$10$dummyHashForDemo2',
    },
    {
      id: 'user-003',
      username: 'finance1',
      name: '王财务',
      role: 'finance',
      passwordHash: '$2a$10$dummyHashForDemo3',
    },
    {
      id: 'user-004',
      username: 'admin1',
      name: '系统管理员',
      role: 'admin',
      passwordHash: '$2a$10$dummyHashForDemo4',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }

  const registrations = [
    {
      id: 'reg-001',
      projectId: 'proj-001',
      projectName: '某市政府办公楼建设项目',
      bidderId: 'bidder-001',
      bidderName: '某建设集团有限公司',
      status: 'pending',
      currentHandlerId: 'user-001',
      currentHandlerRole: 'project_specialist',
    },
    {
      id: 'reg-002',
      projectId: 'proj-002',
      projectName: '某学校教学楼改造项目',
      bidderId: 'bidder-002',
      bidderName: '某建筑工程公司',
      status: 'reviewing',
      currentHandlerId: 'user-002',
      currentHandlerRole: 'review_secretary',
    },
    {
      id: 'reg-003',
      projectId: 'proj-003',
      projectName: '某医院门诊楼扩建项目',
      bidderId: 'bidder-003',
      bidderName: '某市政工程公司',
      status: 'approved',
      currentHandlerId: 'user-003',
      currentHandlerRole: 'finance',
    },
    {
      id: 'reg-004',
      projectId: 'proj-004',
      projectName: '某公园景观改造项目',
      bidderId: 'bidder-004',
      bidderName: '某园林工程公司',
      status: 'rejected',
      currentHandlerId: 'user-001',
      currentHandlerRole: 'project_specialist',
    },
    {
      id: 'reg-005',
      projectId: 'proj-005',
      projectName: '某道路拓宽工程',
      bidderId: 'bidder-005',
      bidderName: '某交通建设公司',
      status: 'completed',
      currentHandlerId: 'user-003',
      currentHandlerRole: 'finance',
    },
  ];

  for (const reg of registrations) {
    await prisma.bidRegistration.upsert({
      where: { id: reg.id },
      update: reg,
      create: reg,
    });
  }

  const clarifications = [
    {
      id: 'clar-001',
      registrationId: 'reg-001',
      question: '关于招标文件第3.2条款的技术要求，请问是否可以采用替代方案？',
      answer: '经评审委员会研究，可以采用替代方案，但需提供同等性能的技术证明材料。',
      status: 'published',
      createdById: 'user-001',
      reviewedById: 'user-002',
      version: 1,
    },
    {
      id: 'clar-002',
      registrationId: 'reg-002',
      question: '关于工期要求，请问是否可以分阶段施工？',
      answer: null,
      status: 'draft',
      createdById: 'user-001',
      version: 1,
    },
  ];

  for (const clar of clarifications) {
    await prisma.clarification.upsert({
      where: { id: clar.id },
      update: clar,
      create: clar,
    });
  }

  const rejectionReasons = [
    {
      id: 'rej-001',
      registrationId: 'reg-004',
      reason: '资质证明材料不完整',
      supplementaryNote: '缺少安全生产许可证复印件，请补充完整后重新提交。',
      rejectedById: 'user-001',
    },
  ];

  for (const rej of rejectionReasons) {
    await prisma.rejectionReason.upsert({
      where: { id: rej.id },
      update: rej,
      create: rej,
    });
  }

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });