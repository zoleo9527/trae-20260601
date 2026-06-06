import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ArchiveStatus, UserRole } from '../common/enums';
import { User } from '../common/interfaces';
import { IdempotencyService } from '../common/services/idempotency.service';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { ArchiveService } from './archive.service';
import { ArchiveItem, BrandCooperation, ScriptVersion } from './interfaces/archive.interface';

@ApiTags('archive')
@Controller('archives')
export class ArchiveController {
  constructor(
    private readonly archiveService: ArchiveService,
    private readonly store: InMemoryStore,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  private getOperator(@Headers('x-user-id') userId: string): User {
    return this.store.getUser(userId) || {
      id: 'default-agent',
      name: '达人经纪',
      role: UserRole.TALENT_AGENT,
      email: 'agent@example.com',
    };
  }

  @Get('status-flow')
  @ApiOperation({ summary: '获取档案状态流转图' })
  getStatusFlow() {
    return this.archiveService.getStatusFlow();
  }

  @Get()
  @ApiOperation({ summary: '获取档案列表（达人经纪入口）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  @ApiQuery({ name: 'status', required: false, enum: ArchiveStatus })
  findAll(@Query('status') status?: ArchiveStatus) {
    let archives = this.archiveService.findAll();
    if (status) {
      archives = archives.filter(a => a.status === status);
    }
    return archives;
  }

  @Get(':id')
  @ApiOperation({ summary: '获取档案详情' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  findOne(@Param('id') id: string) {
    return this.archiveService.findOne(id);
  }

  @Get('talent/:talentId')
  @ApiOperation({ summary: '获取达人档案' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  findByTalent(@Param('talentId') talentId: string) {
    return this.archiveService.findByTalent(talentId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: '档案历史回看（完整时间线）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  getHistory(@Param('id') id: string) {
    return this.archiveService.getHistoryView(id);
  }

  @Post()
  @ApiOperation({ summary: '创建档案（达人经纪入口）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() data: { talentId: string; contractId: string; requestId?: string },
    @Headers('x-user-id') userId: string,
  ) {
    const operator = this.getOperator(userId);
    
    if (data.requestId) {
      const { result, isDuplicate } = await this.idempotencyService.processRequest(
        data.requestId,
        'archive',
        undefined,
        () => Promise.resolve(this.archiveService.create(data.talentId, data.contractId, operator)),
      );
      return { data: result, isDuplicate };
    }
    
    return this.archiveService.create(data.talentId, data.contractId, operator);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新档案状态（达人经纪入口）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  updateStatus(
    @Param('id') id: string,
    @Body() data: { status: ArchiveStatus; remark?: string },
    @Headers('x-user-id') userId: string,
  ) {
    return this.archiveService.updateStatus(id, data.status, this.getOperator(userId), data.remark);
  }

  @Post(':id/items')
  @ApiOperation({ summary: '添加档案材料（达人经纪入口）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  addItem(
    @Param('id') id: string,
    @Body() item: Omit<ArchiveItem, 'id'>,
    @Headers('x-user-id') userId: string,
  ) {
    return this.archiveService.addItem(id, item, this.getOperator(userId));
  }

  @Put(':id/items/:itemId/verify')
  @ApiOperation({ summary: '审核档案材料' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  verifyItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() data: { verified: boolean },
    @Headers('x-user-id') userId: string,
  ) {
    return this.archiveService.verifyItem(id, itemId, data.verified, this.getOperator(userId));
  }

  @Post(':id/sync-remarks')
  @ApiOperation({ summary: '同步签约备注到档案' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  syncContractRemarks(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.archiveService.syncContractRemarks(id, this.getOperator(userId));
  }

  @Post(':id/brand-cooperations')
  @ApiOperation({ summary: '添加品牌合作（商务入口）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  addBrandCooperation(
    @Param('id') id: string,
    @Body() cooperation: Omit<BrandCooperation, 'id'>,
    @Headers('x-user-id') userId: string,
  ) {
    return this.archiveService.addBrandCooperation(id, cooperation, this.getOperator(userId));
  }

  @Post(':id/brand-cooperations/:cooperationId/scripts')
  @ApiOperation({ summary: '添加脚本版本（编导入口）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  addScriptVersion(
    @Param('id') id: string,
    @Param('cooperationId') cooperationId: string,
    @Body() script: Omit<ScriptVersion, 'id' | 'brandCooperationId' | 'isLatest' | 'createdAt'>,
    @Headers('x-user-id') userId: string,
  ) {
    return this.archiveService.addScriptVersion(id, cooperationId, script, this.getOperator(userId));
  }

  @Put(':id/brand-cooperations/:cooperationId/settlement')
  @ApiOperation({ summary: '更新结算状态（商务入口）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  updateSettlementStatus(
    @Param('id') id: string,
    @Param('cooperationId') cooperationId: string,
    @Body() data: { status: BrandCooperation['settlementStatus'] },
    @Headers('x-user-id') userId: string,
  ) {
    return this.archiveService.updateSettlementStatus(id, cooperationId, data.status, this.getOperator(userId));
  }

  @Get(':id/check-overdue')
  @ApiOperation({ summary: '检查逾期未结算的合作' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  checkOverdue(@Param('id') id: string) {
    return this.archiveService.checkOverdueCooperations(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: '查看档案操作日志' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  getLogs(@Param('id') id: string) {
    return this.archiveService.getOperationLogs(id);
  }
}
