import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt-payload.interface';
export declare class AuthService {
    private userRepository;
    private readonly jwtSecret;
    private readonly jwtExpiresIn;
    constructor(userRepository: Repository<User>);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            username: string;
            name: string;
            email: string;
            role: import("../../entities/user.entity").UserRole;
            department: string;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            username: string;
            name: string;
            email: string;
            role: import("../../entities/user.entity").UserRole;
            department: string;
        };
    }>;
    validateUser(payload: JwtPayload): Promise<User>;
    getProfile(userId: string): Promise<{
        id: string;
        username: string;
        name: string;
        email: string;
        phone: string;
        department: string;
        role: import("../../entities/user.entity").UserRole;
        createdAt: Date;
    }>;
}
