import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ViewingService, ViewingFilters } from './viewing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('viewings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ViewingController {
  constructor(private readonly viewingService: ViewingService) {}

  @Post()
  @Roles('consultant')
  create(
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.viewingService.create(
      {
        propertyId: body.propertyId,
        consultantId: body.consultantId,
        consultantName: body.consultantName,
        viewerName: body.viewerName,
        viewerCompany: body.viewerCompany,
        viewerContact: body.viewerContact,
        viewDate: new Date(body.viewDate),
      },
      user.userId ?? user.sub,
      user.userName ?? user.name,
      user.role,
    );
  }

  @Get()
  findAll(@Query() filters: ViewingFilters) {
    return this.viewingService.findAll(filters);
  }

  @Get('property/:propertyId/summary')
  getPropertyViewingSummary(@Param('propertyId') propertyId: string) {
    return this.viewingService.getPropertyViewingSummary(propertyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.viewingService.findOne(id);
  }

  @Patch(':id/feedback')
  @Roles('consultant')
  addFeedback(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.viewingService.addFeedback(
      id,
      {
        satisfaction: body.satisfaction,
        notes: body.notes,
        followUpAction: body.followUpAction,
      },
      user.userId ?? user.sub,
      user.userName ?? user.name,
      user.role,
    );
  }
}
