import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: '系统管理员',
      role: '管理'
    }
  });

  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      password: userPassword,
      name: '张三',
      role: '一线'
    }
  });

  console.log('初始化用户:', { admin, user });

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const demand1 = await prisma.laborDemand.create({
    data: {
      demandNumber: `DEM-${dateStr}-0001`,
      companyName: '科技有限公司A',
      position: 'Java开发工程师',
      demandCount: 3,
      salaryRange: '15k-25k',
      workLocation: '北京',
      workPeriod: '6个月',
      requirements: '3年以上Java开发经验，熟悉SpringBoot',
      status: '待处理',
      createdById: admin.id
    }
  });

  await prisma.statusHistory.create({
    data: {
      entityType: 'LaborDemand',
      entityId: demand1.id,
      previousStatus: null,
      newStatus: '待处理',
      actionType: '创建',
      operatorId: admin.id,
      remark: '创建用工需求'
    }
  });

  const demand2 = await prisma.laborDemand.create({
    data: {
      demandNumber: `DEM-${dateStr}-0002`,
      companyName: '互联网公司B',
      position: '前端开发工程师',
      demandCount: 2,
      salaryRange: '12k-20k',
      workLocation: '上海',
      workPeriod: '3个月',
      requirements: '熟悉Vue或React',
      status: '匹配中',
      createdById: user.id
    }
  });

  await prisma.statusHistory.create({
    data: {
      entityType: 'LaborDemand',
      entityId: demand2.id,
      previousStatus: null,
      newStatus: '待处理',
      actionType: '创建',
      operatorId: user.id,
      remark: '创建用工需求'
    }
  });

  await prisma.statusHistory.create({
    data: {
      entityType: 'LaborDemand',
      entityId: demand2.id,
      previousStatus: '待处理',
      newStatus: '匹配中',
      actionType: '状态更新',
      operatorId: user.id,
      remark: '开始匹配候选人'
    }
  });

  const candidate1 = await prisma.candidate.create({
    data: {
      candidateNumber: `CAND-${dateStr}-0001`,
      name: '李四',
      phone: '13800138001',
      email: 'lisi@example.com',
      skills: 'Java,SpringBoot,MySQL',
      experience: '5年',
      education: '本科',
      expectedSalary: '20k',
      status: '待匹配',
      createdById: admin.id
    }
  });

  await prisma.statusHistory.create({
    data: {
      entityType: 'Candidate',
      entityId: candidate1.id,
      previousStatus: null,
      newStatus: '待匹配',
      actionType: '创建',
      operatorId: admin.id,
      remark: '创建候选人'
    }
  });

  const candidate2 = await prisma.candidate.create({
    data: {
      candidateNumber: `CAND-${dateStr}-0002`,
      name: '王五',
      phone: '13800138002',
      email: 'wangwu@example.com',
      skills: 'Vue,React,JavaScript',
      experience: '3年',
      education: '本科',
      expectedSalary: '18k',
      status: '匹配中',
      createdById: user.id
    }
  });

  await prisma.statusHistory.create({
    data: {
      entityType: 'Candidate',
      entityId: candidate2.id,
      previousStatus: null,
      newStatus: '待匹配',
      actionType: '创建',
      operatorId: user.id,
      remark: '创建候选人'
    }
  });

  await prisma.statusHistory.create({
    data: {
      entityType: 'Candidate',
      entityId: candidate2.id,
      previousStatus: '待匹配',
      newStatus: '匹配中',
      actionType: '状态更新',
      operatorId: user.id,
      remark: '开始匹配'
    }
  });

  const matching1 = await prisma.matchingRecord.create({
    data: {
      laborDemandId: demand2.id,
      candidateId: candidate2.id,
      matchType: '首次推荐',
      matchReason: '候选人技能与岗位需求匹配度较高',
      status: '待确认',
      createdById: user.id
    }
  });

  await prisma.statusHistory.create({
    data: {
      entityType: 'MatchingRecord',
      entityId: matching1.id,
      previousStatus: null,
      newStatus: '待确认',
      actionType: '创建',
      operatorId: user.id,
      remark: '首次推荐候选人'
    }
  });

  console.log('初始化数据完成');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
