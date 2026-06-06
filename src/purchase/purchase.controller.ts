import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PurchaseStatus } from '../common/enums';
import { GeneratePurchaseDto } from './interfaces/purchase.interface';
import { PurchaseService } from './purchase.service';

@ApiTags('purchase')
@Controller('purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get('summary/:date')
  @ApiOperation({ summary: '获取某日订餐汇总' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  getSummary(@Param('date') date: string) {
    return this.purchaseService.getSummary(date);
  }

  @Post('summary/:date/confirm')
  @ApiOperation({ summary: '确认订餐汇总' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  confirmSummary(@Param('date') date: string) {
    const operator = { id: 'admin-001', name: '食堂管理员', role: 'canteen_admin', email: 'canteen@school.com' };
    return this.purchaseService.confirmSummary(date, operator as any);
  }

  @Get('orders')
  @ApiOperation({ summary: '获取采购单列表' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PurchaseStatus })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  findAllPurchaseOrders(@Query('date') date?: string, @Query('status') status?: PurchaseStatus) {
    return this.purchaseService.findAllPurchaseOrders({ date, status });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: '获取采购单详情' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  findOnePurchaseOrder(@Param('id') id: string) {
    return this.purchaseService.findOnePurchaseOrder(id);
  }

  @Post('orders/generate')
  @ApiOperation({ summary: '生成采购单' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  generatePurchaseOrder(@Body() dto: GeneratePurchaseDto) {
    const operator = { id: 'purchaser-001', name: '李采购', role: 'purchaser', email: 'purchase@school.com' };
    return this.purchaseService.generatePurchaseOrder(dto, operator as any);
  }

  @Post('orders/:id/submit')
  @ApiOperation({ summary: '提交采购单' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  submitPurchaseOrder(@Param('id') id: string) {
    const operator = { id: 'purchaser-001', name: '李采购', role: 'purchaser', email: 'purchase@school.com' };
    return this.purchaseService.submitPurchaseOrder(id, operator as any);
  }

  @Post('orders/:id/receive')
  @ApiOperation({ summary: '确认采购到货' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  confirmReceive(@Param('id') id: string) {
    const operator = { id: 'purchaser-001', name: '李采购', role: 'purchaser', email: 'purchase@school.com' };
    return this.purchaseService.confirmReceive(id, operator as any);
  }
}
