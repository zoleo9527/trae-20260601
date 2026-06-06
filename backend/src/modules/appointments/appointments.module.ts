import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from '../../entities/appointment.entity';
import { StatusLog } from '../../entities/status-log.entity';
import { Dock } from '../../entities/dock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, StatusLog, Dock])],
  providers: [AppointmentsService],
  controllers: [AppointmentsController],
})
export class AppointmentsModule {}
