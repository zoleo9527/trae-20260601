import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from '../entities/photo.entity';
import { Installation } from '../entities/installation.entity';
import { PhotoService } from '../services/photo.service';
import { PhotoController } from '../controllers/photo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Photo, Installation])],
  providers: [PhotoService],
  controllers: [PhotoController],
  exports: [PhotoService],
})
export class PhotoModule {}
