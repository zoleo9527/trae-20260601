import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PhotoService } from '../services/photo.service';
import { UploadPhotoDto, PhotoQueryDto, VerifyPhotoDto } from '../dto/photo.dto';
import { User } from '../entities/user.entity';
import * as fs from 'fs';

@Controller('photos')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  upload(@Body() uploadDto: UploadPhotoDto, @UploadedFile() file: Express.Multer.File) {
    const mockUser: Partial<User> = { id: '2', name: '安装师傅' } as User;
    return this.photoService.upload(uploadDto, file, mockUser);
  }

  @Get()
  findAll(@Query() query: PhotoQueryDto) {
    return this.photoService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.photoService.findOne(id);
  }

  @Get('installation/:installationId')
  findByInstallation(@Param('installationId') installationId: string) {
    return this.photoService.findByInstallation(installationId);
  }

  @Get('download/:fileName')
  download(@Param('fileName') fileName: string, @Res() res) {
    const filePath = this.photoService.getFilePath(fileName);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.status(404).send('File not found');
  }

  @Patch(':id/verify')
  verify(@Param('id') id: string, @Body() verifyDto: VerifyPhotoDto) {
    const mockVerifier: Partial<User> = { id: '3', name: '客服' } as User;
    return this.photoService.verify(id, verifyDto, mockVerifier);
  }

  @Patch('installation/:installationId/verify')
  verifyByInstallation(@Param('installationId') installationId: string, @Body() verifyDto: VerifyPhotoDto) {
    const mockVerifier: Partial<User> = { id: '3', name: '客服' } as User;
    return this.photoService.verifyByInstallation(installationId, verifyDto, mockVerifier);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.photoService.remove(id);
  }
}