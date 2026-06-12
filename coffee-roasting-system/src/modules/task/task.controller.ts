import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskType, TaskStatus } from '../../entities/task.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get()
  async findAll() {
    return this.taskService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  @Get('order/:orderId')
  async findByOrderId(@Param('orderId') orderId: string) {
    return this.taskService.findByOrderId(orderId);
  }

  @Get('assignee/:assigneeId')
  async findByAssigneeId(@Param('assigneeId') assigneeId: string) {
    return this.taskService.findByAssigneeId(assigneeId);
  }

  @Get('pending/:type')
  async findPendingByType(@Param('type') type: TaskType) {
    return this.taskService.findPendingByType(type);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: TaskStatus; batchNo?: string; labelContent?: string }) {
    return this.taskService.updateStatus(id, body.status, body.batchNo, body.labelContent);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const updateData: Partial<Task> = {};
    if (body.status !== undefined) updateData.status = body.status as TaskStatus;
    if (body.batchNo !== undefined) updateData.batchNo = body.batchNo as string;
    if (body.labelContent !== undefined) updateData.labelContent = body.labelContent as string;
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId as string;
    
    return this.taskService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.taskService.remove(id);
    return { message: '任务已删除' };
  }
}