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
  @ApiOperation({ summary: '申请备件', description: '诊断或维修中发现缺件，工单流转为待备件' })
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
  @ApiOperation({ summary: '备件到货（前台/店长）', description: '备件到店，工单流转回维修中' })
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
    summary: '质检（前台/店长）',
    description: '通过则变为待取机；不通过则退回维修中',
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
