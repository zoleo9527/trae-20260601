import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateMedicineInventoryDto, UpdateMedicineInventoryDto, MedicineInventoryQueryDto } from './dto/medicine-inventory.dto';
import { NearExpiryAlertQueryDto, AcknowledgeAlertDto, ResolveAlertDto, NearExpiryMedicineQueryDto } from './dto/near-expiry-alert.dto';
import { ApiResponse as ApiResponseWrapper } from '../../common/dto/response.dto';
import { RequestContext, CurrentUser } from '../../common/decorators/request-context.decorator';
import { MedicineInventory } from './entities/medicine-inventory.entity';
import { NearExpiryAlert } from './entities/near-expiry-alert.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@ApiTags('库存管理')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: '创建库存记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @Body() dto: CreateMedicineInventoryDto,
    @CurrentUser('requestId') requestId: string,
  ): Promise<ApiResponseWrapper<MedicineInventory>> {
    const data = await this.inventoryService.create(dto);
    return ApiResponseWrapper.success(data, requestId);
  }

  @Get()
  @ApiOperation({ summary: '分页查询库存' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(
    @Query() query: MedicineInventoryQueryDto,
    @CurrentUser('requestId') requestId: string,
  ): Promise<ApiResponseWrapper<PaginatedResult<MedicineInventory>>> {
    const data = await this.inventoryService.findAll(query);
    return ApiResponseWrapper.success(data, requestId);
  }

  @Get('near-expiry')
  @ApiOperation({ summary: '查询近效药' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findNearExpiry(
    @Query() query: NearExpiryMedicineQueryDto,
    @CurrentUser('requestId') requestId: string,
  ): Promise<ApiResponseWrapper<MedicineInventory[]>> {
    const data = await this.inventoryService.findNearExpiryMedicines(query.daysToExpiry || 90);
    return ApiResponseWrapper.success(data, requestId);
  }

  @Get('alerts')
  @ApiOperation({ summary: '分页查询预警' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAlerts(
    @Query() query: NearExpiryAlertQueryDto,
    @CurrentUser('requestId') requestId: string,
  ): Promise<ApiResponseWrapper<PaginatedResult<NearExpiryAlert>>> {
    const data = await this.inventoryService.findAlerts(query);
    return ApiResponseWrapper.success(data, requestId);
  }

  @Get('alerts/:id')
  @ApiOperation({ summary: '获取预警详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAlertById(
    @Param('id') id: string,
    @CurrentUser('requestId') requestId: string,
  ): Promise<ApiResponseWrapper<NearExpiryAlert>> {
    const data = await this.inventoryService.findAlertById(id);
    return ApiResponseWrapper.success(data, requestId);
  }

  @Post('alerts/:id/acknowledge')
  @ApiOperation({ summary: '确认预警' })
  @ApiResponse({ status: 200, description: '确认成功' })
  async acknowledgeAlert(
    @Param('id') id: string,
    @Body() dto: AcknowledgeAlertDto,
    @CurrentUser() context: RequestContext,
  ): Promise<ApiResponseWrapper<NearExpiryAlert>> {
    const data = await this.inventoryService.acknowledgeAlert(id, dto, context.userId);
    return ApiResponseWrapper.success(data, context.requestId);
  }

  @Post('alerts/:id/resolve')
  @ApiOperation({ summary: '解决预警（同时扣减库存）' })
  @ApiResponse({ status: 200, description: '解决成功' })
  async resolveAlert(
    @Param('id') id: string,
    @Body() dto: ResolveAlertDto,
    @CurrentUser() context: RequestContext,
  ): Promise<ApiResponseWrapper<NearExpiryAlert>> {
    const data = await this.inventoryService.resolveAlert(id, dto, context.userId);
    return ApiResponseWrapper.success(data, context.requestId);
  }

  @Post('generate-alerts')
  @ApiOperation({ summary: '手工触发生成预警' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async generateAlerts(
    @CurrentUser('requestId') requestId: string,
  ): Promise<ApiResponseWrapper<{ generated: number; skipped: number }>> {
    const data = await this.inventoryService.generateAlerts();
    return ApiResponseWrapper.success(data, requestId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取库存详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('requestId') requestId: string,
  ): Promise<ApiResponseWrapper<MedicineInventory>> {
    const data = await this.inventoryService.findOne(id);
    return ApiResponseWrapper.success(data, requestId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新库存记录' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMedicineInventoryDto,
    @CurrentUser('requestId') requestId: string,
  ): Promise<ApiResponseWrapper<MedicineInventory>> {
    const data = await this.inventoryService.update(id, dto);
    return ApiResponseWrapper.success(data, requestId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除库存记录' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async remove(
    @Param('id') id: string,
  ): Promise<void> {
    await this.inventoryService.remove(id);
  }
}
