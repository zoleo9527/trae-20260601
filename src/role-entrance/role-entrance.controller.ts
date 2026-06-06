import { Controller, Get } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArchiveService } from '../archive/archive.service';
import { ArchiveStatus, ContractStatus, UserRole } from '../common/enums';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { ContractService } from '../contract/contract.service';

@ApiTags('role-entrance')
@Controller('role-entrance')
export class RoleEntranceController {
  constructor(
    private readonly contractService: ContractService,
    private readonly archiveService: ArchiveService,
    private readonly store: InMemoryStore,
  ) {}

  @Get('talent-agent')
  @ApiOperation({ summary: '达人经纪工作台入口' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  talentAgentEntrance() {
    const contracts = this.contractService.findAll();
    const archives = this.archiveService.findAll();

    return {
      role: UserRole.TALENT_AGENT,
      welcome: '达人经纪工作台',
      quickActions: [
        { key: 'create_contract', label: '创建签约合同', path: '/contracts', method: 'POST' },
        { key: 'submit_review', label: '提交审核', path: '/contracts/:id/submit', method: 'POST' },
        { key: 'confirm_sign', label: '确认达人签约', path: '/contracts/:id/talent-sign', method: 'POST' },
        { key: 'create_archive', label: '创建档案', path: '/archives', method: 'POST' },
        { key: 'add_material', label: '添加档案材料', path: '/archives/:id/items', method: 'POST' },
      ],
      myTasks: {
        pendingContracts: contracts.filter(c => 
          c.status === ContractStatus.DRAFT || 
          c.status === ContractStatus.PENDING_TALENT_SIGN ||
          c.status === ContractStatus.REJECTED
        ),
        pendingArchives: archives.filter(a => 
          a.status === ArchiveStatus.PENDING || 
          a.status === ArchiveStatus.IN_PROGRESS ||
          a.status === ArchiveStatus.NEEDS_REVISION
        ),
      },
      stats: {
        totalTalents: this.store.getTalents().length,
        activeContracts: contracts.filter(c => c.status !== ContractStatus.CANCELLED && c.status !== ContractStatus.ARCHIVED).length,
        archivedCount: archives.filter(a => a.status === ArchiveStatus.COMPLETED).length,
      },
    };
  }

  @Get('business')
  @ApiOperation({ summary: '商务工作台入口' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  businessEntrance() {
    const contracts = this.contractService.findAll();
    const archives = this.archiveService.findAll();

    const allCooperations = archives.flatMap(a => a.brandCooperations);

    return {
      role: UserRole.BUSINESS,
      welcome: '商务工作台',
      quickActions: [
        { key: 'review_contract', label: '审核签约合同', path: '/contracts/:id/business-review', method: 'POST' },
        { key: 'add_brand', label: '添加品牌合作', path: '/archives/:id/brand-cooperations', method: 'POST' },
        { key: 'update_settlement', label: '更新结算状态', path: '/archives/:id/brand-cooperations/:cooperationId/settlement', method: 'PUT' },
      ],
      myTasks: {
        pendingReviews: contracts.filter(c => c.status === ContractStatus.PENDING_BUSINESS_REVIEW),
        pendingSettlements: allCooperations.filter(c => c.settlementStatus !== 'settled'),
        overdueCooperations: allCooperations.filter(c => {
          if (c.status !== 'completed') return false;
          if (c.settlementStatus === 'settled') return false;
          const endTime = new Date(c.endTime).getTime();
          const now = new Date().getTime();
          return (now - endTime) / (1000 * 60 * 60 * 24) > 7;
        }),
      },
      stats: {
        pendingReviewCount: contracts.filter(c => c.status === ContractStatus.PENDING_BUSINESS_REVIEW).length,
        totalBrands: new Set(allCooperations.map(c => c.brandName)).size,
        unsettledAmount: allCooperations.filter(c => c.settlementStatus !== 'settled').length,
      },
    };
  }

  @Get('director')
  @ApiOperation({ summary: '编导工作台入口' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  directorEntrance() {
    const archives = this.archiveService.findAll();
    const allScripts = archives.flatMap(a => a.scriptVersions);
    const allCooperations = archives.flatMap(a => a.brandCooperations);

    return {
      role: UserRole.DIRECTOR,
      welcome: '编导工作台',
      quickActions: [
        { key: 'add_script', label: '添加脚本版本', path: '/archives/:id/brand-cooperations/:cooperationId/scripts', method: 'POST' },
        { key: 'view_scripts', label: '查看脚本历史', path: '/archives/:id', method: 'GET' },
      ],
      myTasks: {
        activeCooperations: allCooperations.filter(c => c.status === 'in_progress'),
        recentScripts: allScripts.slice(-10).reverse(),
      },
      stats: {
        totalScripts: allScripts.length,
        activeProductions: allCooperations.filter(c => c.status === 'in_progress').length,
        uniqueTalents: new Set(allCooperations.map(c => archives.find(a => a.brandCooperations.includes(c))?.talentName)).size,
      },
    };
  }

  @Get('users')
  @ApiOperation({ summary: '获取所有测试用户（用于切换角色）' })
  getUsers() {
    return this.store.getUsers();
  }
}
