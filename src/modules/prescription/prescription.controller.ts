import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Context, RequestContext } from '../../common/decorators/request-context.decorator';
import { ApiResponse as ApiResponseDto } from '../../common/dto/response.dto';
import { Prescription } from './prescription.entity';
import { PrescriptionAction } from './prescription.enum';
import { PrescriptionService } from './prescription.service';
import {
  CreatePrescriptionDto,
  UpdatePrescriptionDto,
  SubmitPrescriptionDto,
  ReviewPrescriptionDto,
  ApprovePrescriptionDto,
  RejectPrescriptionDto,
  SupplementPrescriptionDto,
  VoidPrescriptionDto,
  PrescriptionQueryDto,
} from './prescription.dto';

@ApiTags('处方管理')
@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post()
  @ApiOperation({ summary: '创建处方' })
  @ApiResponse({ status: 201, description: '创建成功', type: Prescription })
  async create(
    @Body() dto: CreatePrescriptionDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<Prescription>> {
    const data = await this.prescriptionService.create(dto);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Get()
  @ApiOperation({ summary: '分页查询处方列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(
    @Query() query: PrescriptionQueryDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<any>> {
    const data = await this.prescriptionService.findAll(query);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Get(':id/allowed-actions')
  @ApiOperation({ summary: '获取当前处方可执行操作' })
  @ApiParam({ name: 'id', description: '处方ID' })
  @ApiResponse({ status: 200, description: '查询成功', type: [String] })
  async getAllowedActions(
    @Param('id') id: string,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<PrescriptionAction[]>> {
    const data = await this.prescriptionService.getAllowedActions(id, ctx);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取处方详情' })
  @ApiParam({ name: 'id', description: '处方ID' })
  @ApiResponse({ status: 200, description: '查询成功', type: Prescription })
  async findOne(
    @Param('id') id: string,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<Prescription>> {
    const data = await this.prescriptionService.findOne(id);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新处方（仅草稿状态）' })
  @ApiParam({ name: 'id', description: '处方ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: Prescription })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePrescriptionDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<Prescription>> {
    const data = await this.prescriptionService.update(id, dto);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除处方（仅草稿状态）' })
  @ApiParam({ name: 'id', description: '处方ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async remove(
    @Param('id') id: string,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<null>> {
    await this.prescriptionService.remove(id);
    return ApiResponseDto.success(null, ctx.requestId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交处方复核' })
  @ApiParam({ name: 'id', description: '处方ID' })
  @ApiResponse({ status: 200, description: '提交成功', type: Prescription })
  async submit(
    @Param('id') id: string,
    @Body() dto: SubmitPrescriptionDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<Prescription>> {
    const data = await this.prescriptionService.submit(id, dto, ctx);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Post(':id/review')
  @ApiOperation({ summary: '开始审核处方' })
  @ApiParam({ name: 'id', description: '处方ID' })
  @ApiResponse({ status: 200, description: '审核中', type: Prescription })
  async review(
    @Param('id') id: string,
    @Body() dto: ReviewPrescriptionDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<Prescription>> {
    const data = await this.prescriptionService.review(id, dto, ctx);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '审核通过处方' })
  @ApiParam({ name: 'id', description: '处方ID' })
  @ApiResponse({ status: 200, description: '通过成功', type: Prescription })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApprovePrescriptionDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<Prescription>> {
    const data = await this.prescriptionService.approve(id, dto, ctx);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '审核拒绝处方' })
  @ApiParam({ name: 'id', description: '处方ID' })
  @ApiResponse({ status: 200, description: '拒绝成功', type: Prescription })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectPrescriptionDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<Prescription>> {
    const data = await this.prescriptionService.reject(id, dto, ctx);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Post(':id/supplement')
  @ApiOperation({ summary: '补充处方说明' })
  @ApiParam({ name: 'id', description: '处方ID' })
  @ApiResponse({ status: 200, description: '补充成功', type: Prescription })
  async supplement(
    @Param('id') id: string,
    @Body() dto: SupplementPrescriptionDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<Prescription>> {
    const data = await this.prescriptionService.supplement(id, dto, ctx);
    return ApiResponseDto.success(data, ctx.requestId);
  }

  @Post(':id/void')
  @ApiOperation({ summary: '作废处方' })
  @ApiParam({ name: 'id', description: '处方ID' })
  @ApiResponse({ status: 200, description: '作废成功', type: Prescription })
  async void(
    @Param('id') id: string,
    @Body() dto: VoidPrescriptionDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponseDto<Prescription>> {
    const data = await this.prescriptionService.void(id, dto, ctx);
    return ApiResponseDto.success(data, ctx.requestId);
  }
}
