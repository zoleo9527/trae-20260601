import { Controller, Get, Post, Body, Put, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TrainingNeedsService } from './training-needs.service';
import { CreateTrainingNeedDto } from './dto/create-training-need.dto';
import { UpdateTrainingNeedDto } from './dto/update-training-need.dto';
import { ApproveTrainingNeedDto } from './dto/approve-training-need.dto';
import { RejectTrainingNeedDto } from './dto/reject-training-need.dto';
import { TransferTrainingNeedDto } from './dto/transfer-training-need.dto';
import { AddRemarkDto } from './dto/add-remark.dto';
import { TrainingNeedQueryDto } from './dto/training-need-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../../entities/user.entity';

@ApiTags('培训需求')
@ApiBearerAuth()
@Controller('training-needs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingNeedsController {
  constructor(private trainingNeedsService: TrainingNeedsService) {}

  @Post()
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '创建培训需求' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  async create(@Body() createDto: CreateTrainingNeedDto, @Request() req) {
    return this.trainingNeedsService.create(createDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '获取培训需求列表' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  async findAll(@Query() queryDto: TrainingNeedQueryDto, @Request() req) {
    return this.trainingNeedsService.findAll(queryDto, req.user);
  }

  @Get('my-pending')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '获取我的待处理需求' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  async getMyPendingNeeds(@Request() req) {
    return this.trainingNeedsService.getMyPendingNeeds(req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '获取培训需求详情' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '培训需求不存在' })
  async findOne(@Param('id') id: string) {
    return this.trainingNeedsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '更新培训需求' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '培训需求不存在' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateTrainingNeedDto, @Request() req) {
    return this.trainingNeedsService.update(id, updateDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '删除培训需求' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '培训需求不存在' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.trainingNeedsService.remove(id, req.user);
  }

  @Post(':id/approve')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '审批通过培训需求' })
  @ApiResponse({ status: 200, description: '审批成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '培训需求不存在' })
  @ApiResponse({ status: 400, description: '只能审批待审批状态的需求' })
  async approve(@Param('id') id: string, @Body() approveDto: ApproveTrainingNeedDto, @Request() req) {
    return this.trainingNeedsService.approve(id, approveDto, req.user.id);
  }

  @Post(':id/reject')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '驳回培训需求' })
  @ApiResponse({ status: 200, description: '驳回成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '培训需求不存在' })
  @ApiResponse({ status: 400, description: '只能驳回待审批状态的需求' })
  async reject(@Param('id') id: string, @Body() rejectDto: RejectTrainingNeedDto, @Request() req) {
    return this.trainingNeedsService.reject(id, rejectDto, req.user.id);
  }

  @Post(':id/transfer')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '转派培训需求' })
  @ApiResponse({ status: 200, description: '转派成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '培训需求或目标经理不存在' })
  @ApiResponse({ status: 400, description: '只能转派待审批状态的需求' })
  async transfer(@Param('id') id: string, @Body() transferDto: TransferTrainingNeedDto, @Request() req) {
    return this.trainingNeedsService.transfer(id, transferDto, req.user.id);
  }

  @Post(':id/remarks')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '添加处理备注' })
  @ApiResponse({ status: 200, description: '添加成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '培训需求不存在' })
  async addRemark(@Param('id') id: string, @Body() addRemarkDto: AddRemarkDto, @Request() req) {
    return this.trainingNeedsService.addRemark(id, addRemarkDto, req.user.id);
  }

  @Get(':id/history')
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '获取培训需求处理历史' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '培训需求不存在' })
  async getHistory(@Param('id') id: string) {
    return this.trainingNeedsService.getHistory(id);
  }
}