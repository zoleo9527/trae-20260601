import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransferService, Operator } from './transfer.service';
import {
  CreateTransferDto,
  UpdateTransferDto,
  TransferActionDto,
  BatchApproveDto,
  QueryTransferDto,
  BatchApproveResultDto,
} from './dto';
import { TransferOrder } from './entities/transfer-order.entity';
import { TransferAction, TransferStatus } from './enums';
import { Context, CurrentUser, RequestContext } from '../../common/decorators/request-context.decorator';
import { ApiResponse as ApiResponseDto } from '../../common/dto/response.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@ApiTags('调拨管理')
@Controller('transfers')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  @ApiOperation({ summary: '创建调拨单' })
  @ApiResponse({ status: 201, description: '创建成功', type: TransferOrder })
  async create(
    @Body() createTransferDto: CreateTransferDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<TransferOrder>> {
    const operator: Operator = {
      id: ctx.userId,
      name: ctx.userName,
      role: ctx.userRole,
    };
    const data = await this.transferService.create(createTransferDto, operator);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Get()
  @ApiOperation({ summary: '分页查询调拨单列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(
    @Query() query: QueryTransferDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<PaginatedResult<TransferOrder>>> {
    const data = await this.transferService.findAll(query);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Get('statistics')
  @ApiOperation({ summary: '按状态统计调拨单数量' })
  @ApiResponse({ status: 200, description: '统计成功' })
  async getStatistics(
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<Record<TransferStatus, number>>> {
    const data = await this.transferService.getStatistics();
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Post('batch-approve')
  @ApiOperation({ summary: '批量审批（仅经理）' })
  @ApiResponse({ status: 200, description: '批量审批完成', type: BatchApproveResultDto })
  async batchApprove(
    @Body() dto: BatchApproveDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<BatchApproveResultDto>> {
    const operator: Operator = {
      id: ctx.userId,
      name: ctx.userName,
      role: ctx.userRole,
    };
    const data = await this.transferService.batchApprove(dto, operator);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Get(':id/allowed-actions')
  @ApiOperation({ summary: '获取当前状态允许的操作' })
  @ApiResponse({ status: 200, description: '查询成功', type: [String] })
  async getAllowedActions(
    @Param('id') id: string,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<TransferAction[]>> {
    const operator: Operator = {
      id: ctx.userId,
      name: ctx.userName,
      role: ctx.userRole,
    };
    const data = await this.transferService.getAllowedActions(id, operator);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取调拨单详情' })
  @ApiResponse({ status: 200, description: '查询成功', type: TransferOrder })
  async findOne(
    @Param('id') id: string,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<TransferOrder>> {
    const data = await this.transferService.findOne(id);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新调拨单（仅草稿状态）' })
  @ApiResponse({ status: 200, description: '更新成功', type: TransferOrder })
  async update(
    @Param('id') id: string,
    @Body() updateTransferDto: UpdateTransferDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<TransferOrder>> {
    const data = await this.transferService.update(id, updateTransferDto);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除调拨单（仅草稿状态）' })
  @ApiResponse({ status: 204, description: '删除成功' })
  remove(@Param('id') id: string): Promise<void> {
    return this.transferService.remove(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交调拨单' })
  @ApiResponse({ status: 200, description: '提交成功', type: TransferOrder })
  async submit(
    @Param('id') id: string,
    @Body() dto: TransferActionDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<TransferOrder>> {
    const operator: Operator = {
      id: ctx.userId,
      name: ctx.userName,
      role: ctx.userRole,
    };
    const data = await this.transferService.submit(id, dto, operator);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '审批通过（仅经理）' })
  @ApiResponse({ status: 200, description: '审批成功', type: TransferOrder })
  async approve(
    @Param('id') id: string,
    @Body() dto: TransferActionDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<TransferOrder>> {
    const operator: Operator = {
      id: ctx.userId,
      name: ctx.userName,
      role: ctx.userRole,
    };
    const data = await this.transferService.approve(id, dto, operator);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '审批拒绝（仅经理）' })
  @ApiResponse({ status: 200, description: '拒绝成功', type: TransferOrder })
  async reject(
    @Param('id') id: string,
    @Body() dto: TransferActionDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<TransferOrder>> {
    const operator: Operator = {
      id: ctx.userId,
      name: ctx.userName,
      role: ctx.userRole,
    };
    const data = await this.transferService.reject(id, dto, operator);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成调拨（更新库存）' })
  @ApiResponse({ status: 200, description: '完成成功', type: TransferOrder })
  async complete(
    @Param('id') id: string,
    @Body() dto: TransferActionDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<TransferOrder>> {
    const operator: Operator = {
      id: ctx.userId,
      name: ctx.userName,
      role: ctx.userRole,
    };
    const data = await this.transferService.complete(id, dto, operator);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消调拨单' })
  @ApiResponse({ status: 200, description: '取消成功', type: TransferOrder })
  async cancel(
    @Param('id') id: string,
    @Body() dto: TransferActionDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<TransferOrder>> {
    const operator: Operator = {
      id: ctx.userId,
      name: ctx.userName,
      role: ctx.userRole,
    };
    const data = await this.transferService.cancel(id, dto, operator);
    return ApiResponseDto.success(data, ctx.requestId);
  }
}
