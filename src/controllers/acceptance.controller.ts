import { Controller, Post, Body, Get, Param, Request } from '@nestjs/common';
import { AcceptanceService } from '../services/acceptance.service';
import { SubmitAcceptanceDto, VerifyAcceptanceDto } from '../dto/acceptance.dto';
import { User } from '../entities/user.entity';

@Controller('acceptance')
export class AcceptanceController {
  constructor(private readonly acceptanceService: AcceptanceService) {}

  @Post('submit')
  submit(@Body() submitDto: SubmitAcceptanceDto, @Request() req: { user: User }) {
    return this.acceptanceService.submitAcceptance(submitDto, req.user);
  }

  @Post('verify')
  verify(@Body() verifyDto: VerifyAcceptanceDto, @Request() req: { user: User }) {
    return this.acceptanceService.verifyAcceptance(verifyDto, req.user);
  }

  @Get('history/:installationId')
  getHistory(@Param('installationId') installationId: string) {
    return this.acceptanceService.getAcceptanceHistory(installationId);
  }
}