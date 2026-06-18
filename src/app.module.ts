
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { VolunteerModule } from './volunteer/volunteer.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { AuditModule } from './audit/audit.module';
import { ExceptionModule } from './exception/exception.module';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { SeederModule } from './seeder/seeder.module';
import { IdempotencyInterceptor } from './idempotency/idempotency.interceptor';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    VolunteerModule,
    RecruitmentModule,
    AuditModule,
    ExceptionModule,
    IdempotencyModule,
    SeederModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule {}
