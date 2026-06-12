import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from '../../dto/create-order.dto';
import { UpdateOrderDto } from '../../dto/update-order.dto';
import { OrderStatus } from '../../entities/order.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  async findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Get('status/:status')
  async findByStatus(@Param('status') status: OrderStatus) {
    return this.orderService.findByStatus(status);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: OrderStatus }) {
    return this.orderService.updateStatus(id, body.status);
  }

  @Put(':id/return')
  async setReturnReason(@Param('id') id: string, @Body() body: { returnReason: string }) {
    return this.orderService.setReturnReason(id, body.returnReason);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.orderService.remove(id);
    return { message: '订单已删除' };
  }
}
