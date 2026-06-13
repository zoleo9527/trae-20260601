import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { LabelingHistoryService, LabelingHistoryItem } from './labeling-history.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('labeling-history')
@UseGuards(AuthGuard('jwt'))
export class LabelingHistoryController {
  constructor(private historyService: LabelingHistoryService) {}

  @Get()
  async getHistory(
    @Query('batchNo') batchNo?: string,
    @Query('productName') productName?: string,
    @Query('customerName') customerName?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<{ data: LabelingHistoryItem[]; total: number }> {
    return this.historyService.getLabelingHistory(batchNo, productName, customerName, page, limit);
  }

  @Get('batch/:batchNo')
  async getByBatchNo(@Param('batchNo') batchNo: string): Promise<LabelingHistoryItem[] | null> {
    return this.historyService.getLabelingByBatchNo(batchNo);
  }

  @Get('completed')
  async getCompleted(): Promise<LabelingHistoryItem[]> {
    return this.historyService.getCompletedLabelingTasks();
  }
}