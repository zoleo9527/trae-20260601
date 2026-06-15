import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { User, UserRole } from '../entities/user.entity';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { UnauthorizedException } from '@nestjs/common';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('只有管理员可以创建用户');
    }
    return this.userService.create(createUserDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@Query('role') role?: UserRole) {
    return this.userService.findAll(role);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('只有管理员可以更新用户');
    }
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('只有管理员可以删除用户');
    }
    return this.userService.remove(id);
  }
}