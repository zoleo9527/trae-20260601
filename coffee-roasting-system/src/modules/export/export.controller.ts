import { Controller, Get, UseGuards, Res } from '@nestjs/common';
import { ExportService } from './export.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import * as fs from 'fs';

@Controller('export')
@UseGuards(AuthGuard('jwt'))
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get('orders')
  async exportOrders(@Res() res: Response) {
    const csvPath = await this.exportService.exportOrders();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    const fileStream = fs.createReadStream(csvPath);
    fileStream.pipe(res);
  }

  @Get('tasks')
  async exportTasks(@Res() res: Response) {
    const csvPath = await this.exportService.exportTasks();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
    const fileStream = fs.createReadStream(csvPath);
    fileStream.pipe(res);
  }
}
