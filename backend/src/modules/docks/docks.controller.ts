import { Controller, Get, Param } from '@nestjs/common';
import { DocksService } from './docks.service';

@Controller('docks')
export class DocksController {
  constructor(private readonly docksService: DocksService) {}

  @Get()
  findAll() {
    return this.docksService.findAll();
  }

  @Get('available')
  findAvailable() {
    return this.docksService.findAvailable();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.docksService.findOne(id);
  }
}
