import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { KeyTransferService, KeyTransferFilters } from './key-transfer.service';

@Controller('key-transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KeyTransferController {
  constructor(private readonly keyTransferService: KeyTransferService) {}

  @Post()
  @Roles('consultant')
  initiateTransfer(
    @Body() body: { propertyId: string; handoverId: string; keyCount: number; keyTypes: string[] },
    @CurrentUser() user: any,
  ) {
    return this.keyTransferService.initiateTransfer(
      body,
      user.sub,
      user.name,
      user.role,
    );
  }

  @Get('handover/:handoverId')
  @Roles('consultant', 'operations', 'finance')
  getByHandover(@Param('handoverId') handoverId: string) {
    return this.keyTransferService.getByHandover(handoverId);
  }

  @Get()
  @Roles('consultant', 'operations', 'finance')
  findAll(
    @Query() query: { propertyId?: string; handoverId?: string; status?: string },
  ) {
    const filters: KeyTransferFilters = {};
    if (query.propertyId) filters.propertyId = query.propertyId;
    if (query.handoverId) filters.handoverId = query.handoverId;
    if (query.status) filters.status = query.status;
    return this.keyTransferService.findAll(filters);
  }

  @Get(':id')
  @Roles('consultant', 'operations', 'finance')
  findOne(@Param('id') id: string) {
    return this.keyTransferService.findOne(id);
  }

  @Patch(':id/receive')
  @Roles('operations')
  confirmReception(@Param('id') id: string, @CurrentUser() user: any) {
    return this.keyTransferService.confirmReception(id, user.sub, user.name, user.role);
  }

  @Patch(':id/return')
  @Roles('operations')
  returnKeys(
    @Param('id') id: string,
    @Body() body: { returnNotes?: string },
    @CurrentUser() user: any,
  ) {
    return this.keyTransferService.returnKeys(id, body, user.sub, user.name, user.role);
  }

  @Get(':id/history')
  @Roles('consultant', 'operations', 'finance')
  getTransferHistory(@Param('id') id: string) {
    return this.keyTransferService.getTransferHistory(id);
  }

  @Get(':id/timeline')
  @Roles('consultant', 'operations', 'finance')
  getTransferTimeline(@Param('id') id: string) {
    return this.keyTransferService.getTransferTimeline(id);
  }
}
