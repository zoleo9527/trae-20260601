import { Controller, Get, Post, Body, Put, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CourseProjectsService } from './course-projects.service';
import { CreateCourseProjectDto } from './dto/create-course-project.dto';
import { UpdateCourseProjectDto } from './dto/update-course-project.dto';
import { CourseProjectQueryDto } from './dto/course-project-query.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { MarkAbsentDto } from './dto/mark-absent.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../../entities/user.entity';

@ApiTags('课程立项')
@ApiBearerAuth()
@Controller('course-projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseProjectsController {
  constructor(private courseProjectsService: CourseProjectsService) {}

  @Post()
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '创建课程立项' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '培训需求或讲师不存在' })
  @ApiResponse({ status: 400, description: '只能为已审批通过的培训需求创建立项' })
  async create(@Body() createDto: CreateCourseProjectDto) {
    return this.courseProjectsService.create(createDto);
  }

  @Get()
  @Roles(UserRole.TRAINING_MANAGER, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: '获取课程立项列表' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  async findAll(@Query() queryDto: CourseProjectQueryDto, @Request() req) {
    return this.courseProjectsService.findAll(queryDto, req.user);
  }

  @Get(':id')
  @Roles(UserRole.TRAINING_MANAGER, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: '获取课程立项详情' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '课程立项不存在' })
  async findOne(@Param('id') id: string) {
    return this.courseProjectsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '更新课程立项' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '课程立项不存在' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateCourseProjectDto, @Request() req) {
    return this.courseProjectsService.update(id, updateDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '删除课程立项' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '课程立项不存在' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.courseProjectsService.remove(id, req.user);
  }

  @Post(':id/approve')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '审批通过课程立项' })
  @ApiResponse({ status: 200, description: '审批成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '课程立项不存在' })
  @ApiResponse({ status: 400, description: '只能审批待审批状态的立项' })
  async approve(@Param('id') id: string, @Request() req) {
    return this.courseProjectsService.approve(id, req.user.id);
  }

  @Post(':id/reject')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '驳回课程立项' })
  @ApiResponse({ status: 200, description: '驳回成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '课程立项不存在' })
  @ApiResponse({ status: 400, description: '只能驳回待审批状态的立项' })
  async reject(@Param('id') id: string, @Body('reason') reason: string, @Request() req) {
    return this.courseProjectsService.reject(id, reason, req.user.id);
  }

  @Post(':id/publish')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '发布课程立项' })
  @ApiResponse({ status: 200, description: '发布成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '课程立项不存在' })
  @ApiResponse({ status: 400, description: '只能发布已审批通过的课程' })
  async publish(@Param('id') id: string, @Request() req) {
    return this.courseProjectsService.publish(id, req.user.id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '取消课程立项' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '课程立项不存在' })
  @ApiResponse({ status: 400, description: '已完成的课程不能取消' })
  async cancel(@Param('id') id: string, @Request() req) {
    return this.courseProjectsService.cancel(id, req.user.id);
  }

  @Get(':id/students')
  @Roles(UserRole.TRAINING_MANAGER, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: '获取课程学员列表' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '课程立项不存在' })
  async getStudents(@Param('id') id: string) {
    return this.courseProjectsService.getStudents(id);
  }

  @Post(':id/students')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '添加学员（报名）' })
  @ApiResponse({ status: 200, description: '添加成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '课程立项不存在' })
  @ApiResponse({ status: 400, description: '课程人数已满或学员已报名' })
  async addStudent(@Param('id') id: string, @Body() addStudentDto: AddStudentDto) {
    return this.courseProjectsService.addStudent(id, addStudentDto);
  }

  @Delete(':id/students/:studentId')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '移除学员' })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '课程立项或学员不存在' })
  async removeStudent(@Param('id') id: string, @Param('studentId') studentId: string, @Request() req) {
    return this.courseProjectsService.removeStudent(id, studentId, req.user);
  }

  @Post(':id/students/:studentId/absent')
  @Roles(UserRole.TRAINING_MANAGER, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: '标记学员缺席' })
  @ApiResponse({ status: 200, description: '标记成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '课程立项或学员不存在' })
  async markStudentAbsent(@Param('id') id: string, @Param('studentId') studentId: string, @Body() markAbsentDto: MarkAbsentDto) {
    return this.courseProjectsService.markStudentAbsent(id, studentId, markAbsentDto);
  }

  @Get(':id/remarks')
  @Roles(UserRole.TRAINING_MANAGER, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: '获取关联的培训需求备注' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '课程立项不存在' })
  async getRemarks(@Param('id') id: string) {
    return this.courseProjectsService.getRemarks(id);
  }
}