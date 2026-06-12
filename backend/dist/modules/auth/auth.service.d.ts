import { JwtService } from '@nestjs/jwt';
interface MockUser {
    id: string;
    username: string;
    password: string;
    role: 'consultant' | 'operations' | 'finance';
    name: string;
}
export declare class AuthService {
    private jwtService;
    private users;
    constructor(jwtService: JwtService);
    login(username: string, password: string): Promise<{
        access_token: string;
        user: Omit<MockUser, 'password'>;
    }>;
    validateUser(payload: {
        sub: string;
        role: string;
    }): Promise<Omit<MockUser, 'password'> | null>;
    getMockUsers(): Promise<Omit<MockUser, 'password'>[]>;
}
export {};
