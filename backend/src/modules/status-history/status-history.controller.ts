import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { StatusChangeHistoryService } from './status-history.service';
import { EntityType } from '../../entities/status-change-history.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../../entities/user.entity';

@ApiTags('状态历史')
@ApiBearerAuth()
@Controller('status-history')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatusHistoryController {
  constructor(private statusHistoryService: StatusChangeHistoryService) {}

  @Get('training-needs/:id')
  @Roles(UserRole.TRAINING_MANAGER, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: '获取培训需求的状态变更历史' })
  @ApiParam({ name: 'id', description: '培训需求ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '培训需求不存在' })
  async getTrainingNeedHistory(@Param('id') id: string) {
    const histories = await this.statusHistoryService.getHistoryByEntity(
      EntityType.TRAINING_NEED,
      id,
    );
    
    const latest = histories.length > 0 ? histories[histories.length - 1] : null;
    const timeline = this.buildTimeline(histories);
    
    return {
      entityType: 'training_need',
      entityId: id,
      totalChanges: histories.length,
      latest: latest,
      timeline: timeline,
    };
  }

  @Get('course-projects/:id')
  @Roles(UserRole.TRAINING_MANAGER, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: '获取课程立项的状态变更历史' })
  @ApiParam({ name: 'id', description: '课程立项ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '课程立项不存在' })
  async getCourseProjectHistory(@Param('id') id: string) {
    const histories = await this.statusHistoryService.getHistoryByEntity(
      EntityType.COURSE_PROJECT,
      id,
    );
    
    const latest = histories.length > 0 ? histories[histories.length - 1] : null;
    const timeline = this.buildTimeline(histories);
    
    return {
      entityType: 'course_project',
      entityId: id,
      totalChanges: histories.length,
      latest: latest,
      timeline: timeline,
    };
  }

  @Get('training-needs/:id/latest')
  @Roles(UserRole.TRAINING_MANAGER, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: '获取培训需求的最近状态变更' })
  @ApiParam({ name: 'id', description: '培训需求ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  async getTrainingNeedLatestChange(@Param('id') id: string) {
    const latest = await this.statusHistoryService.getLatestStatusChange(
      EntityType.TRAINING_NEED,
      id,
    );
    
    return {
      entityType: 'training_need',
      entityId: id,
      latest: latest,
    };
  }

  @Get('course-projects/:id/latest')
  @Roles(UserRole.TRAINING_MANAGER, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: '获取课程立项的最近状态变更' })
  @ApiParam({ name: 'id', description: '课程立项ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  async getCourseProjectLatestChange(@Param('id') id: string) {
    const latest = await this.statusHistoryService.getLatestStatusChange(
      EntityType.COURSE_PROJECT,
      id,
    );
    
    return {
      entityType: 'course_project',
      entityId: id,
      latest: latest,
    };
  }

  private buildTimeline(histories: any[]) {
    return histories.map((history, index) => ({
      step: index + 1,
      fromStatus: history.fromStatus,
      toStatus: history.toStatus,
      handler: history.changedBy ? {
        id: history.changedBy.id,
        name: history.changedBy.name,
      } : null,
      reason: history.reason,
      remarks: history.remarks,
      timestamp: history.createdAt,
      statusLabel: this.getStatusLabel(history.toStatus),
      actionLabel: this.getActionLabel(history.fromStatus, history.toStatus),
    }));
  }

  private getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': '待审批',
      'approved': '已通过',
      'rejected': '已驳回',
      'transferred': '已转派',
      'published': '已发布',
      'in_progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消',
      'enrolled': '已报名',
      'attended': '已出席',
      'absent': '已缺席',
    };
    return statusMap[status] || status;
  }

  private getActionLabel(fromStatus: string, toStatus: string): string {
    const actionMap: Record<string, string> = {
      'pending->approved': '审批通过',
      'pending->rejected': '驳回',
      'pending->transferred': '转派',
      'transferred->approved': '审批通过',
      'transferred->rejected': '驳回',
      'transferred->transferred': '再次转派',
      'approved->published': '发布',
      'approved->cancelled': '取消',
      'published->in_progress': '开始培训',
      'published->cancelled': '取消',
      'in_progress->completed': '完成培训',
      'completed->cancelled': '取消',
    };
    return actionMap[`${fromStatus}->${toStatus}`] || `${fromStatus} -> ${toStatus}`;
  }
}
