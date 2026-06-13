import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as path from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { TrainingNeedsModule } from './modules/training-needs/training-needs.module';
import { CourseProjectsModule } from './modules/course-projects/course-projects.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StatusHistoryModule } from './modules/status-history/status-history.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: path.join(__dirname, '../database/training.db'),
      entities: [path.join(__dirname, '**/*.entity{.ts,.js}')],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    TrainingNeedsModule,
    CourseProjectsModule,
    NotificationsModule,
    StatusHistoryModule,
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}