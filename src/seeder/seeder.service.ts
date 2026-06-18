
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { 
  Role, 
  VolunteerStatus, 
  RecruitmentStatus, 
  AuditType, 
  TargetType,
  ExceptionType,
  SeverityLevel,
  ExceptionStatus
} from '@prisma/client';

@Injectable()
export class SeederService {
  constructor(private prisma: PrismaService) {}

  async seed() {
    await this.seedUsers();
    await this.seedRecruitmentRecords();
    await this.seedVolunteers();
    await this.seedExceptions();
    await this.seedAuditRecords();
  }

  private async seedUsers() {
    const hashedPassword = await bcrypt.hash('123456', 10);

    const admin = await this.prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        name: '管理员',
        role: Role.ADMIN,
      },
    });

    const staff = await this.prisma.user.upsert({
      where: { username: 'staff' },
      update: {},
      create: {
        username: 'staff',
        password: hashedPassword,
        name: '工作人员',
        role: Role.STAFF,
      },
    });

    console.log('Users seeded:', { admin: admin.id, staff: staff.id });
  }

  private async seedRecruitmentRecords() {
    const admin = await this.prisma.user.findUnique({ where: { username: 'admin' } });

    const recruitment1 = await this.prisma.recruitmentRecord.upsert({
      where: { id: 'rec-001' },
      update: {},
      create: {
        id: 'rec-001',
        title: '社区环保志愿者招募',
        description: '招募社区环保志愿者，负责社区环境卫生维护、垃圾分类指导等工作',
        requirements: ['年满18周岁', '身体健康', '有责任心'],
        quota: 20,
        appliedCount: 15,
        status: RecruitmentStatus.ACTIVE,
        creatorId: admin.id,
      },
    });

    const recruitment2 = await this.prisma.recruitmentRecord.upsert({
      where: { id: 'rec-002' },
      update: {},
      create: {
        id: 'rec-002',
        title: '社区老年关怀志愿者',
        description: '为社区老年人提供陪伴、购物协助、健康关怀等服务',
        requirements: ['有耐心', '善于沟通', '有爱心'],
        quota: 15,
        appliedCount: 8,
        status: RecruitmentStatus.ACTIVE,
        creatorId: admin.id,
      },
    });

    const recruitment3 = await this.prisma.recruitmentRecord.upsert({
      where: { id: 'rec-003' },
      update: {},
      create: {
        id: 'rec-003',
        title: '社区活动策划志愿者',
        description: '策划和组织社区文化活动，丰富居民生活',
        requirements: ['有创意', '组织能力强', '团队合作'],
        quota: 10,
        appliedCount: 10,
        status: RecruitmentStatus.CLOSED,
        creatorId: admin.id,
      },
    });

    console.log('Recruitment records seeded:', { recruitment1, recruitment2, recruitment3 });
  }

  private async seedVolunteers() {
    const recruitment1 = await this.prisma.recruitmentRecord.findUnique({ where: { id: 'rec-001' } });
    const recruitment2 = await this.prisma.recruitmentRecord.findUnique({ where: { id: 'rec-002' } });

    const volunteers = [
      {
        id: 'vol-001',
        name: '张三',
        phone: '13800138001',
        email: 'zhangsan@example.com',
        idCard: '110101199001011234',
        address: '北京市朝阳区某某街道1号',
        education: '大学本科',
        skills: ['沟通能力', '团队协作'],
        status: VolunteerStatus.PENDING,
        applicationId: uuidv4(),
        recruitmentRecordId: recruitment1.id,
      },
      {
        id: 'vol-002',
        name: '李四',
        phone: '13800138002',
        email: 'lisi@example.com',
        idCard: '110101199102022345',
        address: '北京市海淀区某某街道2号',
        education: '大专',
        skills: ['电脑操作', '活动组织'],
        status: VolunteerStatus.AUDITING,
        applicationId: uuidv4(),
        recruitmentRecordId: recruitment1.id,
      },
      {
        id: 'vol-003',
        name: '王五',
        phone: '13800138003',
        email: 'wangwu@example.com',
        idCard: '110101198903033456',
        address: '北京市西城区某某街道3号',
        education: '硕士',
        skills: ['心理咨询', '外语'],
        status: VolunteerStatus.APPROVED,
        applicationId: uuidv4(),
        recruitmentRecordId: recruitment2.id,
      },
      {
        id: 'vol-004',
        name: '赵六',
        phone: '13800138004',
        email: 'zhaoliu@example.com',
        idCard: '110101199204044567',
        address: '北京市东城区某某街道4号',
        education: '高中',
        skills: ['体力劳动', '驾驶'],
        status: VolunteerStatus.REJECTED,
        applicationId: uuidv4(),
        recruitmentRecordId: recruitment1.id,
      },
      {
        id: 'vol-005',
        name: '钱七',
        phone: '13800138005',
        email: 'qianqi@example.com',
        idCard: '110101199305055678',
        address: '北京市丰台区某某街道5号',
        education: '大学本科',
        skills: ['摄影', '文案写作'],
        status: VolunteerStatus.PENDING,
        applicationId: uuidv4(),
        recruitmentRecordId: recruitment2.id,
      },
      {
        id: 'vol-006',
        name: '孙八',
        phone: '13800138006',
        email: 'sunba@example.com',
        idCard: '110101199406066789',
        address: '北京市石景山区某某街道6号',
        education: '大专',
        skills: ['音乐', '舞蹈'],
        status: VolunteerStatus.SUSPENDED,
        applicationId: uuidv4(),
        recruitmentRecordId: recruitment2.id,
      },
    ];

    for (const vol of volunteers) {
      await this.prisma.volunteer.upsert({
        where: { id: vol.id },
        update: {},
        create: vol,
      });
    }

    console.log('Volunteers seeded:', volunteers.length);
  }

  private async seedExceptions() {
    const admin = await this.prisma.user.findUnique({ where: { username: 'admin' } });
    const vol1 = await this.prisma.volunteer.findUnique({ where: { id: 'vol-001' } });
    const vol4 = await this.prisma.volunteer.findUnique({ where: { id: 'vol-004' } });
    const vol6 = await this.prisma.volunteer.findUnique({ where: { id: 'vol-006' } });
    const rec1 = await this.prisma.recruitmentRecord.findUnique({ where: { id: 'rec-001' } });

    const exceptions = [
      {
        id: 'exc-001',
        exceptionType: ExceptionType.DOCUMENT_MISSING,
        severity: SeverityLevel.MEDIUM,
        targetType: TargetType.VOLUNTEER,
        targetId: vol1.id,
        volunteerId: vol1.id,
        description: '志愿者张三未提交身份证复印件',
        status: ExceptionStatus.PENDING,
        resolverId: null,
        resolveComment: null,
        resolvedAt: null,
      },
      {
        id: 'exc-002',
        exceptionType: ExceptionType.INFORMATION_INCONSISTENT,
        severity: SeverityLevel.HIGH,
        targetType: TargetType.VOLUNTEER,
        targetId: vol4.id,
        volunteerId: vol4.id,
        description: '志愿者赵六提供的联系方式与身份证地址不一致',
        status: ExceptionStatus.PENDING,
        resolverId: null,
        resolveComment: null,
        resolvedAt: null,
      },
      {
        id: 'exc-003',
        exceptionType: ExceptionType.BACKGROUND_CHECK_FAILED,
        severity: SeverityLevel.CRITICAL,
        targetType: TargetType.VOLUNTEER,
        targetId: vol6.id,
        volunteerId: vol6.id,
        description: '志愿者孙八背景审查未通过',
        status: ExceptionStatus.PROCESSING,
        resolverId: admin.id,
        resolveComment: null,
        resolvedAt: null,
      },
      {
        id: 'exc-004',
        exceptionType: ExceptionType.COMPLIANCE_VIOLATION,
        severity: SeverityLevel.LOW,
        targetType: TargetType.RECRUITMENT,
        targetId: rec1.id,
        recruitmentId: rec1.id,
        description: '招募活动rec-001超期未完成',
        status: ExceptionStatus.RESOLVED,
        resolverId: admin.id,
        resolveComment: '已延期处理',
        resolvedAt: new Date(),
      },
    ];

    for (const exc of exceptions) {
      await this.prisma.exceptionLog.upsert({
        where: { id: exc.id },
        update: {},
        create: exc,
      });
    }

    console.log('Exceptions seeded:', exceptions.length);
  }

  private async seedAuditRecords() {
    const admin = await this.prisma.user.findUnique({ where: { username: 'admin' } });
    const staff = await this.prisma.user.findUnique({ where: { username: 'staff' } });
    const vol1 = await this.prisma.volunteer.findUnique({ where: { id: 'vol-001' } });
    const vol2 = await this.prisma.volunteer.findUnique({ where: { id: 'vol-002' } });
    const vol3 = await this.prisma.volunteer.findUnique({ where: { id: 'vol-003' } });
    const vol4 = await this.prisma.volunteer.findUnique({ where: { id: 'vol-004' } });
    const vol5 = await this.prisma.volunteer.findUnique({ where: { id: 'vol-005' } });
    const vol6 = await this.prisma.volunteer.findUnique({ where: { id: 'vol-006' } });
    const rec1 = await this.prisma.recruitmentRecord.findUnique({ where: { id: 'rec-001' } });
    const exc1 = await this.prisma.exceptionLog.findUnique({ where: { id: 'exc-001' } });

    const auditRecords = [
      {
        id: 'audit-001',
        auditType: AuditType.APPLICATION_SUBMITTED,
        targetType: TargetType.VOLUNTEER,
        targetId: vol1.id,
        previousStatus: null,
        newStatus: VolunteerStatus.PENDING,
        auditorId: staff.id,
        volunteerId: vol1.id,
        comment: '志愿者张三提交申请',
        createdAt: new Date(Date.now() - 3600000 * 24 * 3),
      },
      {
        id: 'audit-002',
        auditType: AuditType.APPLICATION_SUBMITTED,
        targetType: TargetType.VOLUNTEER,
        targetId: vol2.id,
        previousStatus: null,
        newStatus: VolunteerStatus.PENDING,
        auditorId: staff.id,
        volunteerId: vol2.id,
        comment: '志愿者李四提交申请',
        createdAt: new Date(Date.now() - 3600000 * 24 * 2),
      },
      {
        id: 'audit-003',
        auditType: AuditType.STATUS_CHANGED,
        targetType: TargetType.VOLUNTEER,
        targetId: vol2.id,
        previousStatus: VolunteerStatus.PENDING,
        newStatus: VolunteerStatus.AUDITING,
        auditorId: admin.id,
        volunteerId: vol2.id,
        comment: '开始审核',
        createdAt: new Date(Date.now() - 3600000 * 24),
      },
      {
        id: 'audit-004',
        auditType: AuditType.APPLICATION_SUBMITTED,
        targetType: TargetType.VOLUNTEER,
        targetId: vol3.id,
        previousStatus: null,
        newStatus: VolunteerStatus.PENDING,
        auditorId: staff.id,
        volunteerId: vol3.id,
        comment: '志愿者王五提交申请',
        createdAt: new Date(Date.now() - 3600000 * 48),
      },
      {
        id: 'audit-005',
        auditType: AuditType.AUDIT_PASSED,
        targetType: TargetType.VOLUNTEER,
        targetId: vol3.id,
        previousStatus: VolunteerStatus.PENDING,
        newStatus: VolunteerStatus.APPROVED,
        auditorId: admin.id,
        volunteerId: vol3.id,
        comment: '审核通过，符合条件',
        createdAt: new Date(Date.now() - 3600000 * 24),
      },
      {
        id: 'audit-006',
        auditType: AuditType.APPLICATION_SUBMITTED,
        targetType: TargetType.VOLUNTEER,
        targetId: vol4.id,
        previousStatus: null,
        newStatus: VolunteerStatus.PENDING,
        auditorId: staff.id,
        volunteerId: vol4.id,
        comment: '志愿者赵六提交申请',
        createdAt: new Date(Date.now() - 3600000 * 72),
      },
      {
        id: 'audit-007',
        auditType: AuditType.AUDIT_FAILED,
        targetType: TargetType.VOLUNTEER,
        targetId: vol4.id,
        previousStatus: VolunteerStatus.PENDING,
        newStatus: VolunteerStatus.REJECTED,
        auditorId: admin.id,
        volunteerId: vol4.id,
        comment: '审核未通过，信息不一致',
        createdAt: new Date(Date.now() - 3600000 * 48),
      },
      {
        id: 'audit-008',
        auditType: AuditType.APPLICATION_SUBMITTED,
        targetType: TargetType.VOLUNTEER,
        targetId: vol5.id,
        previousStatus: null,
        newStatus: VolunteerStatus.PENDING,
        auditorId: staff.id,
        volunteerId: vol5.id,
        comment: '志愿者钱七提交申请',
        createdAt: new Date(Date.now() - 3600000 * 6),
      },
      {
        id: 'audit-009',
        auditType: AuditType.STATUS_CHANGED,
        targetType: TargetType.VOLUNTEER,
        targetId: vol6.id,
        previousStatus: VolunteerStatus.APPROVED,
        newStatus: VolunteerStatus.SUSPENDED,
        auditorId: admin.id,
        volunteerId: vol6.id,
        comment: '因背景问题暂停服务',
        createdAt: new Date(Date.now() - 3600000 * 12),
      },
      {
        id: 'audit-010',
        auditType: AuditType.APPLICATION_SUBMITTED,
        targetType: TargetType.RECRUITMENT,
        targetId: rec1.id,
        previousStatus: null,
        newStatus: RecruitmentStatus.ACTIVE,
        auditorId: admin.id,
        recruitmentId: rec1.id,
        comment: '创建招募活动',
        createdAt: new Date(Date.now() - 3600000 * 72),
      },
      {
        id: 'audit-011',
        auditType: AuditType.EXCEPTION_RECORDED,
        targetType: TargetType.EXCEPTION,
        targetId: exc1.id,
        previousStatus: null,
        newStatus: ExceptionStatus.PENDING,
        auditorId: staff.id,
        exceptionId: exc1.id,
        comment: '记录异常：缺少身份证复印件',
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
    ];

    for (const audit of auditRecords) {
      await this.prisma.auditRecord.upsert({
        where: { id: audit.id },
        update: {},
        create: audit,
      });
    }

    console.log('Audit records seeded:', auditRecords.length);
  }
}
