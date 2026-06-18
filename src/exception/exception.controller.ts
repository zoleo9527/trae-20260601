
import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ExceptionService } from './exception.service';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { ResolveExceptionDto } from './dto/resolve-exception.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExceptionStatus } from '@prisma/client';

@Controller('exceptions')
@UseGuards(JwtAuthGuard)
export class ExceptionController {
  constructor(private readonly exceptionService: ExceptionService) {}

  @Post()
  create(@Body() createDto: CreateExceptionDto, @Request() req) {
    return this.exceptionService.create(createDto, req.user.userId);
  }

  @Get()
  findAll(
    @Query('status') status?: ExceptionStatus,
    @Query('severity') severity?: string,
  ) {
    return this.exceptionService.findAll(status, severity);
  }

  @Get('pending')
  getPendingExceptions() {
    return this.exceptionService.getPendingExceptions();
  }

  @Get('risks')
  getRiskItems() {
    return this.exceptionService.getRiskItems();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exceptionService.findOne(id);
  }

  @Patch(':id/resolve')
  resolve(@Param('id') id: string, @Body() resolveDto: ResolveExceptionDto, @Request() req) {
    return this.exceptionService.resolve(id, resolveDto, req.user.userId);
  }
}
