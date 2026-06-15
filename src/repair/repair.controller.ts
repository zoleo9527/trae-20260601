import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RepairService } from './repair.service';
import {
  SubmitDiagnosisDto,
  SubmitQualityCheckDto,
} from './dto/repair.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ResponseTransformInterceptor } from '../common/interceptors/response.interceptor';

@ApiTags('维修工单')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ResponseTransformInterceptor)
@Controller('repair')
export class RepairController {
  constructor(private readonly repairService: RepairService) {}

  @Post(':id/claim')
  @Roles(UserRole.TECHNICIAN)
  @ApiParam({ name: 'id', description: '工单ID' })
  @ApiOperation({ summary: '领取工单（维修师）', description: '从待领取工单池中领取，自动变为诊断中' })
  async claimOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.repairService.claimOrder(id, user);
  }

  @Patch(':id/diagnosis')
  @Roles(UserRole.TECHNICIAN, UserRole.MANAGER)
  @ApiParam({ name: 'id', description: '工单ID' })
  @ApiOperation({ summary: '提交诊断结果', description: '诊断完成后提交，工单流转为维修中' })
  async submitDiagnosis(
    @Param('id') id: string,
    @Body() dto: SubmitDiagnosisDto,
    @CurrentUser() user: User,
  ) {
    return this.repairService.submitDiagnosis(id, dto, user);
  }

  @Patch(':id/request-parts')
  @Roles(UserRole.TECHNICIAN, UserRole.MANAGER)
  @ApiParam({ name: 'id', description: '工单ID' })
  @ApiOperation({
    summary: '申请备件（已复用结构化记录）',
    description: '自动创建结构化备件申请记录(PartRequest)，推荐直接用 POST /repair/:orderId/part-request 提供更详细信息',
  })
  async requestParts(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @CurrentUser() user: User,
  ) {
    return this.repairService.requestParts(id, notes, user);
  }

  @Patch(':id/parts-arrived')
  @Roles(UserRole.RECEPTIONIST, UserRole.MANAGER)
  @ApiParam({ name: 'id', description: '工单ID' })
  @ApiOperation({
    summary: '备件到货（已复用结构化记录）',
    description: '自动走下单→确认到货的结构化流程，推荐分步使用 PATCH /repair/part-request/:id/order 和 /arrive',
  })
  async partsArrived(@Param('id') id: string, @CurrentUser() user: User) {
    return this.repairService.partsArrived(id, user);
  }

  @Patch(':id/submit-quality')
  @Roles(UserRole.TECHNICIAN, UserRole.MANAGER)
  @ApiParam({ name: 'id', description: '工单ID' })
  @ApiOperation({ summary: '维修完成提交质检', description: '维修结束后提交，工单流转为质检中' })
  async submitForQuality(
    @Param('id') id: string,
    @Body('repairNotes') repairNotes: string,
    @CurrentUser() user: User,
  ) {
    return this.repairService.submitForQuality(id, repairNotes, user);
  }

  @Patch(':id/quality-check')
  @Roles(UserRole.RECEPTIONIST, UserRole.MANAGER)
  @ApiParam({ name: 'id', description: '工单ID' })
  @ApiOperation({
    summary: '质检（必须附带 checkItems）',
    description:
      '必须提供 checkItems（10项逐项检查结果），否则返回 4001 错误。推荐使用新接口 POST /repair/:orderId/quality-check',
  })
  async qualityCheck(
    @Param('id') id: string,
    @Body() dto: SubmitQualityCheckDto,
    @CurrentUser() user: User,
  ) {
    return this.repairService.submitQualityCheck(id, dto, user);
  }

  @Post(':id/complete')
  @Roles(UserRole.RECEPTIONIST, UserRole.MANAGER)
  @ApiParam({ name: 'id', description: '工单ID' })
  @ApiOperation({ summary: '取机完成', description: '客户取机后点击完成，工单闭环' })
  async complete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.repairService.completeOrder(id, user);
  }
}
