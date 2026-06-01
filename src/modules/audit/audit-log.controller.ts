import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto } from './audit-log.dto';
import { AuditLog } from './audit-log.entity';
import { PaginatedResult } from '@/common/dto/pagination.dto';
import { Context, RequestContext } from '@/common/decorators/request-context.decorator';
import { ApiResponse as ApiResponseDto } from '@/common/dto/response.dto';

@ApiTags('审计日志')
@Controller('audit/logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: '分页查询审计日志' })
  @ApiResponse({ status: 200, description: '分页查询成功' })
  async query(
    @Query() dto: QueryAuditLogDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<PaginatedResult<AuditLog>>> {
    const data = await this.auditLogService.query(dto);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取审计日志详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '日志不存在' })
  async findById(
    @Param('id') id: string,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<AuditLog>> {
    const data = await this.auditLogService.findById(id);
    return ApiResponseDto.success(data, ctx.requestId);
  }
}
