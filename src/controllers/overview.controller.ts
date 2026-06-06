import { Controller, Get } from '@nestjs/common';
import { OverviewService } from '../services/overview.service';
import { ApiResponse } from '../common/response';

@Controller('api/overview')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get('todos')
  async getTodoOverview() {
    try {
      const data = await this.overviewService.getTodoOverview();
      return ApiResponse.success(data);
    } catch (e) {
      return ApiResponse.error(e.getStatus ? e.getStatus() : 50000, e.message);
    }
  }
}
