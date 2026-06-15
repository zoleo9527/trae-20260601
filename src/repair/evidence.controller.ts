import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EvidenceService } from './evidence.service';
import {
  CreatePartRequestDto,
  ConfirmPartArrivalDto,
} from './dto/part-request.dto';
import { CreateQualityCheckDto } from './dto/quality-check.dto';
import { CreateAttachmentDto } from './dto/attachment.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ResponseTransformInterceptor } from '../common/interceptors/response.interceptor';

@ApiTags('维修证据（备件/质检/附件）')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ResponseTransformInterceptor)
@Controller('repair')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post(':orderId/part-request')
  @Roles(UserRole.TECHNICIAN, UserRole.MANAGER)
  @ApiParam({ name: 'orderId', description: '工单ID' })
  @ApiOperation({
    summary: '申请备件（维修师/店长）',
    description: '结构化备件申请：含名称、型号、数量、预估费用、原因；自动进入待备件状态',
  })
  async createPartRequest(
    @Param('orderId') orderId: string,
    @Body() dto: CreatePartRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.evidenceService.createPartRequest(orderId, dto, user);
  }

  @Patch('part-request/:id/order')
  @Roles(UserRole.RECEPTIONIST, UserRole.MANAGER)
  @ApiParam({ name: 'id', description: '备件申请ID' })
  @ApiOperation({
    summary: '标记备件已下单（前台/店长）',
    description: '前台确认已发起采购，状态变为已下单',
  })
  async orderPart(@Param('id') id: string, @CurrentUser() user: User) {
    return this.evidenceService.orderPart(id, user);
  }

  @Patch('part-request/:id/arrive')
  @Roles(UserRole.RECEPTIONIST, UserRole.MANAGER)
  @ApiParam({ name: 'id', description: '备件申请ID' })
  @ApiOperation({
    summary: '确认备件到货（前台/店长）',
    description: '前台确认到货；如该工单所有备件均已到，自动从待备件流转回维修中',
  })
  async confirmArrival(
    @Param('id') id: string,
    @Body() dto: ConfirmPartArrivalDto,
    @CurrentUser() user: User,
  ) {
    return this.evidenceService.confirmPartArrival(id, dto, user);
  }

  @Get(':orderId/part-requests')
  @ApiParam({ name: 'orderId', description: '工单ID' })
  @ApiOperation({ summary: '查询工单的备件申请历史' })
  async listPartRequests(@Param('orderId') orderId: string) {
    return this.evidenceService.listPartRequests(orderId);
  }

  @Post(':orderId/quality-check')
  @Roles(UserRole.RECEPTIONIST, UserRole.MANAGER)
  @ApiParam({ name: 'orderId', description: '工单ID' })
  @ApiOperation({
    summary: '提交结构化质检记录（前台/店长）',
    description: '10项检查点逐一把关；通过→待取机，不通过→退回维修中；每次质检记录都保留可回看',
  })
  async createQualityCheck(
    @Param('orderId') orderId: string,
    @Body() dto: CreateQualityCheckDto,
    @CurrentUser() user: User,
  ) {
    return this.evidenceService.createQualityCheck(orderId, dto, user);
  }

  @Get(':orderId/quality-checks')
  @ApiParam({ name: 'orderId', description: '工单ID' })
  @ApiOperation({ summary: '查询工单的全部质检记录（含多轮）' })
  async listQualityChecks(@Param('orderId') orderId: string) {
    return this.evidenceService.listQualityChecks(orderId);
  }

  @Post(':orderId/attachments')
  @ApiParam({ name: 'orderId', description: '工单ID' })
  @ApiOperation({
    summary: '上传附件/照片',
    description: '分类：诊断照片/维修前后对比/备件实物/质检照片/签名等；所有照片永久留痕可回看',
  })
  async uploadAttachment(
    @Param('orderId') orderId: string,
    @Body() dto: CreateAttachmentDto,
    @CurrentUser() user: User,
  ) {
    return this.evidenceService.uploadAttachment(orderId, dto, user);
  }

  @Get(':orderId/attachments')
  @ApiParam({ name: 'orderId', description: '工单ID' })
  @ApiOperation({ summary: '查询工单的全部附件照片，可按类型过滤' })
  async listAttachments(
    @Param('orderId') orderId: string,
    @Query('type') type?: string,
  ) {
    return this.evidenceService.listAttachments(orderId, type);
  }

  @Delete('attachments/:id')
  @ApiParam({ name: 'id', description: '附件ID' })
  @ApiOperation({ summary: '删除附件（仅上传者本人或店长）' })
  async deleteAttachment(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.evidenceService.deleteAttachment(id, user);
  }

  @Get(':orderId/evidence')
  @ApiParam({ name: 'orderId', description: '工单ID' })
  @ApiOperation({
    summary: '获取工单全部证据链',
    description: '一次性返回：备件申请记录 + 质检记录 + 附件照片，用于详情页或卡住分析回看',
  })
  async getEvidence(@Param('orderId') orderId: string) {
    return this.evidenceService.getOrderEvidence(orderId);
  }
}
