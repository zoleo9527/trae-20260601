import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTagDto, RemoveTagDto } from './interfaces/special-meal.interface';
import { SpecialMealService } from './special-meal.service';

@ApiTags('special-meal')
@Controller('special-meal')
export class SpecialMealController {
  constructor(private readonly specialMealService: SpecialMealService) {}

  @Get('student/:studentId/tags')
  @ApiOperation({ summary: '获取学生当前生效的特殊餐标签' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  getStudentTags(@Param('studentId') studentId: string) {
    return this.specialMealService.getStudentTags(studentId);
  }

  @Get('student/:studentId/logs')
  @ApiOperation({ summary: '获取学生特殊餐标签变更历史' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  getTagLogs(@Param('studentId') studentId: string) {
    return this.specialMealService.getTagLogs(studentId);
  }

  @Get('student/:studentId/review')
  @ApiOperation({ summary: '特殊餐标记回看（含关联订餐和风险项）' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  getReview(@Param('studentId') studentId: string) {
    return this.specialMealService.getReview(studentId);
  }

  @Get('students/all')
  @ApiOperation({ summary: '获取所有有特殊餐标记的学生' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  getAllSpecialStudents() {
    return this.specialMealService.getAllSpecialStudents();
  }

  @Post('tags')
  @ApiOperation({ summary: '新增特殊餐标记' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  addTag(@Body() dto: CreateTagDto) {
    const operator = { id: 'teacher-001', name: '王老师', role: 'class_teacher', email: 'wang@school.com' };
    return this.specialMealService.addTag(dto, operator as any);
  }

  @Delete('tags/:id')
  @ApiOperation({ summary: '移除特殊餐标记' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  removeTag(@Param('id') id: string, @Body() dto: RemoveTagDto) {
    const operator = { id: 'teacher-001', name: '王老师', role: 'class_teacher', email: 'wang@school.com' };
    return this.specialMealService.removeTag(id, dto, operator as any);
  }
}
