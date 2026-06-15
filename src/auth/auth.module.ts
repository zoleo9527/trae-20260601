import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService, AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
