import { Module } from '@nestjs/common';
import { RoleEntranceController } from './role-entrance.controller';

@Module({
  controllers: [RoleEntranceController],
})
export class RoleEntranceModule {}
