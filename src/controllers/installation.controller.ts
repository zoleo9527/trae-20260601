import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { InstallationService } from '../services/installation.service';
import { CreateInstallationDto, UpdateInstallationDto, InstallationQueryDto } from '../dto/installation.dto';
import { User } from '../entities/user.entity';

@Controller('installations')
export class InstallationController {
  constructor(private readonly installationService: InstallationService) {}

  @Post()
  create(@Body() createDto: CreateInstallationDto) {
    const mockDispatcher: Partial<User> = { id: '1', name: '调度员' } as User;
    return this.installationService.create(createDto, mockDispatcher);
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
  update(@Param('id') id: string, @Body() updateDto: UpdateInstallationDto) {
    const mockOperator: Partial<User> = { id: '1', name: '操作员' } as User;
    return this.installationService.update(id, updateDto, mockOperator);
  }

  @Post(':id/dispatch')
  dispatch(@Param('id') id: string, @Body() body: { installerId: string }) {
    const mockDispatcher: Partial<User> = { id: '1', name: '调度员' } as User;
    return this.installationService.dispatch(id, body.installerId, mockDispatcher);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    const mockInstaller: Partial<User> = { id: '2', name: '安装师傅' } as User;
    return this.installationService.complete(id, mockInstaller);
  }

  @Get(':id/records')
  getRecords(@Param('id') id: string) {
    return this.installationService.getRecords(id);
  }
}