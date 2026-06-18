
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { CreateRecruitmentDto } from './dto/create-recruitment.dto';
import { UpdateRecruitmentDto } from './dto/update-recruitment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecruitmentStatus } from '@prisma/client';

@Controller('recruitments')
@UseGuards(JwtAuthGuard)
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Post()
  create(@Body() createDto: CreateRecruitmentDto, @Request() req) {
    return this.recruitmentService.create(createDto, req.user.userId);
  }

  @Get()
  findAll(@Query('status') status?: RecruitmentStatus) {
    return this.recruitmentService.findAll(status);
  }

  @Get('active')
  getActiveRecruitments() {
    return this.recruitmentService.getActiveRecruitments();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recruitmentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateRecruitmentDto, @Request() req) {
    return this.recruitmentService.update(id, updateDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recruitmentService.remove(id);
  }
}
