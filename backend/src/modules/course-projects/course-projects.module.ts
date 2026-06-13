import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseProjectsController } from './course-projects.controller';
import { CourseProjectsService } from './course-projects.service';
import { CourseProject } from '../../entities/course-project.entity';
import { TrainingNeed } from '../../entities/training-need.entity';
import { TrainingNeedRemark } from '../../entities/training-need-remark.entity';
import { Student } from '../../entities/student.entity';
import { User } from '../../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { StatusHistoryModule } from '../status-history/status-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseProject, TrainingNeed, TrainingNeedRemark, Student, User]),
    NotificationsModule,
    StatusHistoryModule,
  ],
  controllers: [CourseProjectsController],
  providers: [CourseProjectsService],
  exports: [CourseProjectsService],
})
export class CourseProjectsModule {}