import { Controller,Get,Post,Body,Patch,Param,Delete,Query,HttpCode,HttpStatus } from '@nestjs/common';
import { ApiTags,ApiOperation } from '@nestjs/swagger';
import { OrderService } from '../service/order.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { QueryOrderDto } from '../dto/query-order.dto';
import { AssignOrderOwnerDto } from "../dto/assign-owner.dto";
import { ReportNoShowDto } from "../dto/report-no-show.dto";
import { HandleNoShowDto } from "../dto/handle-no-show.dto";
import { ClarifyServiceDto } from "../dto/clarify-service.dto";
import { OpenDisputeDto } from "../dto/open-dispute.dto";
import { ResolveDisputeDto } from "../dto/resolve-dispute.dto";
import { Role } from '../../common/enums';

@ApiTags('订单 Order')
@Controller('orders')

@ApiTags('订单 Order')
@Controller('orders')
export class OrderController {
  constructor(private readonly svc: OrderService) {}

  @Post()
  @ApiOperation({ summary: '创建订单' })
  create(@Body() dto: CreateOrderDto, @Body() body: any = {}) {
    return this.svc.create(dto, {
      role: body.actorRole || Role.CUSTOMER_SERVICE,
      id: body.actorId || 'system',
      name: body.actorName || 'system',
    });
  }

  @Get()
  @ApiOperation({ summary: '分页查询订单列表' })
  findAll(@Query() q: QueryOrderDto) {
    return this.svc.findAll(q);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get(':id/trace')
  @ApiOperation({ summary: '获取订单审计轨迹' })
  getTrace(@Param('id') id: string) {
    return this.svc.getAuditTrailOnly(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新订单基本信息' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @Body() body: any = {}) {
    return this.svc.update(id, dto, {
      role: body.actorRole || Role.CUSTOMER_SERVICE,
      id: body.actorId || 'system',
      name: body.actorName || 'system',
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除订单' })
  remove(@Param('id') id: string, @Body() body: any = {}) {
    return this.svc.remove(id, {
      role: body.actorRole || Role.CUSTOMER_SERVICE,
      id: body.actorId || 'system',
      name: body.actorName || 'system',
    });
  }

  @Post(':id/assign-owner')
  @ApiOperation({ summary: '分配责任人' })
  assignOwner(@Param('id') id: string, @Body() dto: AssignOrderOwnerDto, @Body() body: any = {}) {
    return this.svc.assignOwner(id, dto, {
      role: body.actorRole || Role.CUSTOMER_SERVICE,
      id: body.actorId || 'system',
      name: body.actorName || 'system',
    });
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认订单' })
  confirm(@Param('id') id: string, @Body() body: any = {}) {
    return this.svc.confirm(id, {
      role: body.actorRole || Role.CUSTOMER_SERVICE,
      id: body.actorId || 'system',
      name: body.actorName || 'system',
    });
  }

  @Post(':id/start-service')
  @ApiOperation({ summary: '开始服务' })
  startService(@Param('id') id: string, @Body() body: any = {}) {
    return this.svc.startService(id, {
      role: body.actorRole || Role.CUSTOMER_SERVICE,
      id: body.actorId || 'system',
      name: body.actorName || 'system',
    });
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成订单' })
  complete(@Param('id') id: string, @Body() body: any = {}) {
    return this.svc.complete(id, {
      role: body.actorRole || Role.CUSTOMER_SERVICE,
      id: body.actorId || 'system',
      name: body.actorName || 'system',
    });
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消订单' })
  cancel(@Param('id') id: string, @Body() body: { reason: string } & any = {}) {
    return this.svc.cancel(id, body.reason, {
      role: body.actorRole || Role.CUSTOMER_SERVICE,
      id: body.actorId || 'system',
      name: body.actorName || 'system',
    });
  }

  @Post(':id/report-no-show')
  @ApiOperation({ summary: '上报爽约' })
  reportNoShow(@Param("id") id: string, @Body() dto: ReportNoShowDto, @Body() body: any = {}) {
    return this.svc.reportNoShow(id, dto, {
      role: body.actorRole || Role.CUSTOMER_SERVICE,
      id: body.actorId || 'system',
      name: body.actorName || 'system',
    });
  }

  @Post(':id/handle-no-show')
  @ApiOperation({ summary: '处理爽约' })
  handleNoShow(@Param("id") id: string, @Body() dto: HandleNoShowDto, @Body() body: any = {}) {
    return this.svc.handleNoShow(id, dto, {
      role: body.actorRole || Role.CUSTOMER_SERVICE,
      id: body.actorId || 'system',
      name: body.actorName || 'system',
    });
  }

  @Post(':id/clarify-service')
  @ApiOperation({ summary: '服务内容澄清' })
  clarifyService(@Param("id") id: string, @Body() dto: ClarifyServiceDto, @Body() body: any = {}) {
    return this.svc.clarifyService(id, dto, {
      role: body.actorRole || Role.CUSTOMER_SERVICE,
      id: body.actorId || 'system',
      name: body.actorName || 'system',
    });
  }

  @Post(':id/open-dispute')
  @ApiOperation({ summary: '打开争议' })
  openDispute(@Param('id') id: string, @Body() dto: OpenDisputeDto, @Body() body: any = {}) {
    return this.svc.openDispute(id, dto.reason, {
      role: body.actorRole || Role.CUSTOMER_SERVICE,
      id: body.actorId || 'system',
      name: body.actorName || 'system',
    });
  }

  @Post(':id/resolve-dispute')
  @ApiOperation({ summary: '解决争议' })
  resolveDispute(@Param('id') id: string, @Body() dto: ResolveDisputeDto, @Body() body: any = {}) {
    return this.svc.resolveDispute(id, dto.resolution, {
      role: body.actorRole || Role.CUSTOMER_SERVICE,
      id: body.actorId || 'system',
      name: body.actorName || 'system',
    });
  }
}
