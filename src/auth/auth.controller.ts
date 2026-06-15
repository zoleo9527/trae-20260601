import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { ResponseTransformInterceptor } from '../common/interceptors/response.interceptor';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('认证')
@UseInterceptors(ResponseTransformInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '登录', description: '使用用户名密码登录获取Token' })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };
  }

  @Get('users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.RECEPTIONIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取所有用户列表（店长/前台可用）' })
  async findAll() {
    return this.authService.findAllUsers();
  }

  @Get('users/technicians')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.RECEPTIONIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取维修师列表（用于分配工单）' })
  async getTechnicians() {
    return this.authService.findByRole(UserRole.TECHNICIAN);
  }
}
