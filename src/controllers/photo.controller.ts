import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, Res, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PhotoService } from '../services/photo.service';
import { UploadPhotoDto, PhotoQueryDto, VerifyPhotoDto } from '../dto/photo.dto';
import { User } from '../entities/user.entity';
import { CurrentUser } from '../auth/user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { UserRole } from '../entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import * as fs from 'fs';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

@Controller('photos')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post('upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  upload(@Body() uploadDto: UploadPhotoDto, @UploadedFile() file: MulterFile, @CurrentUser() user: User) {
    if (![UserRole.INSTALLER, UserRole.ADMIN].includes(user.role)) {
      throw new UnauthorizedException('只有安装师傅或管理员可以上传照片');
    }
    return this.photoService.upload(uploadDto, file, user);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@Query() query: PhotoQueryDto) {
    return this.photoService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.photoService.findOne(id);
  }

  @Get('installation/:installationId')
  @UseGuards(AuthGuard)
  findByInstallation(@Param('installationId') installationId: string) {
    return this.photoService.findByInstallation(installationId);
  }

  @Get('download/:fileName')
  @UseGuards(AuthGuard)
  download(@Param('fileName') fileName: string, @Res() res) {
    const filePath = this.photoService.getFilePath(fileName);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.status(404).send('File not found');
  }

  @Patch(':id/verify')
  @UseGuards(AuthGuard)
  verify(@Param('id') id: string, @Body() verifyDto: VerifyPhotoDto, @CurrentUser() user: User) {
    if (![UserRole.CUSTOMER_SERVICE, UserRole.ADMIN].includes(user.role)) {
      throw new UnauthorizedException('只有售后客服或管理员可以审核照片');
    }
    return this.photoService.verify(id, verifyDto, user);
  }

  @Patch('installation/:installationId/verify')
  @UseGuards(AuthGuard)
  verifyByInstallation(@Param('installationId') installationId: string, @Body() verifyDto: VerifyPhotoDto, @CurrentUser() user: User) {
    if (![UserRole.CUSTOMER_SERVICE, UserRole.ADMIN].includes(user.role)) {
      throw new UnauthorizedException('只有售后客服或管理员可以审核照片');
    }
    return this.photoService.verifyByInstallation(installationId, verifyDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    if (![UserRole.INSTALLER, UserRole.ADMIN].includes(user.role)) {
      throw new UnauthorizedException('只有安装师傅或管理员可以删除照片');
    }
    return this.photoService.remove(id);
  }
}
