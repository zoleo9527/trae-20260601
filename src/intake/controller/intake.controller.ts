import { Controller,Get,Post,Body,Patch,Param,Delete,Query,HttpCode,HttpStatus } from '@nestjs/common';
import { ApiTags,ApiOperation } from '@nestjs/swagger';
import { IntakeService } from '../service/intake.service';
import { CreateIntakeDto } from '../dto/create-intake.dto';
import { UpdateIntakeDto } from '../dto/update-intake.dto';
import { AssignOwnerDto } from '../dto/assign-owner.dto';
import { ClarifyDto } from '../dto/clarify.dto';
import { QueryIntakeDto } from '../dto/query-intake.dto';
import { IntakeBlockReason,Role } from '../../common/enums';

@ApiTags('客户需求 Intake')
@Controller('intakes')
export class IntakeController{
  constructor(private readonly svc:IntakeService){}
  @Post() @ApiOperation({summary:'创建客户需求单'})
  create(@Body()dto:CreateIntakeDto){return this.svc.create(dto,Role.CUSTOMER_SERVICE,'system','system')}
  @Get() @ApiOperation({summary:'分页查询需求单列表'})
  findAll(@Query()q:QueryIntakeDto){return this.svc.findAll(q)}
  @Get('stuck') @ApiOperation({summary:'检测卡住超过24小时的需求单'})
  detectStuckCases(){return this.svc.detectStuckCases()}
  @Get(':id') @ApiOperation({summary:'获取需求单详情'})
  findOne(@Param('id')id:string){return this.svc.findOne(id)}
  @Get(':id/trace') @ApiOperation({summary:'获取需求单审计轨迹'})
  getTrace(@Param('id')id:string){return this.svc.getAuditTrailOnly(id)}
  @Patch(':id') @ApiOperation({summary:'更新需求单基本信息'})
  update(@Param('id')id:string,@Body()dto:UpdateIntakeDto){return this.svc.update(id,dto,Role.CUSTOMER_SERVICE,'system','system')}
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) @ApiOperation({summary:'删除需求单'})
  remove(@Param('id')id:string){return this.svc.remove(id,Role.CUSTOMER_SERVICE,'system','system')}
  @Post(':id/assign-owner') @ApiOperation({summary:'分配责任人'})
  assignOwner(@Param('id')id:string,@Body()dto:AssignOwnerDto){return this.svc.assignOwner(id,dto,Role.CUSTOMER_SERVICE,'system','system')}
  @Post(':id/clarify') @ApiOperation({summary:'澄清服务内容'})
  clarify(@Param('id')id:string,@Body()dto:ClarifyDto){return this.svc.clarify(id,dto)}
  @Post(':id/start-matching') @ApiOperation({summary:'开始匹配'})
  startMatching(@Param('id')id:string,@Body()body:any={}){return this.svc.startMatching(id,body.actorRole||Role.CUSTOMER_SERVICE,body.actorId||'system',body.actorName||'system')}
  @Post(':id/block-reason') @ApiOperation({summary:'更新卡住原因'})
  updateBlockReason(@Param('id')id:string,@Body()body:{reason:IntakeBlockReason}){return this.svc.updateBlockReason(id,body.reason,Role.CUSTOMER_SERVICE,'system','system')}
  @Post(':id/cancel') @ApiOperation({summary:'取消需求单'})
  cancel(@Param('id')id:string,@Body()body:{reason:string}){return this.svc.cancel(id,body.reason,Role.CUSTOMER_SERVICE,'system','system')}
  @Post(':id/complete') @ApiOperation({summary:'完成需求单'})
  complete(@Param('id')id:string,@Body()body:any={}){return this.svc.complete(id,body.actorRole||Role.CUSTOMER_SERVICE,body.actorId||'system',body.actorName||'system')}
}
