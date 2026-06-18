import { Controller,Get,Post,Body,Patch,Param,Delete,Query,HttpCode,HttpStatus } from '@nestjs/common';
import { ApiTags,ApiOperation } from '@nestjs/swagger';
import { OrderService } from '../service/order.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { QueryOrderDto } from '../dto/query-order.dto';
import { Role } from '../../common/enums';

@ApiTags('订单 Order')
@Controller('orders')
export class OrderController{
  constructor(private readonly svc:OrderService){}
  @Post() @ApiOperation({summary:'创建客户需求单'})
  create(@Body()dto:CreateOrderDto){return this.svc.create(dto,{role:Role.CUSTOMER_SERVICE,id:'system',name:'system'})}
  @Get() @ApiOperation({summary:'分页查询需求单列表'})
  findAll(@Query()q:QueryOrderDto){return this.svc.findAll(q)}
  @Get(':id') @ApiOperation({summary:'获取需求单详情'})
  findOne(@Param('id')id:string){return this.svc.findOne(id)}
  @Patch(':id') @ApiOperation({summary:'更新需求单基本信息'})
  update(@Param('id')id:string,@Body()dto:UpdateOrderDto){return this.svc.update(id,dto,{role:Role.CUSTOMER_SERVICE,id:'system',name:'system'})}
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) @ApiOperation({summary:'删除需求单'})
  remove(@Param('id')id:string){return this.svc.remove(id,{role:Role.CUSTOMER_SERVICE,id:'system',name:'system'})}
  @Post(':id/cancel') @ApiOperation({summary:'取消需求单'})
  cancel(@Param('id')id:string,@Body()body:{reason:string}){return this.svc.cancel(id,body.reason,{role:Role.CUSTOMER_SERVICE,id:'system',name:'system'})}
  @Post(':id/complete') @ApiOperation({summary:'完成需求单'})
  complete(@Param('id')id:string,@Body()body:any={}){return this.svc.complete(id,{role:body.actorRole||Role.CUSTOMER_SERVICE,id:body.actorId||'system',name:body.actorName||'system'})}
}
