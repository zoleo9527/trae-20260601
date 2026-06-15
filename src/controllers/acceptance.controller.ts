import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AcceptanceService } from '../services/acceptance.service';
import { SubmitAcceptanceDto, VerifyAcceptanceDto } from '../dto/acceptance.dto';
import { User } from '../entities/user.entity';

@Controller('acceptance')
export class AcceptanceController {
  constructor(private readonly acceptanceService: AcceptanceService) {}

  @Post('submit')
  submit(@Body() submitDto: SubmitAcceptanceDto) {
    const mockInstaller: Partial<User> = { id: '2', name: '安装师傅' } as User;
    return this.acceptanceService.submitAcceptance(submitDto, mockInstaller);
  }

  @Post('verify')
  verify(@Body() verifyDto: VerifyAcceptanceDto) {
    const mockVerifier: Partial<User> = { id: '3', name: '客服' } as User;
    return this.acceptanceService.verifyAcceptance(verifyDto, mockVerifier);
  }

  @Get('history/:installationId')
  getHistory(@Param('installationId') installationId: string) {
    return this.acceptanceService.getAcceptanceHistory(installationId);
  }
}