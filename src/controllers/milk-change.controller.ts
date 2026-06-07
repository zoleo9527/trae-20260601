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

  @Post()
  async create(@Body() dto: CreateMilkChangeDto) {
    try {
      const result = await this.milkChangeService.create(dto);
      return ApiResponse.success(this.formatDetail(result));
    } catch (e) {
      throw new HttpException(
        ApiResponse.error(ErrorCode.PARAM_VALIDATION_ERROR, e.message),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('default')
  async getDefaultList(@Query() dto: ListMilkChangeDto) {
    try {
      const result = await this.milkChangeService.getDefaultList(dto);
      return ApiResponse.success(result);
    } catch (e) {
      throw new HttpException(
        ApiResponse.error(ErrorCode.INTERNAL_ERROR, e.message),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      throw new HttpException(
        ApiResponse.error(ErrorCode.INTERNAL_ERROR, e.message),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async list(@Query() dto: ListMilkChangeDto) {
    try {
      const result = await this.milkChangeService.list(dto);
      return ApiResponse.success(result);
    } catch (e) {
      throw new HttpException(
        ApiResponse.error(ErrorCode.INTERNAL_ERROR, e.message),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    try {
      const result = await this.milkChangeService.getDetail(id);
      return ApiResponse.success(this.formatDetail(result));
    } catch (e) {
      throw new HttpException(
        ApiResponse.error(ErrorCode.MILK_CHANGE_NOT_FOUND, e.message),
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Put(':id/process')
  async process(@Param('id') id: string, @Body() dto: ProcessMilkChangeDto) {
    try {
      const result = await this.milkChangeService.process(id, dto);
      return ApiResponse.success(this.formatDetail(result));
    } catch (e) {
      throw new HttpException(
        ApiResponse.error(ErrorCode.PARAM_VALIDATION_ERROR, e.message),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id/assign-route')
  async assignRoute(@Param('id') id: string, @Body() dto: AssignRouteDto) {
    try {
      const result = await this.milkChangeService.assignRoute(id, dto);
      return ApiResponse.success(this.formatDetail(result));
    } catch (e) {
      throw new HttpException(
        ApiResponse.error(ErrorCode.PARAM_VALIDATION_ERROR, e.message),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id/logs')
  async getLogs(@Param('id') id: string) {
    try {
      const result = await this.milkChangeService.getOperationLogs(id);
      return ApiResponse.success(result);
    } catch (e) {
      throw new HttpException(
        ApiResponse.error(ErrorCode.INTERNAL_ERROR, e.message),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/route-histories')
  async getRouteHistories(@Param('id') id: string) {
    try {
      const result = await this.milkChangeService.getRouteAdjustHistories(id);
      return ApiResponse.success(result);
    } catch (e) {
      throw new HttpException(
        ApiResponse.error(ErrorCode.INTERNAL_ERROR, e.message),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      throw new HttpException(
        ApiResponse.error(ErrorCode.MILK_CHANGE_NOT_FOUND, e.message),
        HttpStatus.NOT_FOUND,
      );
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
