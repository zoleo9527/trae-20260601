import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrderStatus } from '../common/enums';
import { BatchConfirmOrderDto, BatchCreateOrderDto, CreateOrderDto } from './interfaces/student-meal.interface';
import { StudentMealService } from './student-meal.service';

@ApiTags('student-meal')
@Controller('student-meal')
export class StudentMealController {
  constructor(private readonly studentMealService: StudentMealService) {}

  @Get()
  @ApiOperation({ summary: '获取订餐列表' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  findAll(
    @Query('date') date?: string,
    @Query('classId') classId?: string,
    @Query('status') status?: OrderStatus,
    @Query('studentId') studentId?: string
  ) {
    return this.studentMealService.findAll({ date, classId, status, studentId });
  }

  @Get('stats')
  @ApiOperation({ summary: '获取订餐统计' })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'classId', required: false })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  getStats(@Query('date') date: string, @Query('classId') classId?: string) {
    return this.studentMealService.getStats(date, classId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订餐详情' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  findOne(@Param('id') id: string) {
    return this.studentMealService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建单条订餐' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  create(@Body() dto: CreateOrderDto) {
    const operator = { id: 'teacher-001', name: '王老师', role: 'class_teacher', email: 'wang@school.com' };
    return this.studentMealService.create(dto, operator as any);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量创建订餐' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  batchCreate(@Body() dto: BatchCreateOrderDto) {
    const operator = { id: 'teacher-001', name: '王老师', role: 'class_teacher', email: 'wang@school.com' };
    return this.studentMealService.batchCreate(dto, operator as any);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认订餐' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  confirm(@Param('id') id: string) {
    const operator = { id: 'teacher-001', name: '王老师', role: 'class_teacher', email: 'wang@school.com' };
    return this.studentMealService.confirm(id, operator as any);
  }

  @Post('batch-confirm')
  @ApiOperation({ summary: '批量确认订餐' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  batchConfirm(@Body() dto: BatchConfirmOrderDto) {
    const operator = { id: 'teacher-001', name: '王老师', role: 'class_teacher', email: 'wang@school.com' };
    return this.studentMealService.batchConfirm(dto, operator as any);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消订餐' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  cancel(@Param('id') id: string, @Body('reason') reason: string) {
    const operator = { id: 'teacher-001', name: '王老师', role: 'class_teacher', email: 'wang@school.com' };
    return this.studentMealService.cancel(id, reason, operator as any);
  }

  @Post(':id/serve')
  @ApiOperation({ summary: '标记已配餐' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  markServed(@Param('id') id: string) {
    const operator = { id: 'admin-001', name: '食堂管理员', role: 'canteen_admin', email: 'canteen@school.com' };
    return this.studentMealService.markServed(id, operator as any);
  }

  @Get('students/by-class/:classId')
  @ApiOperation({ summary: '获取班级学生列表' })
  getStudentsByClass(@Param('classId') classId: string) {
    return this.studentMealService.getStudentsByClass(classId);
  }

  @Get('classes/all')
  @ApiOperation({ summary: '获取所有班级' })
  getAllClasses() {
    return this.studentMealService.getAllClasses();
  }
}
