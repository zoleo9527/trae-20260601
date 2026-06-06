import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    this.seedUsers();
  }

  private async seedUsers() {
    const count = await this.usersRepository.count();
    if (count === 0) {
      const users = [
        { name: '张调度', username: 'dispatcher', password: '123456', role: UserRole.DISPATCHER },
        { name: '李班长', username: 'forkman', password: '123456', role: UserRole.FORKMAN },
        { name: '王文员', username: 'clerk', password: '123456', role: UserRole.CLERK },
      ];
      await this.usersRepository.save(users);
    }
  }

  async login(username: string, password: string) {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user || user.password !== password) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const { password: _, ...result } = user;
    return result;
  }

  async findAll() {
    return this.usersRepository.find({ select: ['id', 'name', 'username', 'role'] });
  }
}
