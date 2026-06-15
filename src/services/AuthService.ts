import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import Role from '../models/Role';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  realName: string;
  role: Role;
  storeId: number;
  phone: string;
}

class AuthService {
  async login(data: LoginRequest): Promise<{ user: User; token: string }> {
    const user = await User.findOne({ where: { username: data.username } });
    if (!user) {
      throw new Error('用户名或密码错误');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('用户名或密码错误');
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, storeId: user.storeId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    return { user, token };
  }

  async register(data: RegisterRequest): Promise<User> {
    const existingUser = await User.findOne({ where: { username: data.username } });
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await User.create({
      ...data,
      password: hashedPassword,
    });
  }

  async validateToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch {
      throw new Error('无效的token');
    }
  }

  async getUserById(id: number): Promise<User | null> {
    return await User.findByPk(id);
  }
}

export default new AuthService();