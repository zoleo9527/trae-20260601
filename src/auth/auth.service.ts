import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const count = await this.userRepo.count();
    if (count === 0) {
      const salt = await bcrypt.genSalt();
      const defaultUsers = [
        {
          username: 'reception',
          password: await bcrypt.hash('123456', salt),
          name: '张前台',
          role: UserRole.RECEPTIONIST,
        },
        {
          username: 'tech01',
          password: await bcrypt.hash('123456', salt),
          name: '李师傅',
          role: UserRole.TECHNICIAN,
        },
        {
          username: 'manager',
          password: await bcrypt.hash('123456', salt),
          name: '王店长',
          role: UserRole.MANAGER,
        },
      ];
      await this.userRepo.save(defaultUsers);
    }
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userRepo.findOne({
      where: { username: dto.username, isActive: true },
    });

    if (!user) {
      throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      accessToken,
      role: user.role,
      username: user.username,
      name: user.name,
      userId: user.id,
    };
  }

  async findAllUsers(): Promise<User[]> {
    return this.userRepo.find({
      select: ['id', 'username', 'name', 'role', 'isActive', 'createdAt'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepo.find({
      where: { role, isActive: true },
      select: ['id', 'username', 'name', 'role'],
    });
  }
}
