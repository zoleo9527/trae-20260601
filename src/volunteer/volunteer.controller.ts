
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { VolunteerService } from './volunteer.service';
import { CreateVolunteerDto } from './dto/create-volunteer.dto';
import { UpdateVolunteerDto } from './dto/update-volunteer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VolunteerStatus } from '@prisma/client';

@Controller('volunteers')
@UseGuards(JwtAuthGuard)
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}

  @Post()
  create(@Body() createVolunteerDto: CreateVolunteerDto, @Request() req) {
    return this.volunteerService.create(createVolunteerDto, req.user.userId);
  }

  @Get()
  findAll(@Query('status') status?: VolunteerStatus) {
    return this.volunteerService.findAll(status);
  }

  @Get('pending/count')
  getPendingCount() {
    return this.volunteerService.getPendingCount();
  }

  @Get('recent')
  getRecentChanges(@Query('limit') limit?: number) {
    return this.volunteerService.getRecentChanges(limit || 10);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.volunteerService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVolunteerDto: UpdateVolunteerDto, @Request() req) {
    return this.volunteerService.update(id, updateVolunteerDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.volunteerService.remove(id);
  }
}
