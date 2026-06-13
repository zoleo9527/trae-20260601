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
  @ApiResponse({ status: