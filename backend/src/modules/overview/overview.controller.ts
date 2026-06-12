import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OverviewService } from './overview.service';

@Controller('overview')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get('disputes')
  @Roles('consultant', 'operations', 'finance')
  getDisputeOverview() {
    return this.overviewService.getDisputeOverview();
  }

  @Get('dashboard')
  getRoleDashboard(@CurrentUser() user: any) {
    return this.overviewService.getRoleDashboard(user.role);
  }
}
