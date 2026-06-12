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
import { PropertyService, PropertyFilters, CreatePropertyData } from './property.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('properties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Get()
  findAll(@Query() filters: PropertyFilters) {
    return this.propertyService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertyService.findOne(id);
  }

  @Post()
  @Roles('consultant')
  create(
    @Body() data: CreatePropertyData,
    @CurrentUser() user: any,
  ) {
    return this.propertyService.create(
      data,
      user.sub,
      user.name,
      user.role,
    );
  }

  @Patch(':id/status')
  @Roles('consultant', 'operations')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: any,
  ) {
    return this.propertyService.updateStatus(
      id,
      status,
      user.sub,
      user.name,
      user.role,
    );
  }

  @Get(':id/history')
  getStatusHistory(@Param('id') id: string) {
    return this.propertyService.getStatusHistory(id);
  }
}
