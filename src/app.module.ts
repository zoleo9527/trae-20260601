import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user.module';
import { InstallationModule } from './modules/installation.module';
import { PhotoModule } from './modules/photo.module';
import { AcceptanceModule } from './modules/acceptance.module';
import { User } from './entities/user.entity';
import { Installation } from './entities/installation.entity';
import { InstallationRecord } from './entities/installation-record.entity';
import { Photo } from './entities/photo.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [User, Installation, InstallationRecord, Photo],
      synchronize: true,
    }),
    UserModule,
    InstallationModule,
    PhotoModule,
    AcceptanceModule,
  ],
})
export class AppModule {}
