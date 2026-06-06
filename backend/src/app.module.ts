import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { DocksModule } from './modules/docks/docks.module';
import { User } from './entities/user.entity';
import { Dock } from './entities/dock.entity';
import { Appointment } from './entities/appointment.entity';
import { StatusLog } from './entities/status-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'logistics_dock',
      entities: [User, Dock, Appointment, StatusLog],
      synchronize: true,
      logging: true,
    }),
    AuthModule,
    AppointmentsModule,
    DocksModule,
  ],
})
export class AppModule {}
