import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiParam } from '@nestjs/swagger';

import { OffShelfService } from './off-shelf.service';
import { OffShelfOrder } from './entities/off-shelf-order.entity';
import { OffShelfAction } from './enums/off-shelf-action.enum';
import { CreateOffShelfOrderDto } from './dto/create-off-shelf-order.dto';
import { SubmitOffShelfDto } from './dto/submit-off-shelf.dto';
import { ConfirmOffShelfDto } from './dto/confirm-off-shelf.dto';
import { RejectOffShelfDto } from './dto/reject-off-shelf.dto';
import { CancelOffShelfDto } from './dto/cancel-off-shelf.dto';
import { QueryOffShelfDto } from './dto/query-off-shelf.dto';
import { Context, RequestContext } from '../../common/decorators/request-context.decorator';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { ApiResponse } from '../../common/dto/response.dto';

@ApiTags('下架确认管理')
@Controller('off-shelf')
export class OffShelfController {
  constructor(private readonly offShelfService: OffShelfService) {}

  @Post()
  @ApiOperation({ summary: '创建下架单' })
  @SwaggerApiResponse({ status: 201, description: '创建成功', type: OffShelfOrder })
  async create(
    @Body() dto: CreateOffShelfOrderDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponse<OffShelfOrder>> {
    const data = await this.offShelfService.create(dto, ctx);
    return ApiResponse.success(data);
  }

  @Get()
  @ApiOperation({ summary: '分页查询下架单' })
  @SwaggerApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() query: QueryOffShelfDto): Promise<ApiResponse<PaginatedResult<OffShelfOrder>>> {
    const data = await this.offShelfService.findAll(query);
    return ApiResponse.success(data);
  }

  @Get(':id/allowed-actions')
  @ApiOperation({ summary: '获取可执行操作' })
  @ApiParam({ name: 'id', description: '下架单ID' })
  @SwaggerApiResponse({ status: 200, description: '查询成功', type: [String] })
  async getAllowedActions(
    @Param('id') id: string,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponse<OffShelfAction[]>> {
    const data = await this.offShelfService.getAllowedActions(id, ctx);
    return ApiResponse.success(data);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取下架单详情' })
  @ApiParam({ name: 'id', description: '下架单ID' })
  @SwaggerApiResponse({ status: 200, description: '查询成功', type: OffShelfOrder })
  async findOne(@Param('id') id: string): Promise<ApiResponse<OffShelfOrder>> {
    const data = await this.offShelfService.findOne(id);
    return ApiResponse.success(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新下架单' })
  @ApiParam({ name: 'id', description: '下架单ID' })
  @SwaggerApiResponse({ status: 200, description: '更新成功', type: OffShelfOrder })
  async update(
    @Param('id') id: string,
    @Body() dto: CreateOffShelfOrderDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponse<OffShelfOrder>> {
    const data = await this.offShelfService.update(id, dto, ctx);
    return ApiResponse.success(data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除下架单' })
  @ApiParam({ name: 'id', description: '下架单ID' })
  @SwaggerApiResponse({ status: 204, description: '删除成功' })
  async remove(@Param('id') id: string): Promise<ApiResponse<void>> {
    await this.offShelfService.remove(id);
    return ApiResponse.success(null);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交下架单' })
  @ApiParam({ name: 'id', description: '下架单ID' })
  @SwaggerApiResponse({ status: 200, description: '提交成功', type: OffShelfOrder })
  async submit(
    @Param('id') id: string,
    @Body() dto: SubmitOffShelfDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponse<OffShelfOrder>> {
    const data = await this.offShelfService.submit(id, dto, ctx);
    return ApiResponse.success(data);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '复核通过下架单' })
  @ApiParam({ name: 'id', description: '下架单ID' })
  @SwaggerApiResponse({ status: 200, description: '复核通过成功', type: OffShelfOrder })
  async confirm(
    @Param('id') id: string,
    @Body() dto: ConfirmOffShelfDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponse<OffShelfOrder>> {
    const data = await this.offShelfService.confirm(id, dto, ctx);
    return ApiResponse.success(data);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '复核拒绝下架单' })
  @ApiParam({ name: 'id', description: '下架单ID' })
  @SwaggerApiResponse({ status: 200, description: '复核拒绝成功', type: OffShelfOrder })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectOffShelfDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponse<OffShelfOrder>> {
    const data = await this.offShelfService.reject(id, dto, ctx);
    return ApiResponse.success(data);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消下架单' })
  @ApiParam({ name: 'id', description: '下架单ID' })
  @SwaggerApiResponse({ status: 200, description: '取消成功', type: OffShelfOrder })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelOffShelfDto,
    @Context() ctx: RequestContext,
  ): Promise<ApiResponse<OffShelfOrder>> {
    const data = await this.offShelfService.cancel(id, dto, ctx);
    return ApiResponse.success(data);
  }
}
