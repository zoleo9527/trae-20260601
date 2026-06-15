import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { AcceptanceService } from '../services/acceptance.service';
import { SubmitAcceptanceDto, VerifyAcceptanceDto } from '../dto/acceptance.dto';
import { User } from '../entities/user.entity';
import { CurrentUser } from '../auth/user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { UserRole } from '../entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';

@Controller('acceptance')
export class AcceptanceController {
  constructor(private readonly acceptanceService: AcceptanceService) {}

  @Post('submit')
  @UseGuards(AuthGuard)
  submit(@Body() submitDto: SubmitAcceptanceDto, @CurrentUser() user: User) {
    if (![UserRole.INSTALLER, UserRole.ADMIN].includes(user.role)) {
      throw new UnauthorizedException('只有安装师傅或管理员可以提交验收');
    }
    return this.acceptanceService.submitAcceptance(submitDto, user);
  }

  @Post('verify')
  @UseGuards(AuthGuard)
  verify(@Body() verifyDto: VerifyAcceptanceDto, @CurrentUser() user: User) {
    if (![UserRole.CUSTOMER_SERVICE, UserRole.ADMIN].includes(user.role)) {
      throw new UnauthorizedException('只有售后客服或管理员可以确认验收');
    }
    return this.acceptanceService.verifyAcceptance(verifyDto, user);
  }

  @Get('history/:installationId')
  @UseGuards(AuthGuard)
  getHistory(@Param('installationId') installationId: string) {
    return this.acceptanceService.getAcceptanceHistory(installationId);
  }
}