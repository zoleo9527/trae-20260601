import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MilkChangeService } from '../services/milk-change.service';
import { ApiResponse } from '../common/response';
import { BusinessException } from '../common/business-exception';
import {
  CreateMilkChangeDto,
  ProcessMilkChangeDto,
  ListMilkChangeDto,
  AssignRouteDto,
} from '../dto/milk-change.dto';
import {
  MilkChangeStatusLabel,
  MilkChangeTypeLabel,
  StaffRoleLabel,
  ReturnReasonLabel,
  StaffRole,
} from '../common/enums';
import { ErrorCode } from '../common/error-code';

@Controller('api/milk-changes')
export class MilkChangeController {
  constructor(private readonly milkChangeService: MilkChangeService) {}

  private handleError(e: any): never {
    if (e instanceof BusinessException) {
      const notFoundCodes = [
        ErrorCode.MILK_CHANGE_NOT_FOUND,
        ErrorCode.CUSTOMER_NOT_FOUND,
        ErrorCode.STAFF_NOT_FOUND,
        ErrorCode.ROUTE_NOT_FOUND,
        ErrorCode.ROUTE_ADJUST_HISTORY_NOT_FOUND,
      ];
      const httpStatus = notFoundCodes.includes(e.code)
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      throw new HttpException(
        ApiResponse.error(e.code, e.message),
        httpStatus,
      );
    }
    if (e instanceof HttpException) {
      throw e;
    }
    throw new HttpException(
      ApiResponse.error(ErrorCode.INTERNAL_ERROR, e.message || '系统内部错误'),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  @Post()
  async create(@Body() dto: CreateMilkChangeDto) {
    try {
      const result = await this.milkChangeService.create(dto);
      return ApiResponse.success(this.formatDetail(result));
    } catch (e) {
      this.handleError(e);
    }
  }

  @Get('default')
  async getDefaultList(@Query() dto: ListMilkChangeDto) {
    try {
      const result = await this.milkChangeService.getDefaultList(dto);
      return ApiResponse.success(result);
    } catch (e) {
      this.handleError(e);
    }
  }

  @Get('my-todo')
  async getMyTodoList(
    @Query('staffId') staffId: string,
    @Query('staffRole') staffRole: StaffRole,
    @Query() dto: ListMilkChangeDto,
  ) {
    try {
      const result = await this.milkChangeService.getMyTodoList(staffId, staffRole, dto);
      return ApiResponse.success(result);
    } catch (e) {
      this.handleError(e);
    }
  }

  @Get()
  async list(@Query() dto: ListMilkChangeDto) {
    try {
      const result = await this.milkChangeService.list(dto);
      return ApiResponse.success(result);
    } catch (e) {
      this.handleError(e);
    }
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    try {
      const result = await this.milkChangeService.getDetail(id);
      return ApiResponse.success(this.formatDetail(result));
    } catch (e) {
      this.handleError(e);
    }
  }

  @Put(':id/process')
  async process(@Param('id') id: string, @Body() dto: ProcessMilkChangeDto) {
    try {
      const result = await this.milkChangeService.process(id, dto);
      return ApiResponse.success(this.formatDetail(result));
    } catch (e) {
      this.handleError(e);
    }
  }

  @Put(':id/assign-route')
  async assignRoute(@Param('id') id: string, @Body() dto: AssignRouteDto) {
    try {
      const result = await this.milkChangeService.assignRoute(id, dto);
      return ApiResponse.success(this.formatDetail(result));
    } catch (e) {
      this.handleError(e);
    }
  }

  @Get(':id/logs')
  async getLogs(@Param('id') id: string) {
    try {
      const result = await this.milkChangeService.getOperationLogs(id);
      return ApiResponse.success(result);
    } catch (e) {
      this.handleError(e);
    }
  }

  @Get(':id/route-histories')
  async getRouteHistories(@Param('id') id: string) {
    try {
      const result = await this.milkChangeService.getRouteAdjustHistories(id);
      return ApiResponse.success(result);
    } catch (e) {
      this.handleError(e);
    }
  }

  @Get(':id/review')
  async getReview(@Param('id') id: string) {
    try {
      const result = await this.milkChangeService.getReview(id);
      return ApiResponse.success({
        detail: this.formatDetail(result.detail),
        logs: result.logs,
        routeHistories: result.routeHistories,
      });
    } catch (e) {
      this.handleError(e);
    }
  }

  private formatDetail(item: any) {
    return {
      id: item.id,
      customer: item.customer
        ? {
            id: item.customer.id,
            name: item.customer.name,
            phone: item.customer.phone,
            address: item.customer.address,
            addressDetail: item.customer.addressDetail,
            currentProduct: item.customer.currentProduct,
            currentQuantity: item.customer.currentQuantity,
            deliveryTime: item.customer.deliveryTime,
            routeId: item.customer.routeId,
          }
        : null,
      changeType: item.changeType,
      changeTypeLabel: MilkChangeTypeLabel[item.changeType] || item.changeType,
      changeDetail: item.changeDetail,
      oldProduct: item.oldProduct,
      oldQuantity: item.oldQuantity,
      newProduct: item.newProduct,
      newQuantity: item.newQuantity,
      oldAddress: item.oldAddress,
      newAddress: item.newAddress,
      oldDeliveryTime: item.oldDeliveryTime,
      newDeliveryTime: item.newDeliveryTime,
      oldRouteId: item.oldRouteId,
      oldRouteName: item.oldRouteName,
      newRouteId: item.newRouteId,
      newRouteName: item.newRouteName,
      routeAdjustReason: item.routeAdjustReason,
      status: item.status,
      statusLabel: MilkChangeStatusLabel[item.status] || item.status,
      currentHandler: item.currentHandler
        ? {
            id: item.currentHandler.id,
            name: item.currentHandler.name,
            role: item.currentHandler.role,
            roleLabel: StaffRoleLabel[item.currentHandler.role] || item.currentHandler.role,
          }
        : null,
      assignedTo: item.assignedTo
        ? {
            id: item.assignedTo.id,
            name: item.assignedTo.name,
            role: item.assignedTo.role,
            roleLabel: StaffRoleLabel[item.assignedTo.role] || item.assignedTo.role,
          }
        : null,
      remark: item.remark,
      returnReason: item.returnReason,
      returnReasonLabel: item.returnReason ? ReturnReasonLabel[item.returnReason] : null,
      returnDetail: item.returnDetail,
      supplementRemark: item.supplementRemark,
      effectiveDate: item.effectiveDate,
      expectedCompleteAt: item.expectedCompleteAt,
      completedAt: item.completedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
