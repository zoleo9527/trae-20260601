import { Module } from '@nestjs/common';
import { MemberService } from './services/member.service';
import { ReminderService } from './services/reminder.service';
import { OperationLogService } from './services/operation-log.service';
import { ClerkController } from './controllers/clerk.controller';
import { ManagerController } from './controllers/manager.controller';
import { PurchaserController } from './controllers/purchaser.controller';

@Module({
  controllers: [ClerkController, ManagerController, PurchaserController],
  providers: [MemberService, ReminderService, OperationLogService],
  exports: [MemberService, ReminderService, OperationLogService],
})
export class AppModule {}