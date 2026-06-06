import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ContractStatus, UserRole } from '../common/enums';
import { User } from '../common/interfaces';
import { IdempotencyService } from '../common/services/idempotency.service';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { ContractService } from './contract.service';
import { ContractTerms } from './interfaces/contract.interface';

@ApiTags('contract')
@Controller('contracts')
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
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

  @Get()
  @ApiOperation({ summary: '获取签约合同列表' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  @ApiQuery({ name: 'status', required: false, enum: ContractStatus })
  findAll(@Query('status') status?: ContractStatus) {
    let contracts = this.contractService.findAll();
    if (status) {
      contracts = contracts.filter(c => c.status === status);
    }
    return contracts;
  }

  @Get('status-flow')
  @ApiOperation({ summary: '获取状态流转图' })
  getStatusFlow() {
    return this.contractService.getStatusFlow();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取签约合同详情' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  findOne(@Param('id') id: string) {
    return this.contractService.findOne(id);
  }

  @Get('talent/:talentId')
  @ApiOperation({ summary: '获取达人的所有签约合同' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  findByTalent(@Param('talentId') talentId: string) {
    return this.contractService.findByTalent(talentId);
  }

  @Post()
  @ApiOperation({ summary: '创建签约合同（达人经纪入口）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() data: { talentId: string; terms: ContractTerms; requestId?: string },
    @Headers('x-user-id') userId: string,
  ) {
    const operator = this.getOperator(userId);
    
    if (data.requestId) {
      const { result, isDuplicate } = await this.idempotencyService.processRequest(
        data.requestId,
        'contract',
        undefined,
        () => Promise.resolve(this.contractService.create({ talentId: data.talentId, terms: data.terms }, operator)),
      );
      return { data: result, isDuplicate };
    }
    
    return this.contractService.create({ talentId: data.talentId, terms: data.terms }, operator);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交审核（达人经纪入口）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  submitForReview(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.contractService.submitForReview(id, this.getOperator(userId));
  }

  @Post(':id/business-review')
  @ApiOperation({ summary: '商务审核（商务入口）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  businessReview(
    @Param('id') id: string,
    @Body() data: { approved: boolean; reason?: string; requestId?: string },
    @Headers('x-user-id') userId: string,
  ) {
    const operator = this.getOperator(userId);
    return this.contractService.businessReview(id, data.approved, operator, data.reason);
  }

  @Post(':id/talent-sign')
  @ApiOperation({ summary: '确认达人签约（达人经纪入口）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  talentSign(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.contractService.talentSign(id, this.getOperator(userId));
  }

  @Post(':id/archive')
  @ApiOperation({ summary: '归档合同（达人经纪入口）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  archive(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.contractService.archive(id, this.getOperator(userId));
  }

  @Post(':id/remarks')
  @ApiOperation({ summary: '添加备注（可同步到档案）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  addRemark(
    @Param('id') id: string,
    @Body() data: { content: string; category: 'business' | 'legal' | 'creative' | 'other'; isSharedToArchive: boolean },
    @Headers('x-user-id') userId: string,
  ) {
    return this.contractService.addRemark(id, data.content, data.category, data.isSharedToArchive, this.getOperator(userId));
  }

  @Get(':id/shared-remarks')
  @ApiOperation({ summary: '获取同步到档案的备注' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  getSharedRemarks(@Param('id') id: string) {
    return this.contractService.getSharedRemarks(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: '查看签约流程操作日志' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  getLogs(@Param('id') id: string) {
    return this.contractService.getOperationLogs(id);
  }

  @Post(':id/trigger-exception')
  @ApiOperation({ summary: '触发异常场景测试（退回/冲突/逾期）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  triggerException(
    @Param('id') id: string,
    @Body() data: { type: 'reject' | 'conflict' | 'overdue' },
    @Headers('x-user-id') userId: string,
  ) {
    return this.contractService.triggerException(id, data.type, this.getOperator(userId));
  }
}
