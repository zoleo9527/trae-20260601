import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { InstallationService } from '../services/installation.service';
import { CreateInstallationDto, UpdateInstallationDto, InstallationQueryDto } from '../dto/installation.dto';
import { User } from '../entities/user.entity';
import { CurrentUser } from '../auth/user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { UserRole } from '../entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';

@Controller('installations')
export class InstallationController {
  constructor(private readonly installationService: InstallationService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createDto: CreateInstallationDto, @CurrentUser() user: User) {
    if (![UserRole.DISPATCHER, UserRole.ADMIN].includes(user.role)) {
      throw new UnauthorizedException('只有调度员或管理员可以创建工单');
    }
    return this.installationService.create(createDto, user);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@Query() query: InstallationQueryDto) {
    return this.installationService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.installationService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateDto: UpdateInstallationDto, @CurrentUser() user: User) {
    if (![UserRole.DISPATCHER, UserRole.ADMIN].includes(user.role)) {
      throw new UnauthorizedException('只有调度员或管理员可以修改工单');
    }
    return this.installationService.update(id, updateDto, user);
  }

  @Post(':id/dispatch')
  @UseGuards(AuthGuard)
  dispatch(@Param('id') id: string, @Body() body: { installerId: string }, @CurrentUser() user: User) {
    if (![UserRole.DISPATCHER, UserRole.ADMIN].includes(user.role)) {
      throw new UnauthorizedException('只有调度员或管理员可以派工');
    }
    return this.installationService.dispatch(id, body.installerId, user);
  }

  @Post(':id/complete')
  @UseGuards(AuthGuard)
  complete(@Param('id') id: string, @CurrentUser() user: User) {
    if (![UserRole.INSTALLER, UserRole.ADMIN].includes(user.role)) {
      throw new UnauthorizedException('只有安装师傅或管理员可以完成工单');
    }
    return this.installationService.complete(id, user);
  }

  @Get(':id/records')
  @UseGuards(AuthGuard)
  getRecords(@Param('id') id: string) {
    return this.installationService.getRecords(id);
  }
}