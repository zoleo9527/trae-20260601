import { Controller, Get, Post, Body, Patch, Param, Query, Request } from '@nestjs/common';
import { InstallationService } from '../services/installation.service';
import { CreateInstallationDto, UpdateInstallationDto, InstallationQueryDto } from '../dto/installation.dto';
import { User } from '../entities/user.entity';

@Controller('installations')
export class InstallationController {
  constructor(private readonly installationService: InstallationService) {}

  @Post()
  create(@Body() createDto: CreateInstallationDto, @Request() req: { user: User }) {
    return this.installationService.create(createDto, req.user);
  }

  @Get()
  findAll(@Query() query: InstallationQueryDto) {
    return this.installationService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.installationService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateInstallationDto, @Request() req: { user: User }) {
    return this.installationService.update(id, updateDto, req.user);
  }

  @Post(':id/dispatch')
  dispatch(@Param('id') id: string, @Body() body: { installerId: string }, @Request() req: { user: User }) {
    return this.installationService.dispatch(id, body.installerId, req.user);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Request() req: { user: User }) {
    return this.installationService.complete(id, req.user);
  }

  @Get(':id/records')
  getRecords(@Param('id') id: string) {
    return this.installationService.getRecords(id);
  }
}