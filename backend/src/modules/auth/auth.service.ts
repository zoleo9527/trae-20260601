import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface MockUser {
  id: string;
  username: string;
  password: string;
  role: 'consultant' | 'operations' | 'finance';
  name: string;
}

const SEED_USERS: MockUser[] = [
  { id: '1', username: 'consultant1', password: 'pass123', role: 'consultant', name: '张磊' },
  { id: '2', username: 'operations1', password: 'pass123', role: 'operations', name: '李敏' },
  { id: '3', username: 'finance1', password: 'pass123', role: 'finance', name: '王芳' },
];

@Injectable()
export class AuthService {
  private users: MockUser[] = [...SEED_USERS];

  constructor(private jwtService: JwtService) {}

  async login(username: string, password: string): Promise<{ access_token: string; user: Omit<MockUser, 'password'> } | null> {
    const user = this.users.find(u => u.username === username && u.password === password);
    if (!user) {
      return null;
    }

    const payload = { sub: user.id, username: user.username, role: user.role, name: user.name };
    const access_token = this.jwtService.sign(payload);

    const { password: _, ...result } = user;
    return { access_token, user: result };
  }

  async validateUser(payload: { sub: string; role: string }): Promise<Omit<MockUser, 'password'> | null> {
    const user = this.users.find(u => u.id === payload.sub);
    if (!user) {
      return null;
    }
    const { password: _, ...result } = user;
    return result;
  }

  async getMockUsers(): Promise<Omit<MockUser, 'password'>[]> {
    return this.users.map(({ password: _, ...result }) => result);
  }
}
