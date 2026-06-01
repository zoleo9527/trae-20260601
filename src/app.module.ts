import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { PrescriptionModule } from './modules/prescription/prescription.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OffShelfModule } from './modules/off-shelf/off-shelf.module';
import { TransferModule } from './modules/transfer/transfer.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: './data/pharmacy_ops.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
    }),
    CommonModule,
    PrescriptionModule,
    InventoryModule,
    OffShelfModule,
    TransferModule,
    AuditModule,
  ],
})
export class AppModule {}
