import { Controller, Put, Param, Body, UseGuards } from '@nestjs/common';
import { TaskWorkflowService } from './task-workflow.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('workflow')
@UseGuards(AuthGuard('jwt'))
export class TaskWorkflowController {
  constructor(private workflowService: TaskWorkflowService) {}

  @Put('tasks/:id/start')
  async startTask(@Param('id') id: string) {
    return this.workflowService.startTask(id);
  }

  @Put('tasks/:id/packing/complete')
  async completePacking(@Param('id') id: string, @Body() body: { batchNo: string }) {
    return this.workflowService.completePacking(id, body.batchNo);
  }

  @Put('tasks/:id/labeling/complete')
  async completeLabeling(@Param('id') id: string, @Body() body: { batchNo: string; labelContent: string }) {
    return this.workflowService.completeLabeling(id, body.batchNo, body.labelContent);
  }

  @Put('tasks/:id/inspection/complete')
  async completeInspection(@Param('id') id: string) {
    return this.workflowService.completeInspection(id);
  }

  @Put('tasks/:id/warehouse/complete')
  async completeWarehouse(@Param('id') id: string) {
    return this.workflowService.completeWarehouse(id);
  }
}
