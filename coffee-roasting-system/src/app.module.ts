import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { typeOrmConfig } from './config/typeorm.config';
import { UserModule } from './modules/user/user.module';
import { OrderModule } from './modules/order/order.module';
import { TaskModule } from './modules/task/task.module';
import { NoteModule } from './modules/note/note.module';
import { ExportModule } from './modules/export/export.module';
import { SeedModule } from './modules/seed/seed.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    JwtModule.register({
      secret: 'coffee_roasting_secret_key_2026',
      signOptions: { expiresIn: '24h' },
    }),
    PassportModule,
    UserModule,
    OrderModule,
    TaskModule,
    NoteModule,
    ExportModule,
    SeedModule,
  ],
})
export class AppModule {}
