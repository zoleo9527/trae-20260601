import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLog } from './entities/operation-log.entity';
import { OperationLogService } from './services/operation-log.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OperationLog])],
  providers: [OperationLogService],
  exports: [OperationLogService],
})
export class CommonModule {}
