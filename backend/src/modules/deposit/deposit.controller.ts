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
import { DepositService, DepositFilters, CreateDepositData } from './deposit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('deposits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Post()
  @Roles('consultant')
  initiate(
    @Body() data: CreateDepositData,
    @CurrentUser() user: any,
  ) {
    return this.depositService.initiate(
      data,
      user.sub,
      user.name,
      user.role,
    );
  }

  @Get()
  findAll(@Query() filters: DepositFilters) {
    return this.depositService.findAll(filters);
  }

  @Get('disputes')
  @Roles('finance')
  getDisputes() {
    return this.depositService.getDisputes();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.depositService.findOne(id);
  }

  @Patch(':id/confirm')
  @Roles('finance')
  confirm(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.depositService.confirm(
      id,
      user.sub,
      user.name,
      user.role,
    );
  }

  @Patch(':id/dispute')
  @Roles('finance')
  dispute(
    @Param('id') id: string,
    @Body() data: { disputeReason: string; disputedAmount: number; deductionItems: { item: string; amount: number }[] },
    @CurrentUser() user: any,
  ) {
    return this.depositService.dispute(
      id,
      data,
      user.sub,
      user.name,
      user.role,
    );
  }

  @Patch(':id/resolve')
  @Roles('finance')
  resolve(
    @Param('id') id: string,
    @Body() resolution: { finalAmount: number; resolutionNotes: string },
    @CurrentUser() user: any,
  ) {
    return this.depositService.resolve(
      id,
      resolution,
      user.sub,
      user.name,
      user.role,
    );
  }

  @Patch(':id/settle')
  @Roles('finance')
  markSettled(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.depositService.markSettled(
      id,
      user.sub,
      user.name,
      user.role,
    );
  }
}
