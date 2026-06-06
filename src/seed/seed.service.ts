import { Injectable } from '@nestjs/common';
import { ArchiveService } from '../archive/archive.service';
import { UserRole } from '../common/enums';
import { User } from '../common/interfaces';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { ContractService } from '../contract/contract.service';
import { TalentService } from '../talent/talent.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly store: InMemoryStore,
    private readonly talentService: TalentService,
    private readonly contractService: ContractService,
    private readonly archiveService: ArchiveService,
  ) {}

  private createUser(id: string, name: string, role: UserRole, email: string): User {
    const user: User = { id, name, role, email, phone: '13800138000' };
    this.store.saveUser(user);
    return user;
  }

  async seed() {
    this.store.clearAll();

    const agentUser = this.createUser('agent-001', '李经纪', UserRole.TALENT_AGENT, 'li_jingji@mcn.com');
    const businessUser = this.createUser('business-001', '王商务', UserRole.BUSINESS, 'wang_shangwu@mcn.com');
    const directorUser = this.createUser('director-001', '张编导', UserRole.DIRECTOR, 'zhang_biandao@mcn.com');
    const adminUser = this.createUser('admin-001', '管理员', UserRole.ADMIN, 'admin@mcn.com');

    const talent1 = this.talentService.create(
      {
        name: '小美同学',
        realName: '李美琪',
        phone: '13912345678',
        idCard: '110101199501011234',
        email: 'xiaomei@example.com',
        platforms: [
          { platform: '抖音', accountId: 'douyin_xiaomei', accountName: '小美同学', followers: 1250000, avgViews: 500000, category: '美妆' },
          { platform: '小红书', accountId: 'xhs_xiaomei', accountName: '小美同学呀', followers: 800000, avgViews: 300000, category: '穿搭' },
        ],
        tags: ['美妆', '穿搭', '生活方式'],
        introduction: '专注美妆护肤分享，粉丝画像以18-30岁女性为主',
      },
      agentUser,
    );

    const talent2 = this.talentService.create(
      {
        name: '科技阿凯',
        realName: '张凯',
        phone: '13887654321',
        idCard: '310101199205055678',
        email: 'akai@example.com',
        platforms: [
          { platform: 'B站', accountId: 'bilibili_akai', accountName: '科技阿凯', followers: 2100000, avgViews: 800000, category: '数码科技' },
          { platform: 'YouTube', accountId: 'yt_akai', accountName: 'Tech Akai', followers: 500000, avgViews: 200000, category: '科技' },
        ],
        tags: ['数码', '科技测评', '极客'],
        introduction: '深度数码产品测评，专注科技前沿',
      },
      agentUser,
    );

    const talent3 = this.talentService.create(
      {
        name: '美食阿福',
        realName: '王福贵',
        phone: '13755667788',
        idCard: '440101199003037890',
        email: 'afu@example.com',
        platforms: [
          { platform: '抖音', accountId: 'douyin_afu', accountName: '美食阿福', followers: 3200000, avgViews: 1200000, category: '美食' },
        ],
        tags: ['美食', '探店', '家常菜'],
        introduction: '带你吃遍天下美食',
      },
      agentUser,
    );

    const contract1 = this.contractService.create(
      {
        talentId: talent1.id,
        terms: {
          contractType: 'exclusive',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2026-12-31'),
          revenueSplit: { talentPercent: 40, mcnPercent: 60 },
          cooperationScope: ['美妆', '时尚', '生活方式'],
          monthlyMinContent: 12,
          maxConcurrentBrands: 5,
        },
      },
      agentUser,
    );

    this.contractService.addRemark(
      contract1.id,
      '达人要求优先对接一线美妆品牌，拒绝三无产品合作',
      'business',
      true,
      agentUser,
    );

    this.contractService.addRemark(
      contract1.id,
      '合同已通过法务审核，无风险条款',
      'legal',
      true,
      agentUser,
    );

    const contract2 = this.contractService.create(
      {
        talentId: talent2.id,
        terms: {
          contractType: 'exclusive',
          startDate: new Date('2024-03-01'),
          endDate: new Date('2027-02-28'),
          revenueSplit: { talentPercent: 45, mcnPercent: 55 },
          cooperationScope: ['数码科技', '智能硬件', '互联网产品'],
          monthlyMinContent: 8,
          maxConcurrentBrands: 4,
        },
      },
      agentUser,
    );

    this.contractService.addRemark(
      contract2.id,
      '达人有自己的内容团队，脚本需要提前7天同步',
      'creative',
      true,
      agentUser,
    );

    const contract3 = this.contractService.create(
      {
        talentId: talent3.id,
        terms: {
          contractType: 'non-exclusive',
          startDate: new Date('2024-06-01'),
          endDate: new Date('2025-05-31'),
          revenueSplit: { talentPercent: 50, mcnPercent: 50 },
          cooperationScope: ['食品饮料', '餐饮', '厨具'],
          monthlyMinContent: 15,
          maxConcurrentBrands: 8,
        },
      },
      agentUser,
    );

    this.contractService.submitForReview(contract1.id, agentUser);
    this.contractService.businessReview(contract1.id, true, businessUser);
    this.contractService.talentSign(contract1.id, agentUser);

    const archive1 = this.archiveService.create(talent1.id, contract1.id, agentUser);
    
    this.archiveService.addItem(
      archive1.id,
      { type: 'id_card', name: '身份证正反面', verified: true, verifiedAt: new Date(), verifiedBy: agentUser.id },
      agentUser,
    );

    this.archiveService.addItem(
      archive1.id,
      { type: 'bank_info', name: '银行卡信息', verified: false },
      agentUser,
    );

    this.archiveService.addItem(
      archive1.id,
      { type: 'platform_auth', name: '抖音授权书', verified: true, verifiedAt: new Date(), verifiedBy: agentUser.id },
      agentUser,
    );

    this.archiveService.syncContractRemarks(archive1.id, agentUser);

    const cooperation1 = this.archiveService.addBrandCooperation(
      archive1.id,
      {
        brandName: '雅诗兰黛',
        productType: '护肤套装',
        startTime: new Date('2024-03-01'),
        endTime: new Date('2024-03-31'),
        status: 'completed',
        settlementStatus: 'settled',
        remark: '38女王节推广',
      },
      businessUser,
    );

    const cooperation2 = this.archiveService.addBrandCooperation(
      archive1.id,
      {
        brandName: 'Nike',
        productType: '运动鞋',
        startTime: new Date('2024-05-01'),
        endTime: new Date('2024-05-31'),
        status: 'completed',
        settlementStatus: 'unsettled',
        remark: '618预热',
      },
      businessUser,
    );

    const cooperationData = cooperation2.brandCooperations[cooperation2.brandCooperations.length - 1];

    this.archiveService.addScriptVersion(
      archive1.id,
      cooperationData.id,
      {
        version: 'v1.0',
        title: 'Nike Air Max 测评脚本',
        content: '开篇上脚展示 → 舒适度测评 → 搭配建议 → 购买链接引导',
        changeReason: '初始版本',
        status: 'approved',
        createdBy: directorUser.id,
      },
      directorUser,
    );

    this.archiveService.addScriptVersion(
      archive1.id,
      cooperationData.id,
      {
        version: 'v1.1',
        title: 'Nike Air Max 测评脚本（修改版）',
        content: '开篇产品开箱 → 上脚展示 → 舒适度测评 → 搭配建议 → 购买链接引导',
        changeReason: '品牌方要求增加开箱环节',
        status: 'modified',
        createdBy: directorUser.id,
      },
      directorUser,
    );

    this.archiveService.updateStatus(archive1.id, 'in_progress' as any, agentUser, '档案完善中');

    return {
      message: '种子数据初始化完成',
      data: {
        users: [agentUser, businessUser, directorUser, adminUser],
        talents: [talent1, talent2, talent3],
        contracts: [contract1, contract2, contract3],
        archives: [archive1],
      },
    };
  }

  clear() {
    this.store.clearAll();
    return { message: '所有数据已清空' };
  }
}
